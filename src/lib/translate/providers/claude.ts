/**
 * Claude provider implementation
 *
 * V1 (legacy): single-step translate via default export.
 * V2: two-step translateText + tokenize exports.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider } from './index';
import type { TranslationResponse } from '../types';
import { getSystemPrompt, getUserPrompt } from '../prompt';
import { validateResponse } from '../validate';

// ── Shared helper ─────────────────────────────────────────────────────

function extractText(message: Anthropic.Message): string {
	if (message.stop_reason === 'max_tokens') {
		throw new Error('Response was truncated due to length. Try translating a shorter text.');
	}

	const textBlock = message.content.find((block) => block.type === 'text');
	if (!textBlock || textBlock.type !== 'text') {
		throw new Error('Claude returned no text content');
	}

	return textBlock.text;
}

// ── V2 exports ────────────────────────────────────────────────────────

/**
 * Step 1: plain translation — returns translated text only.
 */
export async function translateText(
	userPrompt: string,
	modelId: string,
	apiKey: string,
	systemPrompt: string
): Promise<string> {
	const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

	const message = await client.messages.create({
		model: modelId,
		max_tokens: 16384,
		system: systemPrompt,
		messages: [{ role: 'user', content: userPrompt }]
	});

	return extractText(message);
}

/**
 * Step 2: tokenization — returns raw JSON string.
 */
export async function tokenize(
	userPrompt: string,
	modelId: string,
	apiKey: string,
	systemPrompt: string
): Promise<string> {
	const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

	const message = await client.messages.create({
		model: modelId,
		max_tokens: 16384,
		system: systemPrompt,
		messages: [{ role: 'user', content: userPrompt }]
	});

	return extractText(message);
}

// ── V1 (deprecated) ──────────────────────────────────────────────────

/** @deprecated Use translateText + tokenize instead. */
const provider: AIProvider = {
	name: 'Claude Sonnet',
	modelId: 'claude-sonnet-4-6',

	async translate(text: string, apiKey: string): Promise<TranslationResponse> {
		const client = new Anthropic({
			apiKey,
			dangerouslyAllowBrowser: true
		});

		const message = await client.messages.create({
			model: this.modelId,
			max_tokens: 16384,
			system: getSystemPrompt(),
			messages: [
				{
					role: 'user',
					content: getUserPrompt(text)
				}
			]
		});

		return validateResponse(extractText(message));
	}
};

export default provider;
