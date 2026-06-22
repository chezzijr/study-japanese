export type KanjiDefinition = {
	meanings: string;
	grade: number;
	stroke_count: number;
	frequency: number;
	onyomi: string[];
	kunyomi: string[];
	parts: string[];
	radicals: string;
};

export type Kanji = {
	[key: string]: KanjiDefinition;
};

export type KanjiJotoba = {
	literal: string;
	meanings: string[];
	grade: number;
	stroke_count: number;
	frequency: number;
	jlpt: number;
	onyomi: string[];
	kunyomi: string[];
	chinese: string[];
	korean_r: string[];
	korean_h: string[];
	parts: string[];
	radicals: string;
	stroke_frames: string[];
};

type KanjiJotobaResponse = {
	kanji: KanjiJotoba[];
};

/** A single Kangxi radical (bộ thủ) dictionary entry. */
export type RadicalInfo = {
	radical: string; // canonical CJK form, e.g. "水"
	hanViet: string; // Sino-Vietnamese name, e.g. "THỦY"
	meaning: string; // Vietnamese gloss, e.g. "nước"
	strokes: number; // stroke count (standard Kangxi ordering)
	display?: string; // preferred glyph when canonical is unfamiliar, e.g. 辵 -> "辶"
	variants?: string[]; // alternate / component forms, e.g. ["氵", "氺"]
};
