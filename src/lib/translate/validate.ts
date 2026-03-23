/**
 * Response validation for AI translation output
 */

import type { Token, Sentence, TranslationResponse } from './types';

/**
 * Validate and parse a raw JSON string into a TranslationResponse.
 * Throws an error if the response is malformed.
 */
export function validateResponse(raw: string): TranslationResponse {
	const parsed = parseJSON(raw);
	assertTranslationResponse(parsed);
	return parsed;
}

/**
 * Try to parse and validate a raw JSON string.
 * Returns null on failure instead of throwing.
 */
export function tryParseResponse(raw: string): TranslationResponse | null {
	try {
		return validateResponse(raw);
	} catch {
		return null;
	}
}

/**
 * Parse JSON from a raw string, handling markdown fences and extra whitespace
 */
function parseJSON(raw: string): unknown {
	let cleaned = raw.trim();

	// Strip markdown code fences if present
	if (cleaned.startsWith('```')) {
		// Remove opening fence (```json or ```)
		cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '');
		// Remove closing fence
		cleaned = cleaned.replace(/\n?\s*```\s*$/, '');
		cleaned = cleaned.trim();
	}

	try {
		return JSON.parse(cleaned);
	} catch (e) {
		throw new Error(`Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`);
	}
}

/**
 * Assert that the parsed value is a valid TranslationResponse
 */
function assertTranslationResponse(value: unknown): asserts value is TranslationResponse {
	if (typeof value !== 'object' || value === null) {
		throw new Error('Response must be an object');
	}

	const obj = value as Record<string, unknown>;

	if (!Array.isArray(obj.sentences)) {
		throw new Error('Response must have a "sentences" array');
	}

	if (obj.sentences.length === 0) {
		throw new Error('Response must have at least one sentence');
	}

	for (let i = 0; i < obj.sentences.length; i++) {
		assertSentence(obj.sentences[i], i);
	}
}

/**
 * Assert that a value is a valid Sentence
 */
function assertSentence(value: unknown, index: number): asserts value is Sentence {
	if (typeof value !== 'object' || value === null) {
		throw new Error(`sentences[${index}] must be an object`);
	}

	const obj = value as Record<string, unknown>;

	// Check tokens
	if (!Array.isArray(obj.tokens)) {
		throw new Error(`sentences[${index}].tokens must be an array`);
	}

	if (obj.tokens.length === 0) {
		throw new Error(`sentences[${index}].tokens must not be empty`);
	}

	const tokenIds = new Set<number>();
	for (let j = 0; j < obj.tokens.length; j++) {
		assertToken(obj.tokens[j], index, j);
		const token = obj.tokens[j] as Token;
		if (tokenIds.has(token.id)) {
			throw new Error(`sentences[${index}].tokens[${j}] has duplicate id ${token.id}`);
		}
		tokenIds.add(token.id);
	}

	// Check jp_order
	if (!Array.isArray(obj.jp_order)) {
		throw new Error(`sentences[${index}].jp_order must be an array`);
	}

	for (const id of obj.jp_order) {
		if (typeof id !== 'number') {
			throw new Error(`sentences[${index}].jp_order must contain only numbers`);
		}
		if (!tokenIds.has(id)) {
			throw new Error(`sentences[${index}].jp_order references unknown token id ${id}`);
		}
	}

	// Check vn_order
	if (!Array.isArray(obj.vn_order)) {
		throw new Error(`sentences[${index}].vn_order must be an array`);
	}

	for (const id of obj.vn_order) {
		if (typeof id !== 'number') {
			throw new Error(`sentences[${index}].vn_order must contain only numbers`);
		}
		if (!tokenIds.has(id)) {
			throw new Error(`sentences[${index}].vn_order references unknown token id ${id}`);
		}
	}

	// Check vn_full
	if (typeof obj.vn_full !== 'string' || obj.vn_full.length === 0) {
		throw new Error(`sentences[${index}].vn_full must be a non-empty string`);
	}
}

/**
 * Assert that a value is a valid Token
 */
function assertToken(
	value: unknown,
	sentenceIndex: number,
	tokenIndex: number
): asserts value is Token {
	const prefix = `sentences[${sentenceIndex}].tokens[${tokenIndex}]`;

	if (typeof value !== 'object' || value === null) {
		throw new Error(`${prefix} must be an object`);
	}

	const obj = value as Record<string, unknown>;

	// Required fields
	if (typeof obj.id !== 'number') {
		throw new Error(`${prefix}.id must be a number`);
	}

	if (typeof obj.jp !== 'string') {
		throw new Error(`${prefix}.jp must be a string`);
	}

	if (typeof obj.vn !== 'string') {
		// vn can be empty string for particles
		throw new Error(`${prefix}.vn must be a string`);
	}

	if (typeof obj.base_form !== 'string' || obj.base_form.length === 0) {
		throw new Error(`${prefix}.base_form must be a non-empty string`);
	}

	if (typeof obj.reading !== 'string' || obj.reading.length === 0) {
		throw new Error(`${prefix}.reading must be a non-empty string`);
	}

	if (typeof obj.type !== 'string' || obj.type.length === 0) {
		throw new Error(`${prefix}.type must be a non-empty string`);
	}

	// Optional grammar field
	if (obj.grammar !== undefined) {
		if (typeof obj.grammar !== 'object' || obj.grammar === null) {
			throw new Error(`${prefix}.grammar must be an object`);
		}
		const grammar = obj.grammar as Record<string, unknown>;
		if (typeof grammar.form !== 'string' || grammar.form.length === 0) {
			throw new Error(`${prefix}.grammar.form must be a non-empty string`);
		}
		if (typeof grammar.explanation !== 'string' || grammar.explanation.length === 0) {
			throw new Error(`${prefix}.grammar.explanation must be a non-empty string`);
		}
	}

	// Optional context field
	if (obj.context !== undefined && typeof obj.context !== 'string') {
		throw new Error(`${prefix}.context must be a string`);
	}

	// Optional kanji field
	if (obj.kanji !== undefined) {
		if (!Array.isArray(obj.kanji)) {
			throw new Error(`${prefix}.kanji must be an array`);
		}
		for (let k = 0; k < obj.kanji.length; k++) {
			assertKanjiEntry(obj.kanji[k], prefix, k);
		}
	}
}

/**
 * Assert that a value is a valid kanji entry
 */
function assertKanjiEntry(value: unknown, prefix: string, index: number): void {
	const kanjiPrefix = `${prefix}.kanji[${index}]`;

	if (typeof value !== 'object' || value === null) {
		throw new Error(`${kanjiPrefix} must be an object`);
	}

	const obj = value as Record<string, unknown>;

	if (typeof obj.char !== 'string' || obj.char.length === 0) {
		throw new Error(`${kanjiPrefix}.char must be a non-empty string`);
	}

	if (typeof obj.hv !== 'string' || obj.hv.length === 0) {
		throw new Error(`${kanjiPrefix}.hv must be a non-empty string`);
	}

	if (typeof obj.meaning !== 'string' || obj.meaning.length === 0) {
		throw new Error(`${kanjiPrefix}.meaning must be a non-empty string`);
	}
}
