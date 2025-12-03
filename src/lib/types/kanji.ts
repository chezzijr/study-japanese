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
