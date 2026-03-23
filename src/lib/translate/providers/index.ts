/**
 * Provider abstraction with dynamic imports
 */

import type { ProviderName, TranslationResponse } from '../types';

export interface AIProvider {
	name: string;
	modelId: string;
	translate(text: string, apiKey: string): Promise<TranslationResponse>;
}

/**
 * Dynamically load a provider by name.
 * Uses dynamic imports so unused providers are not bundled.
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

const MAX_LINES_PER_CHUNK = 10;

/**
 * Split text into chunks of lines to avoid exceeding token limits.
 * Splits on double newlines (paragraphs) first, then by line count.
 */
function splitIntoChunks(text: string): string[] {
	const lines = text.split('\n').filter((l) => l.trim().length > 0);
	if (lines.length <= MAX_LINES_PER_CHUNK) return [text];

	const chunks: string[] = [];
	for (let i = 0; i < lines.length; i += MAX_LINES_PER_CHUNK) {
		chunks.push(lines.slice(i, i + MAX_LINES_PER_CHUNK).join('\n'));
	}
	return chunks;
}

/**
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
