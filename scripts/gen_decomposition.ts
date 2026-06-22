/**
 * Generate radical data for the app's kanji, from the scriptin/jmdict-simplified
 * JSON releases (EDRDG data). Writes two files under src/lib/kanji/:
 *
 *   decomposition.json  { "語": ["言","口","五"] }  - KRADFILE component breakdown
 *   classifying.json    { "語": 149 }               - KANJIDIC classical (Kangxi) radical number
 *
 * Only kanji that appear in the app's src/lib/kanji/*.json level files are kept.
 * Raw KRADFILE component forms are preserved as-is; cleaning/normalization happens at
 * lookup time in src/lib/kanji/radicals.ts.
 *
 * Usage: npx tsx scripts/gen_decomposition.ts   (or: pnpm gen-decomposition)
 */

import fs from 'fs';
import { execSync } from 'child_process';

const KANJI_DIR = './src/lib/kanji';
const DECOMP_FILE = `${KANJI_DIR}/decomposition.json`;
const CLASSIFY_FILE = `${KANJI_DIR}/classifying.json`;
const RELEASE_API = 'https://api.github.com/repos/scriptin/jmdict-simplified/releases/latest';

type KradFile = { kanji: Record<string, string[]> };
type Kanjidic2 = {
	characters: Array<{
		literal: string;
		radicals?: Array<{ type: string; value: number }>;
	}>;
};
type KanjiEntry = { word: string };

// Files written by this script / not level data — never treat as kanji sources.
const GENERATED = new Set(['decomposition.json', 'classifying.json', 'radicals.json']);

/** Collect the set of kanji characters used across the app's kanji level files. */
function collectAppKanji(): Set<string> {
	const files = fs
		.readdirSync(KANJI_DIR)
		.filter((f) => f.endsWith('.json') && !f.includes('_def') && !GENERATED.has(f));

	const set = new Set<string>();
	for (const file of files) {
		const entries: KanjiEntry[] = JSON.parse(fs.readFileSync(`${KANJI_DIR}/${file}`).toString());
		for (const e of entries) {
			if (e.word) set.add(e.word);
		}
	}
	return set;
}

/** Resolve + download a release asset by name pattern, extract its single JSON, and parse it. */
function fetchAsset<T>(namePattern: RegExp, label: string): T {
	console.log(`Resolving ${label} release asset...`);
	const release = JSON.parse(execSync(`curl -sL "${RELEASE_API}"`).toString());
	const asset = (release.assets ?? []).find((a: { name: string }) => namePattern.test(a.name));
	if (!asset) throw new Error(`No ${label} asset matching ${namePattern} in latest release`);

	console.log(`Downloading ${asset.name}...`);
	// Stream the single JSON file out of the gzipped tarball directly to stdout.
	const json = execSync(`curl -sL "${asset.browser_download_url}" | tar -xzO`, {
		maxBuffer: 512 * 1024 * 1024
	}).toString();
	return JSON.parse(json) as T;
}

function main() {
	const appKanji = collectAppKanji();
	console.log(`Found ${appKanji.size} unique app kanji.`);

	const krad = fetchAsset<KradFile>(/^kradfile-.*\.json\.tgz$/, 'kradfile');
	const kd = fetchAsset<Kanjidic2>(/^kanjidic2-en-.*\.json\.tgz$/, 'kanjidic2');

	// KANJIDIC literal -> classical (Kangxi) radical number.
	const classicalRadical = new Map<string, number>();
	for (const c of kd.characters) {
		const cls = c.radicals?.find((r) => r.type === 'classical');
		if (cls) classicalRadical.set(c.literal, cls.value);
	}

	const decomposition: Record<string, string[]> = {};
	const classifying: Record<string, number> = {};
	let decMatched = 0;
	let decMissing = 0;
	const clsMissing: string[] = [];

	// Deterministic output order (sorted by codepoint).
	for (const kanji of [...appKanji].sort()) {
		const parts = krad.kanji[kanji];
		if (parts && parts.length > 0) {
			decomposition[kanji] = parts;
			decMatched++;
		} else {
			decMissing++;
		}

		const num = classicalRadical.get(kanji);
		if (num) classifying[kanji] = num;
		else clsMissing.push(kanji);
	}

	fs.writeFileSync(DECOMP_FILE, JSON.stringify(decomposition, null, '\t'));
	fs.writeFileSync(CLASSIFY_FILE, JSON.stringify(classifying, null, '\t'));

	console.log(`Wrote ${DECOMP_FILE}: ${decMatched} decomposed, ${decMissing} not in KRADFILE.`);
	console.log(
		`Wrote ${CLASSIFY_FILE}: ${Object.keys(classifying).length} classified` +
			(clsMissing.length ? `, MISSING radical for: ${clsMissing.join(' ')}` : ', none missing.')
	);
}

main();
