/**
 * Provider abstraction with dynamic imports
 *
 * V1 (legacy): AIProvider interface, getProvider(), translateChunked().
 * V2: translateTwoStep() with separate translation and tokenization phases.
 */

import type { ProviderName, TranslationResponse, Direction, TranslationResponseV2, AISettings } from '../types';
import { getProviderForModel } from '../models';
import {
	getTranslationSystemPrompt,
	getTranslationUserPrompt,
	getTokenizationSystemPrompt,
	getTokenizationUserPrompt
} from '../prompt';
import { validateTranslationText, validateTokenizationResponse } from '../validate';

// ── V1 types & functions (deprecated) ─────────────────────────────────

export interface AIProvider {
	name: string;
	modelId: string;
	translate(text: string, apiKey: string): Promise<TranslationResponse>;
}

/**
 * @deprecated Use translateTwoStep instead.
 * Dynamically load a provider by name.
 */
export async function getProvider(name: ProviderName): Promise<AIProvider> {
	switch (name) {
		case 'claude':
			return (await import('./claude')).default;
		case 'gemini':
			return (await import('./gemini')).default;
		case 'openai':
			return (await import('./openai')).default;
		default:
			throw new Error(`Unknown provider: ${name}`);
	}
}

const MAX_CHARS_PER_CHUNK = 250;

/**
 * Split text into chunks based on character count to avoid exceeding token limits.
 * Groups lines together until adding another line would exceed the character limit.
 */
function splitIntoChunks(text: string): string[] {
	const lines = text.split('\n').filter((l) => l.trim().length > 0);
	const totalChars = lines.reduce((sum, l) => sum + l.length, 0);
	if (totalChars <= MAX_CHARS_PER_CHUNK) return [text];

	const chunks: string[] = [];
	let currentLines: string[] = [];
	let currentChars = 0;

	for (const line of lines) {
		if (currentChars + line.length > MAX_CHARS_PER_CHUNK && currentLines.length > 0) {
			chunks.push(currentLines.join('\n'));
			currentLines = [];
			currentChars = 0;
		}
		currentLines.push(line);
		currentChars += line.length;
	}
	if (currentLines.length > 0) {
		chunks.push(currentLines.join('\n'));
	}
	return chunks;
}

/**
 * @deprecated Use translateTwoStep instead.
 * Translate text, automatically chunking long inputs to avoid token limit truncation.
 */
export async function translateChunked(
	provider: AIProvider,
	text: string,
	apiKey: string
): Promise<TranslationResponse> {
	const chunks = splitIntoChunks(text);

	if (chunks.length === 1) {
		return provider.translate(text, apiKey);
	}

	const results = await Promise.all(chunks.map((chunk) => provider.translate(chunk, apiKey)));

	return {
		sentences: results.flatMap((r) => r.sentences)
	};
}

// ── V2 two-step translation ───────────────────────────────────────────

type TranslateTextFn = (userPrompt: string, modelId: string, apiKey: string, systemPrompt: string) => Promise<string>;
type TokenizeFn = (userPrompt: string, modelId: string, apiKey: string, systemPrompt: string) => Promise<string>;

/**
 * Get the translateText/tokenize functions for a given model via dynamic import.
 */
async function getProviderFunctions(
	modelId: string
): Promise<{ translateText: TranslateTextFn; tokenize: TokenizeFn }> {
	const provider = getProviderForModel(modelId);
	switch (provider) {
		case 'claude': {
			const mod = await import('./claude');
			return { translateText: mod.translateText, tokenize: mod.tokenize };
		}
		case 'gemini': {
			const mod = await import('./gemini');
			return { translateText: mod.translateText, tokenize: mod.tokenize };
		}
		case 'openai': {
			const mod = await import('./openai');
			return { translateText: mod.translateText, tokenize: mod.tokenize };
		}
	}
}

/**
 * Two-step translation flow:
 *   Phase 1 — translate all chunks in parallel (plain text)
 *   Phase 2 — tokenize all chunks in parallel (structured JSON)
 *
 * @param sourceText        - The original text to translate
 * @param direction         - 'jp-vn' or 'vn-jp'
 * @param settings          - AISettings with model IDs and API keys
 * @param jlptLevel         - Optional JLPT level hint (e.g. "N5") for vn-jp direction
 * @param onTranslationDone - Optional callback fired after Phase 1 completes with combined translation text
 */
export async function translateTwoStep(
	sourceText: string,
	direction: Direction,
	settings: AISettings,
	jlptLevel?: string,
	onTranslationDone?: (text: string) => void
): Promise<TranslationResponseV2> {
	const translationModelId = settings.translationModel;
	const tokenizationModelId = settings.tokenizationModel;

	const translationProviderName = getProviderForModel(translationModelId);
	const tokenizationProviderName = getProviderForModel(tokenizationModelId);

	const translationKey = settings.keys[translationProviderName];
	const tokenizationKey = settings.keys[tokenizationProviderName];

	if (!translationKey) throw new Error(`No API key for ${translationProviderName}`);
	if (!tokenizationKey) throw new Error(`No API key for ${tokenizationProviderName}`);

	const translationSystemPrompt = getTranslationSystemPrompt(direction, jlptLevel);
	const tokenizationSystemPrompt = getTokenizationSystemPrompt(direction);

	const chunks = splitIntoChunks(sourceText);

	const translationFns = await getProviderFunctions(translationModelId);
	const tokenizationFns = await getProviderFunctions(tokenizationModelId);

	// Phase 1: Translate all chunks in parallel
	const translations = await Promise.all(
		chunks.map(async (chunk) => {
			const userPrompt = getTranslationUserPrompt(chunk);
			const raw = await translationFns.translateText(
				userPrompt,
				translationModelId,
				translationKey,
				translationSystemPrompt
			);
			return validateTranslationText(raw, direction);
		})
	);

	// Notify UI that translation is done (before tokenization starts)
	onTranslationDone?.(translations.join('\n'));

	// Phase 2: Tokenize all chunks in parallel
	const results = await Promise.all(
		chunks.map(async (chunk, i) => {
			const userPrompt = getTokenizationUserPrompt(chunk, translations[i]);
			const raw = await tokenizationFns.tokenize(
				userPrompt,
				tokenizationModelId,
				tokenizationKey,
				tokenizationSystemPrompt
			);
			return validateTokenizationResponse(raw, direction);
		})
	);

	return {
		version: 2,
		direction,
		sentences: results.flatMap((r) => r.sentences)
	};
}
