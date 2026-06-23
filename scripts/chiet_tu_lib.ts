/**
 * Shared chiết-tự resolution logic for the read-only tooling
 * (scripts/draft_chiet_tu.ts, scripts/audit_chiet_tu.ts).
 *
 * This MIRRORS src/lib/kanji/radicals.ts so the scripts compute exactly what the app
 * renders. It cannot import radicals.ts directly because that module uses Vite's
 * import.meta.glob; here we read the JSON files with fs instead.
 *
 * Keep this in sync with radicals.ts if its filtering/resolution logic changes.
 */

import fs from 'fs';

const KANJI_DIR = './src/lib/kanji';

type RadicalInfo = {
	radical: string;
	hanViet: string;
	meaning: string;
	strokes: number;
	variants?: string[];
	display?: string;
};
type Phonetic = { hanViet: string; meaning: string };

function readJson<T>(name: string): T {
	return JSON.parse(fs.readFileSync(`${KANJI_DIR}/${name}`, 'utf-8')) as T;
}

const RADICALS = readJson<RadicalInfo[]>('radicals.json');
const CLASSIFYING = readJson<Record<string, number>>('classifying.json');
const DECOMPOSITION = readJson<Record<string, string[]>>('decomposition.json');
const OVERRIDES = readJson<Record<string, unknown>>('decomposition-overrides.json');
const PHONETICS = readJson<Record<string, Phonetic | string>>('phonetics.json');

// kanji -> Hán-Việt reading from the level data files (fallback for kanji components).
const GENERATED = new Set([
	'decomposition.json',
	'classifying.json',
	'radicals.json',
	'decomposition-overrides.json',
	'phonetics.json'
]);
const kanjiMeaning = new Map<string, string>();
for (const f of fs.readdirSync(KANJI_DIR)) {
	if (!/^n[12345]\.json$/.test(f) || GENERATED.has(f)) continue;
	const list = readJson<Array<{ word: string; meaning: string }>>(f);
	for (const k of list)
		if (k.word && k.meaning && !kanjiMeaning.has(k.word)) kanjiMeaning.set(k.word, k.meaning);
}

const radicalIndex = new Map<string, RadicalInfo>();
for (const r of RADICALS) {
	radicalIndex.set(r.radical, r);
	for (const v of r.variants ?? []) radicalIndex.set(v, r);
}

const NOISE_COMPONENTS = new Set<string>(['亠']);

const KRAD_DISPLAY: Record<string, string> = {
	汁: '氵',
	込: '辶',
	化: '亻',
	个: '人',
	ハ: '八',
	'｜': '丨',
	刈: '刂',
	艾: '艹',
	礼: '礻',
	扎: '扌',
	杰: '灬',
	阡: '阝',
	邦: '阝'
};

const CONTAINS: Record<string, string[]> = {
	糸: ['幺', '小'],
	元: ['二', '儿'],
	青: ['月', '土', '二'],
	頁: ['貝', '目', '八'],
	穴: ['宀', '八', '儿'],
	母: ['毋']
};

export type Component = {
	char: string;
	canonical: string;
	hanViet: string | null;
	meaning: string | null;
	isRadical: boolean;
	isPrimary: boolean;
	/** How the component resolved — used by the audit to classify gaps. */
	source: 'radical' | 'phonetic' | 'kanji' | 'none';
};

function displayForm(info: RadicalInfo): string {
	return info.display ?? info.radical;
}

function formFor(raw: string, info: RadicalInfo): string {
	if (raw !== info.radical && (info.variants?.includes(raw) ?? false))
		return KRAD_DISPLAY[raw] ?? raw;
	return displayForm(info);
}

export function resolveComponent(raw: string, isPrimary: boolean, preferForm?: string): Component {
	const info = radicalIndex.get(raw);
	if (info) {
		return {
			char: preferForm ?? formFor(raw, info),
			canonical: info.radical,
			hanViet: info.hanViet,
			meaning: info.meaning,
			isRadical: true,
			isPrimary,
			source: 'radical'
		};
	}
	const ph = PHONETICS[raw];
	if (ph && typeof ph === 'object') {
		return {
			char: raw,
			canonical: raw,
			hanViet: ph.hanViet,
			meaning: ph.meaning,
			isRadical: false,
			isPrimary,
			source: 'phonetic'
		};
	}
	const reading = kanjiMeaning.get(raw);
	return {
		char: raw,
		canonical: raw,
		hanViet: reading ?? null,
		meaning: null,
		isRadical: false,
		isPrimary,
		source: reading ? 'kanji' : 'none'
	};
}

export function getClassifying(kanji: string): RadicalInfo | null {
	const num = CLASSIFYING[kanji];
	if (!num) return null;
	return RADICALS[num - 1] ?? null;
}

function meaningfulComponents(kanji: string, primaryCanonical: string | null): Component[] {
	const override = OVERRIDES[kanji];
	if (Array.isArray(override)) {
		return (override as string[])
			.map((raw) => resolveComponent(raw, false))
			.filter((c) => c.canonical !== primaryCanonical);
	}

	const raw = DECOMPOSITION[kanji] ?? [];
	const seen = new Set<string>();
	const candidates: { part: string; canonical: string }[] = [];
	for (const part of raw) {
		const info = radicalIndex.get(part);
		const canonical = info ? info.radical : part;
		if (canonical === kanji || part === kanji) continue;
		if (!info && !kanjiMeaning.has(part)) continue;
		if (info && info.strokes === 1 && canonical !== primaryCanonical) continue;
		if (canonical === primaryCanonical || seen.has(canonical)) continue;
		if (NOISE_COMPONENTS.has(canonical)) continue;
		seen.add(canonical);
		candidates.push({ part, canonical });
	}

	const suppressed = new Set<string>();
	if (primaryCanonical) for (const sub of CONTAINS[primaryCanonical] ?? []) suppressed.add(sub);
	for (const c of candidates) for (const sub of CONTAINS[c.canonical] ?? []) suppressed.add(sub);
	return candidates
		.filter((c) => !suppressed.has(c.canonical))
		.map((c) => resolveComponent(c.part, false));
}

function primaryFormInKanji(kanji: string, info: RadicalInfo): string {
	const raw = DECOMPOSITION[kanji] ?? [];
	for (const v of info.variants ?? []) if (raw.includes(v)) return KRAD_DISPLAY[v] ?? v;
	return displayForm(info);
}

export function boThu(kanji: string): { primary: Component | null; components: Component[] } {
	const primaryInfo = getClassifying(kanji);
	const primary = primaryInfo
		? resolveComponent(primaryInfo.radical, true, primaryFormInKanji(kanji, primaryInfo))
		: null;
	const components = meaningfulComponents(kanji, primaryInfo?.radical ?? null);
	return { primary, components };
}

export function componentLabel(c: Component): string | null {
	if (!c.hanViet) return null;
	const base = c.meaning ? `${c.hanViet} — ${c.meaning}` : c.hanViet;
	if (c.isRadical && c.char !== c.canonical) return `${c.char} → ${c.canonical} ${base}`;
	return base;
}

export function hasOverride(kanji: string): boolean {
	return Array.isArray(OVERRIDES[kanji]);
}

/** Raw KRADFILE parts the auto-filter would drop for a kanji (for draft annotations). */
export function droppedRawParts(kanji: string, primaryCanonical: string | null): string[] {
	const raw = DECOMPOSITION[kanji] ?? [];
	const kept = new Set(meaningfulComponents(kanji, primaryCanonical).map((c) => c.char));
	const dropped: string[] = [];
	for (const part of raw) {
		const info = radicalIndex.get(part);
		const shown = info ? formFor(part, info) : part;
		if (part === kanji) continue;
		if (kept.has(shown)) continue;
		const canonical = info ? info.radical : part;
		if (canonical === primaryCanonical) continue;
		dropped.push(part);
	}
	return dropped;
}

/** All app kanji (n4 + n5 union), in level-file order. */
export function allKanji(): { kanji: string; meaning: string; level: string }[] {
	const out: { kanji: string; meaning: string; level: string }[] = [];
	const seen = new Set<string>();
	for (const f of ['n5.json', 'n4.json', 'n3.json', 'n2.json', 'n1.json']) {
		if (!fs.existsSync(`${KANJI_DIR}/${f}`)) continue;
		const list = readJson<Array<{ word: string; meaning: string }>>(f);
		for (const k of list) {
			if (!k.word || seen.has(k.word)) continue;
			seen.add(k.word);
			out.push({ kanji: k.word, meaning: k.meaning, level: f.replace('.json', '') });
		}
	}
	return out;
}
