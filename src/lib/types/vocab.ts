export type WordDefinition = {
	word: string;
	reading?: string;
	meaning: string;
	type?: string; // Word type: e.g., "động từ I", "danh từ", "tính từ い"
	note?: string; // Usage info: particles, context, politeness, transitivity
	pairWith?: string; // References counterpart verb word in same unit
	_unit?: string; // Internal field tracking source unit (populated when loading "all" or range views)
};

export type Dictionary = WordDefinition[];
