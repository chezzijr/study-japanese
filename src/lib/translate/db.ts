import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AISettings, SavedTranslation } from './types';

const DB_NAME = 'study-japanese-translate';
const DB_VERSION = 1;

// IndexedDB schema definition
interface TranslateDB extends DBSchema {
	'ai-settings': {
		key: string;
		value: AISettings;
	};
	translations: {
		key: string;
		value: SavedTranslation;
		indexes: {
			'by-date': number;
		};
	};
}

// Singleton database instance
let dbInstance: IDBPDatabase<TranslateDB> | null = null;

/**
 * Get or create the database instance
 */
export async function getDB(): Promise<IDBPDatabase<TranslateDB>> {
	if (dbInstance) return dbInstance;

	dbInstance = await openDB<TranslateDB>(DB_NAME, DB_VERSION, {
		upgrade(db) {
			// Version 1: Initial schema
			// AI settings store
			db.createObjectStore('ai-settings', { keyPath: 'id' });

			// Translations store
			const translationStore = db.createObjectStore('translations', { keyPath: 'id' });
			translationStore.createIndex('by-date', 'createdAt');
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
export type { TranslateDB };
