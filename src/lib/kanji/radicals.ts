/**
 * Bộ thủ (Kangxi radical) lookup helpers.
 *
 * The chiết tự breakdown is authoritative, teacher-curated data stored per-kanji on the level
 * data files as a `chietTu` field (hand-maintained in n4.json / n5.json; every N4 + N5 kanji has
 * one). It is the source of truth for the component breakdown, per-component meanings, and the
 * mnemonic.
 *
 * Supporting reference data (under src/lib/kanji/, all hand-authored / committed):
 *  - radicals.json     214-radical dictionary (Hán-Việt name, meaning, strokes, variants)
 *  - classifying.json  kanji -> classical (Kangxi) radical NUMBER (1..214); picks the primary bộ
 *  - phonetics.json    Hán-Việt labels for common components that are neither a Kangxi radical
 *                      nor an app kanji (e.g. 由 in 油), used to back-fill tooltips
 *
 * Model = "bộ chính + thành phần có nghĩa":
 *  - primary    = the kanji's classifying bộ thủ (from classifying.json), badged in the UI
 *  - components = the remaining curated chiết tự parts, with meanings from the source table
 */

import type { RadicalInfo } from '$lib/types/kanji';
import radicalsData from './radicals.json';
import classifyingData from './classifying.json';
import phoneticsData from './phonetics.json';

export type { RadicalInfo };

const RADICALS = radicalsData as RadicalInfo[];
const CLASSIFYING = classifyingData as Record<string, number>;
// Supplementary phonetic/semantic components (not Kangxi radicals, not app kanji).
type Phonetic = { hanViet: string; meaning: string };
const PHONETICS = phoneticsData as Record<string, Phonetic | string>;

// Authoritative, teacher-curated chiết tự stored per-kanji on the level data files (the
// `chietTu` field). Filled from the same level-file glob used for kanjiMeaning below.
type ChietTuComponent = { char: string; canonical?: string; meaning?: string };
type ChietTuEntry = { components: ChietTuComponent[]; mnemonic: string };
const CHIET_TU: Record<string, ChietTuEntry> = {};

/** A resolved bộ thủ component shown in the UI. */
export type Component = {
	char: string; // glyph to display (preferred/canonical form)
	canonical: string; // canonical radical char, or the raw char if not a radical
	hanViet: string | null; // Sino-Vietnamese name (or kanji reading fallback), null if unknown
	meaning: string | null; // Vietnamese gloss, null when only a fallback reading is known
	isRadical: boolean; // true when resolved from the radical dictionary
	isPrimary: boolean; // true for the classifying bộ thủ
};

// Index every canonical char AND every variant form -> its RadicalInfo.
const radicalIndex = new Map<string, RadicalInfo>();
for (const r of RADICALS) {
	radicalIndex.set(r.radical, r);
	for (const v of r.variants ?? []) radicalIndex.set(v, r);
}

// Build a global kanji -> Hán-Việt reading index AND the chiết tự map from the level data files
// (n1..n5): the reading map back-fills components that are kanji but not dictionary radicals.
type KanjiItem = { word: string; meaning: string; chietTu?: ChietTuEntry };
const kanjiMeaning = new Map<string, string>();
const levelFiles = import.meta.glob<{ default: KanjiItem[] }>('./n[12345].json', { eager: true });
for (const mod of Object.values(levelFiles)) {
	for (const k of mod.default) {
		if (k.word && k.meaning && !kanjiMeaning.has(k.word)) kanjiMeaning.set(k.word, k.meaning);
		if (k.word && k.chietTu && !CHIET_TU[k.word]) CHIET_TU[k.word] = k.chietTu;
	}
}

/** Resolve a dictionary radical (by canonical or variant form) to a Component. `preferForm`
 *  overrides the displayed glyph; otherwise the radical's display/canonical form is used. */
function resolveComponent(raw: string, isPrimary: boolean, preferForm?: string): Component {
	const info = radicalIndex.get(raw);
	if (info) {
		return {
			char: preferForm ?? info.display ?? info.radical,
			canonical: info.radical,
			hanViet: info.hanViet,
			meaning: info.meaning,
			isRadical: true,
			isPrimary
		};
	}
	// Supplementary phonetic/semantic component (e.g. 由 in 油, 免 in 晩).
	const ph = PHONETICS[raw];
	if (ph && typeof ph === 'object') {
		return {
			char: raw,
			canonical: raw,
			hanViet: ph.hanViet,
			meaning: ph.meaning,
			isRadical: false,
			isPrimary
		};
	}
	const reading = kanjiMeaning.get(raw);
	return {
		char: raw,
		canonical: raw,
		hanViet: reading ?? null,
		meaning: null,
		isRadical: false,
		isPrimary
	};
}

/** Resolve a curated chiết tự component to a Component: glyph + meaning from the source table
 *  (authoritative), Hán-Việt name back-filled from the radical/phonetic/app-kanji dictionaries. */
function resolveTmpComponent(c: ChietTuComponent, isPrimary: boolean): Component {
	const info = radicalIndex.get(c.canonical ?? c.char) ?? radicalIndex.get(c.char);
	let hanViet: string | null = null;
	let dictMeaning: string | null = null;
	if (info) {
		hanViet = info.hanViet;
		dictMeaning = info.meaning;
	} else {
		const ph = PHONETICS[c.char];
		if (ph && typeof ph === 'object') {
			hanViet = ph.hanViet;
			dictMeaning = ph.meaning;
		} else {
			hanViet = kanjiMeaning.get(c.char) ?? null;
		}
	}
	return {
		char: c.char,
		canonical: c.canonical ?? (info ? info.radical : c.char),
		hanViet,
		meaning: c.meaning ?? dictMeaning ?? null,
		isRadical: !!info,
		isPrimary
	};
}

/** Look up a radical (by canonical or variant form). */
export function getRadicalInfo(char: string): RadicalInfo | null {
	return radicalIndex.get(char) ?? null;
}

/** The kanji's classifying bộ thủ (the single official radical), or null if unknown. */
export function getClassifying(kanji: string): RadicalInfo | null {
	const num = CLASSIFYING[kanji];
	if (!num) return null;
	return RADICALS[num - 1] ?? null;
}

/** Full bộ thủ breakdown for a kanji: the classifying bộ (badged as primary) plus the curated
 *  chiết tự components. Kanji without a chietTu entry fall back to just their classifying bộ. */
export function boThu(kanji: string): { primary: Component | null; components: Component[] } {
	const ct = CHIET_TU[kanji];
	if (ct) {
		const primaryCanonical = getClassifying(kanji)?.radical ?? null;
		let primary: Component | null = null;
		const components: Component[] = [];
		for (const c of ct.components) {
			const resolved = resolveTmpComponent(c, false);
			if (!primary && primaryCanonical && resolved.canonical === primaryCanonical) {
				primary = { ...resolved, isPrimary: true };
			} else {
				components.push(resolved);
			}
		}
		// If the classifying bộ isn't among the curated components (e.g. the kanji is itself a
		// radical, like 谷), leave `primary` null and just show the curated components verbatim —
		// never inject a glyph the source table didn't list.
		return { primary, components };
	}

	const primaryInfo = getClassifying(kanji);
	const primary = primaryInfo ? resolveComponent(primaryInfo.radical, true) : null;
	return { primary, components: [] };
}

/** The teacher-curated mnemonic ("Gợi ý học") for a kanji, or null when none exists. */
export function mnemonic(kanji: string): string | null {
	return CHIET_TU[kanji]?.mnemonic ?? null;
}

/** Flat list of all bộ thủ parts for a kanji (primary first) — convenient for search. */
export function boThuParts(kanji: string): Component[] {
	const { primary, components } = boThu(kanji);
	return primary ? [primary, ...components] : components;
}

/** Tooltip label for a component, or null only when neither a Hán-Việt name nor a meaning is
 *  known (e.g. 关 in 送, 丙 in 病 have a curated meaning but no Hán-Việt reading — show the meaning). */
export function componentLabel(c: Component): string | null {
	const base = c.hanViet
		? c.meaning
			? `${c.hanViet} — ${c.meaning}`
			: c.hanViet
		: (c.meaning ?? null);
	if (!base) return null;
	// When the shown glyph isn't the canonical radical, reveal the mapping (氵 → 水 THỦY — nước).
	if (c.isRadical && c.char !== c.canonical) return `${c.char} → ${c.canonical} ${base}`;
	return base;
}

// Reverse index: radical canonical char -> app kanji whose bộ thủ breakdown includes it.
const kanjiByRadical = new Map<string, string[]>();
for (const kanji of Object.keys(CHIET_TU)) {
	for (const part of boThuParts(kanji)) {
		if (!part.isRadical) continue;
		const list = kanjiByRadical.get(part.canonical) ?? [];
		list.push(kanji);
		kanjiByRadical.set(part.canonical, list);
	}
}

/** App kanji whose bộ thủ breakdown contains the given radical (canonical char). */
export function kanjiForRadical(radical: string): string[] {
	return kanjiByRadical.get(radical) ?? [];
}

/** The full 214-radical dictionary, in Kangxi (stroke) order. */
export const ALL_RADICALS: RadicalInfo[] = RADICALS;
