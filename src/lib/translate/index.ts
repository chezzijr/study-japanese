/**
 * Translate Module
 *
 * AI-powered Japanese-Vietnamese translation with token-level analysis
 */

// Types
export type {
	ProviderName,
	Token,
	Sentence,
	TranslationResponse,
	AISettings,
	SavedTranslation
} from './types';

// Database
export { getDB, closeDB, deleteDB, isIndexedDBAvailable, generateId } from './db';

// Storage Operations
export {
	getSettings,
	saveSettings,
	saveTranslation,
	getTranslations,
	getTranslation,
	deleteTranslation
} from './storage';

// Prompt
export { getSystemPrompt, getUserPrompt } from './prompt';

// Validation
export { validateResponse, tryParseResponse } from './validate';

// Providers
export type { AIProvider } from './providers/index';
export { getProvider } from './providers/index';
