/**
 * Storage Service - CRUD operations for translate data
 */

import { getDB, generateId } from './db';
import type {
	AISettings,
	SavedTranslation,
	TranslationResponse,
	TranslationResponseV2,
	Direction
} from './types';
import type { ProviderName } from './models';

// ============================================
// V1 → V2 MIGRATION HELPERS
// ============================================

function getDefaultTranslationModel(provider: string): string {
	switch (provider) {
		case 'gemini':
			return 'gemini-2.5-flash-lite';
		case 'claude':
			return 'claude-haiku-4-5';
		case 'openai':
			return 'gpt-4o-mini';
		default:
			return 'gemini-2.5-flash-lite';
	}
}

function getDefaultTokenizationModel(provider: string): string {
	switch (provider) {
		case 'gemini':
			return 'gemini-3-flash-preview';
		case 'claude':
			return 'claude-sonnet-4-6';
		case 'openai':
			return 'gpt-5.4-mini';
		default:
			return 'claude-sonnet-4-6';
	}
}

// ============================================
// SETTINGS OPERATIONS
// ============================================

/**
 * Get AI settings (with V1→V2 migration)
 */
export async function getSettings(): Promise<AISettings | undefined> {
	const db = await getDB();
	const settings = await db.get('ai-settings', 'default');
	if (!settings) return undefined;

	// V1→V2 migration: old format had `provider` instead of `translationModel`/`tokenizationModel`
	if ('provider' in settings && !('translationModel' in settings)) {
		const migrated: AISettings = {
			id: 'default',
			translationModel: getDefaultTranslationModel(
				(settings as unknown as { provider: string }).provider
			),
			tokenizationModel: getDefaultTokenizationModel(
				(settings as unknown as { provider: string }).provider
			),
			keys: settings.keys
		};
		// Save migrated settings back
		await db.put('ai-settings', migrated);
		return migrated;
	}

	return settings as AISettings;
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
	response: TranslationResponse | TranslationResponseV2,
	options: {
		// V1 compat
		provider?: ProviderName;
		// V2 fields
		direction?: Direction;
		translationModel?: string;
		tokenizationModel?: string;
	}
): Promise<string> {
	const db = await getDB();
	const id = generateId();
	const translation: SavedTranslation = {
		id,
		sourceText,
		response,
		createdAt: Date.now(),
		...options
	};
	await db.put('translations', translation);
	return id;
}

/**
 * Get all translations sorted by createdAt descending
 */
export async function getTranslations(limit?: number): Promise<SavedTranslation[]> {
	const db = await getDB();
	const all = await db.getAllFromIndex('translations', 'by-date');
	const sorted = all.reverse();
	return limit ? sorted.slice(0, limit) : sorted;
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
