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
	Direction,
	TokenInfo,
	MappingGroup,
	SentenceMapping,
	TranslationResponseV2,
	AISettings,
	SavedTranslation
} from './types';

export { isV2 } from './types';

// Model Registry
export type { ModelOption } from './models';
export { MODEL_REGISTRY, getProviderForModel } from './models';

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
export { getProvider, translateChunked, translateTwoStep } from './providers/index';
