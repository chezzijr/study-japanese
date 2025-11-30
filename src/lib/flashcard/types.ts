// Rating enum (4-button Anki-style)
export enum Rating {
	Again = 1, // Complete failure, reset
	Hard = 2, // Correct but struggled
	Good = 3, // Correct with effort
	Easy = 4 // Effortless recall
}

// Card direction for review
export type CardDirection = 'viet-to-jp' | 'jp-to-viet' | 'random';

// SM-2 scheduling state
export interface SM2State {
	easeFactor: number; // Default 2.5, min 1.3
	interval: number; // Days until next review
	repetitions: number; // Consecutive correct reviews
	dueDate: number; // Unix timestamp (ms)
	lastReviewDate: number; // Unix timestamp (ms), 0 if never reviewed
}

// Card source tracking - links cards to original data
export type CardSource =
	| { type: 'vocab'; level: string; unit: string; word: string }
	| { type: 'kanji'; level: string; kanji: string }
	| { type: 'custom' }
	| { type: 'imported' };

// Card status based on learning progress
export type CardStatus = 'new' | 'learning' | 'review' | 'suspended';

// Full flashcard entity
export interface Flashcard {
	id: string;
	deckId: string;
	front: string;
	back: string;
	frontReading?: string; // Furigana for Japanese text on front
	backReading?: string; // Furigana for Japanese text on back
	notes?: string;
	tags: string[];
	source: CardSource;
	state: SM2State;
	status: CardStatus;
	createdAt: number;
	updatedAt: number;
}

// Deck settings
export interface DeckSettings {
	newCardsPerDay: number; // Default: 20
	reviewsPerDay: number; // Default: 200 (0 = unlimited)
	defaultDirection: CardDirection; // Default: 'viet-to-jp'
}

// Deck entity
export interface Deck {
	id: string;
	name: string;
	description?: string;
	settings: DeckSettings;
	createdAt: number;
	updatedAt: number;
}

// Review log entry for history tracking
export interface ReviewLog {
	id: string;
	cardId: string;
	deckId: string;
	rating: Rating;
	responseTimeMs: number;
	previousState: SM2State;
	newState: SM2State;
	reviewedAt: number;
}

// Daily statistics aggregation
export interface DailyStats {
	date: string; // YYYY-MM-DD format
	deckId: string;
	reviewed: number;
	newLearned: number;
	correct: number; // Good + Easy ratings
	incorrect: number; // Again rating
	studyTimeMs: number;
}

// Export/Import format
export interface ExportData {
	version: string;
	exportedAt: number;
	deck: Deck;
	cards: Flashcard[];
	reviews?: ReviewLog[];
}

// Deck statistics summary
export interface DeckStats {
	totalCards: number;
	newCards: number;
	learningCards: number;
	reviewCards: number;
	suspendedCards: number;
	dueToday: number;
	dueTomorrow: number;
	averageEaseFactor: number;
	retentionRate: number; // Last 30 days
	currentStreak: number;
	longestStreak: number;
}

// Session configuration
export interface SessionConfig {
	maxNewCards: number;
	maxReviewCards: number; // 0 = unlimited
	direction: CardDirection;
	randomizeOrder: boolean;
}

// Session queue state
export interface SessionQueue {
	newCards: Flashcard[];
	reviewCards: Flashcard[];
	completed: string[]; // Card IDs
	currentIndex: number;
}

// Default values
export const DEFAULT_SM2_STATE: SM2State = {
	easeFactor: 2.5,
	interval: 0,
	repetitions: 0,
	dueDate: Date.now(),
	lastReviewDate: 0
};

export const DEFAULT_DECK_SETTINGS: DeckSettings = {
	newCardsPerDay: 20,
	reviewsPerDay: 200,
	defaultDirection: 'viet-to-jp'
};

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
	maxNewCards: 20,
	maxReviewCards: 200,
	direction: 'viet-to-jp',
	randomizeOrder: true
};

export const EXPORT_VERSION = '1.0.0';
