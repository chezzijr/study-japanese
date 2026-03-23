/**
 * Storage Service - CRUD operations for translate data
 */

import { getDB, generateId } from './db';
import type { AISettings, SavedTranslation, TranslationResponse, ProviderName } from './types';

// ============================================
// SETTINGS OPERATIONS
// ============================================

/**
 * Get AI settings
 */
export async function getSettings(): Promise<AISettings | undefined> {
	const db = await getDB();
	return db.get('ai-settings', 'default');
}

/**
 * Save AI settings
 */
export async function saveSettings(settings: AISettings): Promise<void> {
	const db = await getDB();
	await db.put('ai-settings', settings);
}

// ============================================
// TRANSLATION OPERATIONS
// ============================================

/**
 * Save a translation
 */
export async function saveTranslation(
	sourceText: string,
	response: TranslationResponse,
	provider: ProviderName
): Promise<SavedTranslation> {
	const db = await getDB();

	const translation: SavedTranslation = {
		id: generateId(),
		sourceText,
		response,
		provider,
		createdAt: Date.now()
	};

	await db.add('translations', translation);
	return translation;
}

/**
 * Get all translations sorted by createdAt descending
 */
export async function getTranslations(): Promise<SavedTranslation[]> {
	const db = await getDB();
	const all = await db.getAll('translations');
	return all.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Get a translation by ID
 */
export async function getTranslation(id: string): Promise<SavedTranslation | undefined> {
	const db = await getDB();
	return db.get('translations', id);
}

/**
 * Delete a translation by ID
 */
export async function deleteTranslation(id: string): Promise<void> {
	const db = await getDB();
	await db.delete('translations', id);
}
