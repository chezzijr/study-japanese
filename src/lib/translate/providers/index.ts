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
