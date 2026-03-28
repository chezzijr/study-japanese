/**
 * Response validation for AI translation output
 */

import type { Token, Sentence, TranslationResponse } from './types';
import type {
	Direction,
	TranslationResponseV2,
	TokenInfo,
	MappingGroup,
	SentenceMapping
} from './types';

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

	// Auto-fill missing fields with defaults instead of rejecting
	if (typeof obj.base_form !== 'string') obj.base_form = (obj.jp as string) || '';
	if (typeof obj.reading !== 'string') obj.reading = (obj.jp as string) || '';
	if (typeof obj.type !== 'string' || obj.type.length === 0) obj.type = 'trợ từ';

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

	// Allow empty hv/meaning — AI sometimes omits these for rare kanji
	if (obj.hv !== undefined && typeof obj.hv !== 'string') {
		throw new Error(`${kanjiPrefix}.hv must be a string`);
	}
	if (!obj.hv) obj.hv = '';

	if (obj.meaning !== undefined && typeof obj.meaning !== 'string') {
		throw new Error(`${kanjiPrefix}.meaning must be a string`);
	}
	if (!obj.meaning) obj.meaning = '';
}

// ── V2 Validation ──────────────────────────────────────────────────

const JP_CHARS_RE = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;
const VN_DIACRITICS_RE = /[ăĂơƠưƯđĐ\u0103\u0102\u01A1\u01A0\u01B0\u01AF\u0111\u0110]/;

/**
 * Step 1 validation: validate and clean translation text.
 * Throws if text is empty after trimming.
 * Warns if source-language characters leak into the translation output.
 */
export function validateTranslationText(text: string, direction: Direction): string {
	const cleaned = text.trim();
	if (cleaned.length === 0) {
		throw new Error('Translation text is empty');
	}

	if (direction === 'jp-vn' && JP_CHARS_RE.test(cleaned)) {
		console.warn(
			'[validate] JP→VN translation output contains Japanese characters — possible source leak:',
			cleaned.slice(0, 100)
		);
	}

	if (direction === 'vn-jp' && VN_DIACRITICS_RE.test(cleaned)) {
		console.warn(
			'[validate] VN→JP translation output contains Vietnamese diacritics — possible untranslated text:',
			cleaned.slice(0, 100)
		);
	}

	return cleaned;
}

/**
 * Step 2 validation: validate and parse a raw JSON string into a TranslationResponseV2.
 * Throws on truly broken input; auto-fills/recovers where possible.
 */
export function validateTokenizationResponse(
	raw: string,
	direction: Direction
): TranslationResponseV2 {
	const parsed = parseJSON(raw);
	const sentences = assertV2Structure(parsed);

	const validatedSentences: SentenceMapping[] = [];

	for (let i = 0; i < sentences.length; i++) {
		validatedSentences.push(validateSentenceMapping(sentences[i], i, direction));
	}

	return {
		version: 2,
		direction,
		sentences: validatedSentences
	};
}

/**
 * Assert top-level V2 structure and return the sentences array.
 */
function assertV2Structure(value: unknown): unknown[] {
	if (typeof value !== 'object' || value === null) {
		throw new Error('V2 response must be an object');
	}

	const obj = value as Record<string, unknown>;

	if (!Array.isArray(obj.sentences)) {
		throw new Error('V2 response must have a "sentences" array');
	}

	if (obj.sentences.length === 0) {
		throw new Error('V2 response must have at least one sentence');
	}

	return obj.sentences;
}

/**
 * Validate a single SentenceMapping.
 */
function validateSentenceMapping(
	value: unknown,
	index: number,
	direction: Direction
): SentenceMapping {
	if (typeof value !== 'object' || value === null) {
		throw new Error(`sentences[${index}] must be an object`);
	}

	const obj = value as Record<string, unknown>;
	const prefix = `sentences[${index}]`;

	// source_text / target_text
	if (typeof obj.source_text !== 'string' || obj.source_text.trim().length === 0) {
		throw new Error(`${prefix}.source_text must be a non-empty string`);
	}
	if (typeof obj.target_text !== 'string' || obj.target_text.trim().length === 0) {
		throw new Error(`${prefix}.target_text must be a non-empty string`);
	}

	const sourceText = obj.source_text as string;
	const targetText = obj.target_text as string;

	// source_tokens / target_tokens
	if (!Array.isArray(obj.source_tokens) || obj.source_tokens.length === 0) {
		throw new Error(`${prefix}.source_tokens must be a non-empty array`);
	}
	if (!Array.isArray(obj.target_tokens) || obj.target_tokens.length === 0) {
		throw new Error(`${prefix}.target_tokens must be a non-empty array`);
	}

	// groups
	if (!Array.isArray(obj.groups) || obj.groups.length === 0) {
		throw new Error(`${prefix}.groups must be a non-empty array`);
	}

	// Determine which side is JP for auto-fill reading logic
	const sourceIsJP = direction === 'jp-vn';

	// Validate tokens
	let sourceTokens = validateTokenInfoArray(
		obj.source_tokens,
		`${prefix}.source_tokens`,
		sourceIsJP
	);
	let targetTokens = validateTokenInfoArray(
		obj.target_tokens,
		`${prefix}.target_tokens`,
		!sourceIsJP
	);

	// Strip whitespace-only tokens
	const strippedSourceIds = new Set<number>();
	const strippedTargetIds = new Set<number>();

	sourceTokens = sourceTokens.filter((t) => {
		if (t.text.trim().length === 0) {
			strippedSourceIds.add(t.id);
			return false;
		}
		return true;
	});

	targetTokens = targetTokens.filter((t) => {
		if (t.text.trim().length === 0) {
			strippedTargetIds.add(t.id);
			return false;
		}
		return true;
	});

	// Check token ID uniqueness within each array
	assertUniqueIds(sourceTokens, `${prefix}.source_tokens`);
	assertUniqueIds(targetTokens, `${prefix}.target_tokens`);

	// Build ID lookup sets
	const validSourceIds = new Set(sourceTokens.map((t) => t.id));
	const validTargetIds = new Set(targetTokens.map((t) => t.id));

	// Validate groups
	let groups = validateGroups(
		obj.groups,
		prefix,
		validSourceIds,
		validTargetIds,
		strippedSourceIds,
		strippedTargetIds
	);

	// Ensure every token is covered by exactly one group
	groups = ensureFullCoverage(groups, validSourceIds, validTargetIds);

	// Concatenation check (warn only)
	checkConcatenation(sourceTokens, targetTokens, sourceText, targetText, direction, prefix);

	return {
		source_text: sourceText,
		target_text: targetText,
		source_tokens: sourceTokens,
		target_tokens: targetTokens,
		groups
	};
}

/**
 * Validate an array of TokenInfo objects.
 */
function validateTokenInfoArray(tokens: unknown[], prefix: string, isJP: boolean): TokenInfo[] {
	const result: TokenInfo[] = [];

	for (let j = 0; j < tokens.length; j++) {
		result.push(validateTokenInfo(tokens[j], `${prefix}[${j}]`, isJP));
	}

	return result;
}

/**
 * Validate a single TokenInfo, auto-filling missing fields.
 */
function validateTokenInfo(value: unknown, prefix: string, isJP: boolean): TokenInfo {
	if (typeof value !== 'object' || value === null) {
		throw new Error(`${prefix} must be an object`);
	}

	const obj = value as Record<string, unknown>;

	// id — required number
	if (typeof obj.id !== 'number') {
		throw new Error(`${prefix}.id must be a number`);
	}
	const id = obj.id;

	// text — required non-empty string (no ghost tokens in V2!)
	if (typeof obj.text !== 'string' || obj.text.length === 0) {
		throw new Error(`${prefix}.text must be a non-empty string`);
	}
	const text = obj.text;

	// Auto-fill base_form from text
	const base_form =
		typeof obj.base_form === 'string' && obj.base_form.length > 0 ? obj.base_form : text;

	// Auto-fill reading: from text if JP token, else ""
	const reading = typeof obj.reading === 'string' ? obj.reading : isJP ? text : '';

	// Auto-fill type
	const type = typeof obj.type === 'string' && obj.type.length > 0 ? obj.type : 'trợ từ';

	// grammar — optional, must have both form and explanation; drop if malformed
	let grammar: TokenInfo['grammar'] | undefined;
	if (obj.grammar !== undefined && typeof obj.grammar === 'object' && obj.grammar !== null) {
		const g = obj.grammar as Record<string, unknown>;
		if (
			typeof g.form === 'string' &&
			g.form.length > 0 &&
			typeof g.explanation === 'string' &&
			g.explanation.length > 0
		) {
			grammar = { form: g.form, explanation: g.explanation };
		}
		// else: malformed, silently drop
	}

	// context — optional string, pass through
	const context = typeof obj.context === 'string' ? obj.context : undefined;

	// kanji — optional array of {char, hv, meaning}
	let kanji: TokenInfo['kanji'] | undefined;
	if (Array.isArray(obj.kanji)) {
		const validKanji: { char: string; hv: string; meaning: string }[] = [];
		for (let k = 0; k < obj.kanji.length; k++) {
			const entry = obj.kanji[k];
			if (typeof entry === 'object' && entry !== null) {
				const e = entry as Record<string, unknown>;
				if (typeof e.char === 'string' && e.char.length > 0) {
					validKanji.push({
						char: e.char,
						hv: typeof e.hv === 'string' ? e.hv : '',
						meaning: typeof e.meaning === 'string' ? e.meaning : ''
					});
				}
			}
		}
		if (validKanji.length > 0) {
			kanji = validKanji;
		}
	}

	const token: TokenInfo = { id, text, base_form, reading, type };
	if (grammar) token.grammar = grammar;
	if (context !== undefined) token.context = context;
	if (kanji) token.kanji = kanji;

	return token;
}

/**
 * Assert that token IDs are unique within an array.
 */
function assertUniqueIds(tokens: TokenInfo[], prefix: string): void {
	const seen = new Set<number>();
	for (const t of tokens) {
		if (seen.has(t.id)) {
			throw new Error(`${prefix} has duplicate token id ${t.id}`);
		}
		seen.add(t.id);
	}
}

/**
 * Validate groups, dropping invalid ID references and stripped-whitespace IDs.
 */
function validateGroups(
	rawGroups: unknown[],
	prefix: string,
	validSourceIds: Set<number>,
	validTargetIds: Set<number>,
	strippedSourceIds: Set<number>,
	strippedTargetIds: Set<number>
): MappingGroup[] {
	const groups: MappingGroup[] = [];

	for (let g = 0; g < rawGroups.length; g++) {
		const gPrefix = `${prefix}.groups[${g}]`;
		const raw = rawGroups[g];

		if (typeof raw !== 'object' || raw === null) {
			throw new Error(`${gPrefix} must be an object`);
		}

		const obj = raw as Record<string, unknown>;

		if (typeof obj.group_id !== 'number') {
			throw new Error(`${gPrefix}.group_id must be a number`);
		}

		if (!Array.isArray(obj.source_ids)) {
			throw new Error(`${gPrefix}.source_ids must be an array`);
		}

		if (!Array.isArray(obj.target_ids)) {
			throw new Error(`${gPrefix}.target_ids must be an array`);
		}

		// Filter to only valid, non-stripped IDs
		const sourceIds = (obj.source_ids as unknown[]).filter(
			(id): id is number =>
				typeof id === 'number' && validSourceIds.has(id) && !strippedSourceIds.has(id)
		);

		const targetIds = (obj.target_ids as unknown[]).filter(
			(id): id is number =>
				typeof id === 'number' && validTargetIds.has(id) && !strippedTargetIds.has(id)
		);

		groups.push({
			group_id: obj.group_id,
			source_ids: sourceIds,
			target_ids: targetIds
		});
	}

	return groups;
}

/**
 * Ensure every source and target token ID appears in exactly one group.
 * Auto-create orphan groups for any missing tokens.
 */
function ensureFullCoverage(
	groups: MappingGroup[],
	validSourceIds: Set<number>,
	validTargetIds: Set<number>
): MappingGroup[] {
	const coveredSource = new Set<number>();
	const coveredTarget = new Set<number>();

	for (const g of groups) {
		for (const id of g.source_ids) coveredSource.add(id);
		for (const id of g.target_ids) coveredTarget.add(id);
	}

	// Find the max group_id to generate new unique IDs
	let maxGroupId = 0;
	for (const g of groups) {
		if (g.group_id > maxGroupId) maxGroupId = g.group_id;
	}

	// Orphan source tokens
	for (const id of validSourceIds) {
		if (!coveredSource.has(id)) {
			maxGroupId++;
			groups.push({
				group_id: maxGroupId,
				source_ids: [id],
				target_ids: []
			});
		}
	}

	// Orphan target tokens
	for (const id of validTargetIds) {
		if (!coveredTarget.has(id)) {
			maxGroupId++;
			groups.push({
				group_id: maxGroupId,
				source_ids: [],
				target_ids: [id]
			});
		}
	}

	return groups;
}

/**
 * Concatenation check: warn if token texts don't reconstruct the original text.
 * JP tokens join with '', VN tokens join with ' '.
 */
function checkConcatenation(
	sourceTokens: TokenInfo[],
	targetTokens: TokenInfo[],
	sourceText: string,
	targetText: string,
	direction: Direction,
	prefix: string
): void {
	const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');

	const sourceIsJP = direction === 'jp-vn';

	// JP side
	const jpTokens = sourceIsJP ? sourceTokens : targetTokens;
	const jpText = sourceIsJP ? sourceText : targetText;
	const jpJoined = normalize(jpTokens.map((t) => t.text).join(''));
	const jpExpected = normalize(jpText);

	if (jpJoined !== jpExpected) {
		console.warn(
			`[validate] ${prefix}: JP token concatenation mismatch.\n  Expected: "${jpExpected}"\n  Got:      "${jpJoined}"`
		);
	}

	// VN side
	const vnTokens = sourceIsJP ? targetTokens : sourceTokens;
	const vnText = sourceIsJP ? targetText : sourceText;
	const vnJoined = normalize(vnTokens.map((t) => t.text).join(' '));
	const vnExpected = normalize(vnText);

	if (vnJoined !== vnExpected) {
		console.warn(
			`[validate] ${prefix}: VN token concatenation mismatch.\n  Expected: "${vnExpected}"\n  Got:      "${vnJoined}"`
		);
	}
}
