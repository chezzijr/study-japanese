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
