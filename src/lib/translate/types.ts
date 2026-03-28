export type { ProviderName } from './models';

// ── V1 Types (kept for backward compatibility) ──────────────────────

export interface Token {
	id: number;
	jp: string; // surface form in Japanese text
	vn: string; // Vietnamese translation
	base_form: string; // dictionary form
	reading: string; // hiragana reading of base_form
	type: string; // word type: "động từ I", "danh từ", "tính từ い", etc.
	grammar?: {
		// only if non-trivial
		form: string; // e.g., "ている", "たら", "られる"
		explanation: string; // Vietnamese explanation
	};
	context?: string; // only if role in sentence is non-obvious
	kanji?: {
		char: string;
		hv: string; // Sino-Vietnamese reading
		meaning: string;
	}[];
}

export interface Sentence {
	tokens: Token[];
	jp_order: number[]; // token IDs in Japanese order
	vn_order: number[]; // token IDs in natural Vietnamese order
	vn_full: string; // full Vietnamese sentence (fallback)
}

export interface TranslationResponse {
	sentences: Sentence[];
}

// ── V2 Types ────────────────────────────────────────────────────────

export type Direction = 'jp-vn' | 'vn-jp';

export interface TokenInfo {
	id: number;
	text: string;
	base_form: string;
	reading: string;
	type: string;
	grammar?: { form: string; explanation: string };
	context?: string;
	kanji?: { char: string; hv: string; meaning: string }[];
}

export interface MappingGroup {
	group_id: number;
	source_ids: number[];
	target_ids: number[];
}

export interface SentenceMapping {
	source_text: string;
	target_text: string;
	source_tokens: TokenInfo[];
	target_tokens: TokenInfo[];
	groups: MappingGroup[];
}

export interface TranslationResponseV2 {
	version: 2;
	direction: Direction;
	sentences: SentenceMapping[];
}

export function isV2(r: TranslationResponse | TranslationResponseV2): r is TranslationResponseV2 {
	return 'version' in r && (r as TranslationResponseV2).version === 2;
}

// ── Settings & Storage ──────────────────────────────────────────────

export interface AISettings {
	id: 'default';
	translationModel: string;
	tokenizationModel: string;
	/**
	 * API keys stored in plaintext in IndexedDB. This is intentional:
	 * - Users provide their own API keys ("bring your own key" pattern)
	 * - The app is 100% client-side (static site, no server)
	 * - Keys never leave the user's device
	 */
	keys: {
		claude?: string;
		gemini?: string;
		openai?: string;
	};
}

export interface SavedTranslation {
	id: string;
	sourceText: string;
	direction?: Direction;
	response: TranslationResponse | TranslationResponseV2;
	provider?: ProviderName;
	translationModel?: string;
	tokenizationModel?: string;
	createdAt: number;
}
