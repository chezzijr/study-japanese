export type WordDefinition = {
	word: string;
	reading?: string;
	meaning: string;
	note?: string;
	_unit?: string; // Internal field tracking source unit (populated when loading "all" or range views)
};

export type Dictionary = WordDefinition[];
