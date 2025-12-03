/**
 * Storage Service - CRUD operations for flashcard data
 */

import { getDB, generateId } from './db';
import type {
	Flashcard,
	Deck,
	ReviewLog,
	DailyStats,
	DeckSettings,
	SM2State,
	CardStatus
} from './types';
import { DEFAULT_DECK_SETTINGS, DEFAULT_SM2_STATE, Rating } from './types';
import { calculateNextState, determineCardStatus, isDue, isNew } from './sm2';

// ============================================
// DECK OPERATIONS
// ============================================

/**
 * Create a new deck
 */
export async function createDeck(
	name: string,
	description?: string,
	settings?: Partial<DeckSettings>
): Promise<Deck> {
	const db = await getDB();
	const now = Date.now();

	const deck: Deck = {
		id: generateId(),
		name,
		description,
		settings: { ...DEFAULT_DECK_SETTINGS, ...settings },
		createdAt: now,
		updatedAt: now
	};

	await db.add('decks', deck);
	return deck;
}

/**
 * Get a deck by ID
 */
export async function getDeck(id: string): Promise<Deck | undefined> {
	const db = await getDB();
	return db.get('decks', id);
}

/**
 * Get all decks
 */
export async function getAllDecks(): Promise<Deck[]> {
	const db = await getDB();
	return db.getAll('decks');
}

/**
 * Update a deck
 */
export async function updateDeck(
	id: string,
	updates: Partial<Omit<Deck, 'id' | 'createdAt'>>
): Promise<Deck | undefined> {
	const db = await getDB();
	const deck = await db.get('decks', id);
	if (!deck) return undefined;

	const updated: Deck = {
		...deck,
		...updates,
		settings: updates.settings ? { ...deck.settings, ...updates.settings } : deck.settings,
		updatedAt: Date.now()
	};

	await db.put('decks', updated);
	return updated;
}

/**
 * Delete a deck and all its cards
 */
export async function deleteDeck(id: string): Promise<void> {
	const db = await getDB();

	// Delete all cards in the deck
	const cards = await db.getAllFromIndex('cards', 'by-deck', id);
	const cardIds = cards.map((c) => c.id);

	const tx = db.transaction(['decks', 'cards', 'reviews', 'dailyStats'], 'readwrite');

	// Delete deck
	await tx.objectStore('decks').delete(id);

	// Delete cards
	for (const cardId of cardIds) {
		await tx.objectStore('cards').delete(cardId);
	}

	// Delete reviews for those cards
	const reviewStore = tx.objectStore('reviews');
	const reviews = await reviewStore.index('by-deck').getAll(id);
	for (const review of reviews) {
		await reviewStore.delete(review.id);
	}

	// Delete daily stats
	const statsStore = tx.objectStore('dailyStats');
	const stats = await statsStore.index('by-deck').getAll(id);
	for (const stat of stats) {
		await statsStore.delete([stat.date, stat.deckId]);
	}

	await tx.done;
}

// ============================================
// CARD OPERATIONS
// ============================================

/**
 * Create a new card
 */
export async function createCard(
	card: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<Flashcard> {
	const db = await getDB();
	const now = Date.now();

	const newCard: Flashcard = {
		...card,
		id: generateId(),
		status: determineCardStatus(card.state),
		createdAt: now,
		updatedAt: now
	};

	await db.add('cards', newCard);
	return newCard;
}

/**
 * Create multiple cards (batch)
 */
export async function createCards(
	cards: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt' | 'status'>[]
): Promise<Flashcard[]> {
	const db = await getDB();
	const now = Date.now();

	const newCards: Flashcard[] = cards.map((card) => ({
		...card,
		id: generateId(),
		status: determineCardStatus(card.state),
		createdAt: now,
		updatedAt: now
	}));

	const tx = db.transaction('cards', 'readwrite');
	await Promise.all(newCards.map((card) => tx.store.add(card)));
	await tx.done;

	return newCards;
}

/**
 * Get a card by ID
 */
export async function getCard(id: string): Promise<Flashcard | undefined> {
	const db = await getDB();
	return db.get('cards', id);
}

/**
 * Get all cards in a deck
 */
export async function getCardsByDeck(deckId: string): Promise<Flashcard[]> {
	const db = await getDB();
	return db.getAllFromIndex('cards', 'by-deck', deckId);
}

/**
 * Get all cards across all decks
 */
export async function getAllCards(): Promise<Flashcard[]> {
	const db = await getDB();
	return db.getAll('cards');
}

/**
 * Get cards due for review in a deck
 */
export async function getDueCards(deckId: string, limit?: number): Promise<Flashcard[]> {
	const db = await getDB();
	const cards = await db.getAllFromIndex('cards', 'by-deck', deckId);

	const now = Date.now();
	const dueCards = cards
		.filter((c) => c.status !== 'suspended' && !isNew(c.state) && isDue(c.state, now))
		.sort((a, b) => a.state.dueDate - b.state.dueDate); // Most overdue first

	return limit ? dueCards.slice(0, limit) : dueCards;
}

/**
 * Get new cards in a deck
 */
export async function getNewCards(deckId: string, limit?: number): Promise<Flashcard[]> {
	const db = await getDB();
	const cards = await db.getAllFromIndex('cards', 'by-deck', deckId);

	const newCards = cards
		.filter((c) => c.status !== 'suspended' && isNew(c.state))
		.sort((a, b) => a.createdAt - b.createdAt); // Oldest first

	return limit ? newCards.slice(0, limit) : newCards;
}

/**
 * Get cards by status
 */
export async function getCardsByStatus(deckId: string, status: CardStatus): Promise<Flashcard[]> {
	const db = await getDB();
	return db.getAllFromIndex('cards', 'by-deck-status', [deckId, status]);
}

/**
 * Find card by source (for duplicate detection)
 */
export async function findCardBySource(
	deckId: string,
	sourceType: string,
	sourceKey: string
): Promise<Flashcard | undefined> {
	const cards = await getCardsByDeck(deckId);
	return cards.find((c) => {
		if (c.source.type !== sourceType) return false;
		if (sourceType === 'vocab') {
			const vocabSource = c.source as { type: 'vocab'; word: string };
			return vocabSource.word === sourceKey;
		}
		if (sourceType === 'kanji') {
			const kanjiSource = c.source as { type: 'kanji'; kanji: string };
			return kanjiSource.kanji === sourceKey;
		}
		return false;
	});
}

/**
 * Update a card
 */
export async function updateCard(
	id: string,
	updates: Partial<Omit<Flashcard, 'id' | 'createdAt'>>
): Promise<Flashcard | undefined> {
	const db = await getDB();
	const card = await db.get('cards', id);
	if (!card) return undefined;

	const updated: Flashcard = {
		...card,
		...updates,
		status: updates.state ? determineCardStatus(updates.state) : card.status,
		updatedAt: Date.now()
	};

	await db.put('cards', updated);
	return updated;
}

/**
 * Delete a card
 */
export async function deleteCard(id: string): Promise<void> {
	const db = await getDB();

	const tx = db.transaction(['cards', 'reviews'], 'readwrite');

	// Delete card
	await tx.objectStore('cards').delete(id);

	// Delete associated reviews
	const reviewStore = tx.objectStore('reviews');
	const reviews = await reviewStore.index('by-card').getAll(id);
	for (const review of reviews) {
		await reviewStore.delete(review.id);
	}

	await tx.done;
}

/**
 * Delete multiple cards
 */
export async function deleteCards(ids: string[]): Promise<void> {
	const db = await getDB();

	const tx = db.transaction(['cards', 'reviews'], 'readwrite');
	const cardStore = tx.objectStore('cards');
	const reviewStore = tx.objectStore('reviews');

	for (const id of ids) {
		await cardStore.delete(id);

		// Delete associated reviews
		const reviews = await reviewStore.index('by-card').getAll(id);
		for (const review of reviews) {
			await reviewStore.delete(review.id);
		}
	}

	await tx.done;
}

/**
 * Suspend or unsuspend a card
 */
export async function setCardSuspended(id: string, suspended: boolean): Promise<Flashcard | undefined> {
	const db = await getDB();
	const card = await db.get('cards', id);
	if (!card) return undefined;

	const updated: Flashcard = {
		...card,
		status: suspended ? 'suspended' : determineCardStatus(card.state),
		updatedAt: Date.now()
	};

	await db.put('cards', updated);
	return updated;
}

/**
 * Move card to different deck
 */
export async function moveCard(cardId: string, newDeckId: string): Promise<Flashcard | undefined> {
	return updateCard(cardId, { deckId: newDeckId });
}

// ============================================
// REVIEW OPERATIONS
// ============================================

/**
 * Record a review and update card scheduling
 */
export async function recordReview(
	cardId: string,
	rating: Rating,
	responseTimeMs: number
): Promise<{ card: Flashcard; log: ReviewLog } | undefined> {
	const db = await getDB();
	const card = await db.get('cards', cardId);
	if (!card) return undefined;

	const now = Date.now();
	const previousState = { ...card.state };
	const newState = calculateNextState(card.state, rating, now);

	// Create review log
	const log: ReviewLog = {
		id: generateId(),
		cardId,
		deckId: card.deckId,
		rating,
		responseTimeMs,
		previousState,
		newState,
		reviewedAt: now
	};

	// Update card
	const updatedCard: Flashcard = {
		...card,
		state: newState,
		status: determineCardStatus(newState),
		updatedAt: now
	};

	// Save both in transaction
	const tx = db.transaction(['cards', 'reviews'], 'readwrite');
	await tx.objectStore('cards').put(updatedCard);
	await tx.objectStore('reviews').add(log);
	await tx.done;

	// Update daily stats
	await updateDailyStatsForReview(card.deckId, rating, responseTimeMs, isNew(previousState));

	return { card: updatedCard, log };
}

/**
 * Get review history for a card
 */
export async function getCardReviewHistory(cardId: string): Promise<ReviewLog[]> {
	const db = await getDB();
	const reviews = await db.getAllFromIndex('reviews', 'by-card', cardId);
	return reviews.sort((a, b) => b.reviewedAt - a.reviewedAt); // Most recent first
}

/**
 * Get reviews by date range
 */
export async function getReviewsByDateRange(
	deckId: string | null,
	startDate: number,
	endDate: number
): Promise<ReviewLog[]> {
	const db = await getDB();

	let reviews: ReviewLog[];
	if (deckId) {
		reviews = await db.getAllFromIndex('reviews', 'by-deck', deckId);
	} else {
		reviews = await db.getAll('reviews');
	}

	return reviews.filter((r) => r.reviewedAt >= startDate && r.reviewedAt <= endDate);
}

// ============================================
// STATISTICS OPERATIONS
// ============================================

/**
 * Get today's date string in YYYY-MM-DD format
 */
function getTodayString(): string {
	return new Date().toISOString().split('T')[0];
}

/**
 * Get or create daily stats for today
 */
async function getOrCreateDailyStats(deckId: string): Promise<DailyStats> {
	const db = await getDB();
	const today = getTodayString();

	let stats = await db.get('dailyStats', [today, deckId]);
	if (!stats) {
		stats = {
			date: today,
			deckId,
			reviewed: 0,
			newLearned: 0,
			correct: 0,
			incorrect: 0,
			studyTimeMs: 0
		};
		await db.add('dailyStats', stats);
	}

	return stats;
}

/**
 * Update daily stats after a review
 */
async function updateDailyStatsForReview(
	deckId: string,
	rating: Rating,
	responseTimeMs: number,
	wasNew: boolean
): Promise<void> {
	const db = await getDB();
	const stats = await getOrCreateDailyStats(deckId);

	const updated: DailyStats = {
		...stats,
		reviewed: stats.reviewed + 1,
		newLearned: wasNew ? stats.newLearned + 1 : stats.newLearned,
		correct: rating >= Rating.Good ? stats.correct + 1 : stats.correct,
		incorrect: rating === Rating.Again ? stats.incorrect + 1 : stats.incorrect,
		studyTimeMs: stats.studyTimeMs + responseTimeMs
	};

	await db.put('dailyStats', updated);
}

/**
 * Get daily stats for a date
 */
export async function getDailyStats(date: string, deckId: string): Promise<DailyStats | undefined> {
	const db = await getDB();
	return db.get('dailyStats', [date, deckId]);
}

/**
 * Get daily stats for a date range
 */
export async function getDailyStatsRange(
	startDate: string,
	endDate: string,
	deckId?: string
): Promise<DailyStats[]> {
	const db = await getDB();

	let allStats: DailyStats[];
	if (deckId) {
		allStats = await db.getAllFromIndex('dailyStats', 'by-deck', deckId);
	} else {
		allStats = await db.getAll('dailyStats');
	}

	return allStats.filter((s) => s.date >= startDate && s.date <= endDate);
}

/**
 * Get total due cards count across all decks
 */
export async function getTotalDueCount(): Promise<number> {
	const db = await getDB();
	const allCards = await db.getAll('cards');
	const now = Date.now();

	return allCards.filter((c) => c.status !== 'suspended' && isDue(c.state, now)).length;
}

/**
 * Get due cards count for a specific deck
 */
export async function getDeckDueCount(deckId: string): Promise<number> {
	const cards = await getCardsByDeck(deckId);
	const now = Date.now();

	return cards.filter((c) => c.status !== 'suspended' && isDue(c.state, now)).length;
}
