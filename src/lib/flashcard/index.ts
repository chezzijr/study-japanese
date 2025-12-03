/**
 * Flashcard Module
 *
 * Anki-like spaced repetition flashcard system
 */

// Types
export {
	Rating,
	type CardDirection,
	type SM2State,
	type CardSource,
	type CardStatus,
	type Flashcard,
	type DeckSettings,
	type Deck,
	type ReviewLog,
	type DailyStats,
	type ExportData,
	type DeckStats,
	type SessionConfig,
	type SessionQueue,
	DEFAULT_SM2_STATE,
	DEFAULT_DECK_SETTINGS,
	DEFAULT_SESSION_CONFIG,
	EXPORT_VERSION
} from './types';

// Database
export { getDB, closeDB, deleteDB, isIndexedDBAvailable, generateId } from './db';

// SM-2 Algorithm
export {
	calculateNextState,
	isDue,
	isNew,
	daysOverdue,
	determineCardStatus,
	previewIntervals,
	formatInterval,
	createInitialState
} from './sm2';

// Storage Operations
export {
	// Deck operations
	createDeck,
	getDeck,
	getAllDecks,
	updateDeck,
	deleteDeck,
	// Card operations
	createCard,
	createCards,
	getCard,
	getCardsByDeck,
	getAllCards,
	getDueCards,
	getNewCards,
	getCardsByStatus,
	findCardBySource,
	updateCard,
	deleteCard,
	deleteCards,
	setCardSuspended,
	moveCard,
	// Review operations
	recordReview,
	getCardReviewHistory,
	getReviewsByDateRange,
	// Statistics operations
	getDailyStats,
	getDailyStatsRange,
	getTotalDueCount,
	getDeckDueCount
} from './storage';

// Session Management
export {
	buildSessionQueue,
	getNextCard,
	markCardCompleted,
	getSessionProgress,
	isSessionComplete,
	prepareCardForDisplay,
	getReviewableCount
} from './session';

// Statistics
export {
	calculateRetentionRate,
	calculateStreak,
	forecastReviews,
	calculateDeckStats,
	aggregateDailyStats,
	getDateString,
	getDateRange,
	formatStudyTime,
	getMatureCardCount,
	getYoungCardCount
} from './stats';

// Import/Export
export {
	exportDeck,
	exportToJSON,
	downloadExport,
	validateImportData,
	prepareImportCards,
	prepareImportDeck,
	parseImportJSON,
	readFileAsText,
	exportToCSV,
	downloadCSV,
	type ValidationResult,
	type ImportOptions,
	type ImportResult
} from './io';

// Vocabulary Conversion
export {
	vocabToFlashcard,
	kanjiToFlashcard,
	vocabListToFlashcards,
	kanjiListToFlashcards,
	createCustomFlashcard,
	isVocabAlreadyInDeck,
	isKanjiAlreadyInDeck,
	filterNewVocab,
	filterNewKanji,
	suggestVocabDeckName,
	suggestKanjiDeckName,
	type KanjiData
} from './vocab-convert';
