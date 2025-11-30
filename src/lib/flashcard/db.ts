import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Flashcard, Deck, ReviewLog, DailyStats } from './types';

const DB_NAME = 'study-japanese-flashcards';
const DB_VERSION = 1;

// IndexedDB schema definition
interface FlashcardDB extends DBSchema {
	decks: {
		key: string;
		value: Deck;
		indexes: {
			'by-name': string;
		};
	};
	cards: {
		key: string;
		value: Flashcard;
		indexes: {
			'by-deck': string;
			'by-due': number;
			'by-status': string;
			'by-deck-status': [string, string];
		};
	};
	reviews: {
		key: string;
		value: ReviewLog;
		indexes: {
			'by-card': string;
			'by-deck': string;
			'by-date': number;
		};
	};
	dailyStats: {
		key: [string, string]; // [date, deckId]
		value: DailyStats;
		indexes: {
			'by-deck': string;
			'by-date': string;
		};
	};
}

// Singleton database instance
let dbInstance: IDBPDatabase<FlashcardDB> | null = null;

/**
 * Get or create the database instance
 */
export async function getDB(): Promise<IDBPDatabase<FlashcardDB>> {
	if (dbInstance) return dbInstance;

	dbInstance = await openDB<FlashcardDB>(DB_NAME, DB_VERSION, {
		upgrade(db, oldVersion, newVersion, transaction) {
			// Version 1: Initial schema
			if (oldVersion < 1) {
				// Decks store
				const deckStore = db.createObjectStore('decks', { keyPath: 'id' });
				deckStore.createIndex('by-name', 'name');

				// Cards store with multiple indexes for efficient queries
				const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
				cardStore.createIndex('by-deck', 'deckId');
				cardStore.createIndex('by-due', 'state.dueDate');
				cardStore.createIndex('by-status', 'status');
				cardStore.createIndex('by-deck-status', ['deckId', 'status']);

				// Reviews store for history tracking
				const reviewStore = db.createObjectStore('reviews', { keyPath: 'id' });
				reviewStore.createIndex('by-card', 'cardId');
				reviewStore.createIndex('by-deck', 'deckId');
				reviewStore.createIndex('by-date', 'reviewedAt');

				// Daily stats store with compound key
				const statsStore = db.createObjectStore('dailyStats', {
					keyPath: ['date', 'deckId']
				});
				statsStore.createIndex('by-deck', 'deckId');
				statsStore.createIndex('by-date', 'date');
			}

			// Future migrations go here:
			// if (oldVersion < 2) { ... }
		},
		blocked() {
			console.warn('Database upgrade blocked - close other tabs using this database');
		},
		blocking() {
			// Close our connection to allow the upgrade to proceed
			dbInstance?.close();
			dbInstance = null;
		}
	});

	return dbInstance;
}

/**
 * Close database connection (useful for testing or cleanup)
 */
export function closeDB(): void {
	if (dbInstance) {
		dbInstance.close();
		dbInstance = null;
	}
}

/**
 * Delete entire database (use with caution!)
 */
export async function deleteDB(): Promise<void> {
	closeDB();
	await indexedDB.deleteDatabase(DB_NAME);
}

/**
 * Check if database is available (for SSR-safe checks)
 */
export function isIndexedDBAvailable(): boolean {
	if (typeof window === 'undefined') return false;
	if (!window.indexedDB) return false;
	return true;
}

/**
 * Generate a UUID for new entities
 */
export function generateId(): string {
	return crypto.randomUUID();
}

// Re-export the database type for use in other modules
export type { FlashcardDB };
