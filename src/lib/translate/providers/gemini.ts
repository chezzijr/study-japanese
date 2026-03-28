/**
 * Gemini provider implementation
 *
 * V1 (legacy): single-step translate via default export.
 * V2: two-step translateText + tokenize exports.
 */

import { GoogleGenAI, ThinkingLevel, type ThinkingConfig } from '@google/genai';
import type { AIProvider } from './index';
import type { TranslationResponse } from '../types';
import { getSystemPrompt, getUserPrompt } from '../prompt';
import { validateResponse } from '../validate';

// ── Shared helper ─────────────────────────────────────────────────────

function getThinkingConfig(modelId: string): ThinkingConfig {
	if (modelId.startsWith('gemini-3')) {
		return { thinkingLevel: ThinkingLevel.MINIMAL };
	}
	return { thinkingBudget: 0 };
}

// ── V2 exports ────────────────────────────────────────────────────────

/**
 * Step 1: plain translation — returns translated text only.
 * Does NOT use responseMimeType json so the model returns plain text.
 */
export async function translateText(
	userPrompt: string,
	modelId: string,
	apiKey: string,
	systemPrompt: string
): Promise<string> {
	const ai = new GoogleGenAI({ apiKey });

	const response = await ai.models.generateContent({
		model: modelId,
		contents: userPrompt,
		config: {
			systemInstruction: systemPrompt,
			maxOutputTokens: 65536,
			thinkingConfig: getThinkingConfig(modelId)
		}
	});

	const raw = response.text;
	if (!raw) {
		throw new Error('Gemini returned no text content');
	}

	return raw;
}

/**
 * Step 2: tokenization — returns raw JSON string.
 * Uses responseMimeType: 'application/json' to get structured output.
 */
export async function tokenize(
	userPrompt: string,
	modelId: string,
	apiKey: string,
	systemPrompt: string
): Promise<string> {
	const ai = new GoogleGenAI({ apiKey });

	const response = await ai.models.generateContent({
		model: modelId,
		contents: userPrompt,
		config: {
			systemInstruction: systemPrompt,
			responseMimeType: 'application/json',
			maxOutputTokens: 65536,
			thinkingConfig: getThinkingConfig(modelId)
		}
	});

	const raw = response.text;
	if (!raw) {
		throw new Error('Gemini returned no text content');
	}

	return raw;
}

// ── V1 (deprecated) ──────────────────────────────────────────────────

/** @deprecated Use translateText + tokenize instead. */
const provider: AIProvider = {
	name: 'Gemini Flash',
	modelId: 'gemini-2.5-flash',

	async translate(text: string, apiKey: string): Promise<TranslationResponse> {
		const ai = new GoogleGenAI({ apiKey });

		const response = await ai.models.generateContent({
			model: this.modelId,
			contents: getUserPrompt(text),
			config: {
				systemInstruction: getSystemPrompt(),
				responseMimeType: 'application/json',
				maxOutputTokens: 65536,
				thinkingConfig: {
					thinkingBudget: 0
				}
			}
		});

		const raw = response.text;
		if (!raw) {
			throw new Error('Gemini returned no text content');
		}

		return validateResponse(raw);
	}
};

export default provider;
