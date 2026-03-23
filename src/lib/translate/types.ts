export type ProviderName = 'claude' | 'gemini' | 'openai';

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

export interface AISettings {
	id: 'default';
	provider: ProviderName;
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
	response: TranslationResponse;
	provider: ProviderName;
	createdAt: number;
}
