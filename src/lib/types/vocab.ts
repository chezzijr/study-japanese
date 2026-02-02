export type WordDefinition = {
	word: string;
	reading?: string;
	meaning: string;
	type?: string; // Word type: e.g., "động từ I", "danh từ", "tính từ い"
	note?: string; // Usage info: particles, context, politeness
	_unit?: string; // Internal field tracking source unit (populated when loading "all" or range views)
};

export type Dictionary = WordDefinition[];
