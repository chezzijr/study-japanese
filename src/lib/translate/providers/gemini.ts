/**
 * Gemini Flash provider implementation
 */

import { GoogleGenAI } from '@google/genai';
import type { AIProvider } from './index';
import type { TranslationResponse } from '../types';
import { getSystemPrompt, getUserPrompt } from '../prompt';
import { validateResponse } from '../validate';

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
				maxOutputTokens: 16384
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
