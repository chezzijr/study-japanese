/**
 * Review Session Management
 *
 * Handles card selection, ordering, and session progress tracking
 */

import type { Flashcard, SessionConfig, SessionQueue, CardDirection } from './types';
import { DEFAULT_SESSION_CONFIG } from './types';
import { isDue, isNew, daysOverdue } from './sm2';

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

/**
 * Build a review session queue from available cards
 */
export function buildSessionQueue(
	allCards: Flashcard[],
	config: SessionConfig = DEFAULT_SESSION_CONFIG
): SessionQueue {
	const now = Date.now();

	// Separate new and review cards (excluding suspended)
	const newCards = allCards.filter(
		(c) => c.status !== 'suspended' && isNew(c.state)
	);

	const reviewCards = allCards.filter(
		(c) => c.status !== 'suspended' && !isNew(c.state) && isDue(c.state, now)
	);

	// Sort review cards by urgency (most overdue first)
	const sortedReviews = [...reviewCards].sort(
		(a, b) => daysOverdue(b.state, now) - daysOverdue(a.state, now)
	);

	// Apply limits
	const limitedNew = newCards.slice(0, config.maxNewCards);
	const limitedReviews =
		config.maxReviewCards > 0 ? sortedReviews.slice(0, config.maxReviewCards) : sortedReviews;

	// Randomize if configured
	const finalNew = config.randomizeOrder ? shuffle(limitedNew) : limitedNew;
	const finalReviews = config.randomizeOrder ? shuffle(limitedReviews) : limitedReviews;

	return {
		newCards: finalNew,
		reviewCards: finalReviews,
		completed: [],
		currentIndex: 0
	};
}

/**
 * Get the next card to review from the queue
 *
 * Strategy: Interleave 1 new card per 10 reviews
 */
export function getNextCard(queue: SessionQueue): Flashcard | null {
	const newRemaining = queue.newCards.filter((c) => !queue.completed.includes(c.id));
	const reviewRemaining = queue.reviewCards.filter((c) => !queue.completed.includes(c.id));

	if (newRemaining.length === 0 && reviewRemaining.length === 0) {
		return null; // Session complete
	}

	// Count reviews completed
	const reviewsCompleted = queue.completed.filter((id) =>
		queue.reviewCards.some((r) => r.id === id)
	).length;

	// Interleave: 1 new per 10 reviews
	const shouldShowNew =
		reviewRemaining.length === 0 ||
		(newRemaining.length > 0 && reviewsCompleted > 0 && reviewsCompleted % 10 === 0);

	if (shouldShowNew && newRemaining.length > 0) {
		return newRemaining[0];
	}

	return reviewRemaining[0] || newRemaining[0] || null;
}

/**
 * Mark a card as completed in the session
 */
export function markCardCompleted(queue: SessionQueue, cardId: string): SessionQueue {
	return {
		...queue,
		completed: [...queue.completed, cardId],
		currentIndex: queue.currentIndex + 1
	};
}

/**
 * Get session progress statistics
 */
export function getSessionProgress(queue: SessionQueue): {
	total: number;
	completed: number;
	remaining: number;
	newCompleted: number;
	reviewCompleted: number;
	percentComplete: number;
} {
	const total = queue.newCards.length + queue.reviewCards.length;
	const completed = queue.completed.length;
	const newCompleted = queue.completed.filter((id) =>
		queue.newCards.some((n) => n.id === id)
	).length;
	const reviewCompleted = completed - newCompleted;

	return {
		total,
		completed,
		remaining: total - completed,
		newCompleted,
		reviewCompleted,
		percentComplete: total > 0 ? Math.round((completed / total) * 100) : 100
	};
}

/**
 * Check if session is complete
 */
export function isSessionComplete(queue: SessionQueue): boolean {
	const total = queue.newCards.length + queue.reviewCards.length;
	return queue.completed.length >= total;
}

/**
 * Prepare card content based on direction setting
 */
export function prepareCardForDisplay(
	card: Flashcard,
	direction: CardDirection
): { front: string; back: string; frontReading?: string; backReading?: string } {
	// Determine actual direction for this card
	let actualDirection: 'viet-to-jp' | 'jp-to-viet' = direction === 'random'
		? Math.random() < 0.5 ? 'viet-to-jp' : 'jp-to-viet'
		: direction;

	if (actualDirection === 'viet-to-jp') {
		// Vietnamese meaning on front, Japanese on back
		return {
			front: card.back, // Vietnamese meaning
			back: card.front, // Japanese word
			frontReading: card.backReading,
			backReading: card.frontReading
		};
	} else {
		// Japanese word on front, Vietnamese meaning on back
		return {
			front: card.front,
			back: card.back,
			frontReading: card.frontReading,
			backReading: card.backReading
		};
	}
}

/**
 * Get count of cards available for review
 */
export function getReviewableCount(cards: Flashcard[]): {
	newCount: number;
	dueCount: number;
	totalReviewable: number;
} {
	const now = Date.now();

	const newCount = cards.filter(
		(c) => c.status !== 'suspended' && isNew(c.state)
	).length;

	const dueCount = cards.filter(
		(c) => c.status !== 'suspended' && !isNew(c.state) && isDue(c.state, now)
	).length;

	return {
		newCount,
		dueCount,
		totalReviewable: newCount + dueCount
	};
}
