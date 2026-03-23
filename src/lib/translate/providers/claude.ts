/**
 * Claude Haiku provider implementation
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider } from './index';
import type { TranslationResponse } from '../types';
import { getSystemPrompt, getUserPrompt } from '../prompt';
import { validateResponse } from '../validate';

const provider: AIProvider = {
	name: 'Claude Haiku',
	modelId: 'claude-haiku-4-5',

	async translate(text: string, apiKey: string): Promise<TranslationResponse> {
		const client = new Anthropic({
			apiKey,
			dangerouslyAllowBrowser: true
		});

		const message = await client.messages.create({
			model: this.modelId,
			max_tokens: 4096,
			system: getSystemPrompt(),
			messages: [
				{
					role: 'user',
					content: getUserPrompt(text)
				}
			]
		});

		// Extract text content from response
		const textBlock = message.content.find((block) => block.type === 'text');
		if (!textBlock || textBlock.type !== 'text') {
			throw new Error('Claude returned no text content');
		}

		return validateResponse(textBlock.text);
	}
};

export default provider;
