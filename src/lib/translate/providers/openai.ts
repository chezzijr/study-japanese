/**
 * OpenAI GPT-4o-mini provider implementation
 */

import OpenAI from 'openai';
import type { AIProvider } from './index';
import type { TranslationResponse } from '../types';
import { getSystemPrompt, getUserPrompt } from '../prompt';
import { validateResponse } from '../validate';

const provider: AIProvider = {
	name: 'OpenAI GPT-4o-mini',
	modelId: 'gpt-4o-mini',

	async translate(text: string, apiKey: string): Promise<TranslationResponse> {
		const client = new OpenAI({
			apiKey,
			dangerouslyAllowBrowser: true
		});

		const completion = await client.chat.completions.create({
			model: this.modelId,
			max_tokens: 16384,
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content: getSystemPrompt()
				},
				{
					role: 'user',
					content: getUserPrompt(text)
				}
			]
		});

		const raw = completion.choices[0]?.message?.content;
		if (!raw) {
			throw new Error('OpenAI returned no text content');
		}

		return validateResponse(raw);
	}
};

export default provider;
