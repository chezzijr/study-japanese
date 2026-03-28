/**
 * OpenAI provider implementation
 *
 * V1 (legacy): single-step translate via default export.
 * V2: two-step translateText + tokenize exports.
 */

import OpenAI from 'openai';
import type { AIProvider } from './index';
import type { TranslationResponse } from '../types';
import { getSystemPrompt, getUserPrompt } from '../prompt';
import { validateResponse } from '../validate';

// ── V2 exports ────────────────────────────────────────────────────────

/**
 * Step 1: plain translation — returns translated text only.
 * No response_format constraint so the model returns plain text.
 */
export async function translateText(
	userPrompt: string,
	modelId: string,
	apiKey: string,
	systemPrompt: string
): Promise<string> {
	const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

	const completion = await client.chat.completions.create({
		model: modelId,
		max_tokens: 16384,
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userPrompt }
		]
	});

	const raw = completion.choices[0]?.message?.content;
	if (!raw) {
		throw new Error('OpenAI returned no text content');
	}

	return raw;
}

/**
 * Step 2: tokenization — returns raw JSON string.
 * Uses response_format: { type: 'json_object' } for structured output.
 */
export async function tokenize(
	userPrompt: string,
	modelId: string,
	apiKey: string,
	systemPrompt: string
): Promise<string> {
	const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

	const completion = await client.chat.completions.create({
		model: modelId,
		max_tokens: 16384,
		response_format: { type: 'json_object' },
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userPrompt }
		]
	});

	const raw = completion.choices[0]?.message?.content;
	if (!raw) {
		throw new Error('OpenAI returned no text content');
	}

	return raw;
}

// ── V1 (deprecated) ──────────────────────────────────────────────────

/** @deprecated Use translateText + tokenize instead. */
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
