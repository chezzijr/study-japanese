/**
 * Add radicals to kanji data from Jotoba API
 * Usage: npx tsx scripts/add_radicals.ts
 */

import fs from 'fs';

type KanjiEntry = {
	word: string;
	meaning: string;
	kunyomi: string[];
	onyomi: string[];
	examples?: Array<{
		word: string;
		reading: string;
		meaning: string;
		special_case?: boolean;
	}>;
	radicals?: string;
};

type KanjiJotobaResponse = {
	kanji: Array<{
		literal: string;
		radical: string;
	}>;
};

async function fetchRadical(kanji: string): Promise<string | null> {
	const url = 'https://jotoba.de/api/search/kanji';
	const body = {
		query: kanji,
		language: 'English',
		no_english: false
	};

	try {
		const response = await fetch(url, {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			console.error(`Failed to fetch ${kanji}: ${response.status}`);
			return null;
		}

		const data = (await response.json()) as KanjiJotobaResponse;
		if (data.kanji && data.kanji.length > 0) {
			const radical = data.kanji[0].radical;
			// Don't include radical if it's the same as the kanji itself (redundant)
			if (radical === kanji) {
				return null;
			}
			return radical;
		}
		return null;
	} catch (error) {
		console.error(`Error fetching ${kanji}:`, error);
		return null;
	}
}

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
	const kanjiFiles = fs.readdirSync('./src/lib/kanji/');
	const kanjiFilesFiltered = kanjiFiles.filter(
		(file) => file.endsWith('.json') && !file.includes('_def')
	);

	for (const file of kanjiFilesFiltered) {
		const filePath = `./src/lib/kanji/${file}`;
		console.log(`Processing ${file}...`);

		const buffer = fs.readFileSync(filePath);
		const kanjis: KanjiEntry[] = JSON.parse(buffer.toString());

		let updated = 0;
		let skipped = 0;

		for (let i = 0; i < kanjis.length; i++) {
			const entry = kanjis[i];

			console.log(`  [${i + 1}/${kanjis.length}] Fetching radicals for ${entry.word}...`);

			const radicals = await fetchRadical(entry.word);
			if (radicals) {
				entry.radicals = radicals;
				updated++;
			} else {
				// Remove radicals field if it exists but should be empty
				if (entry.radicals) {
					delete entry.radicals;
					console.log(`    Removed redundant radical (same as kanji)`);
				}
				skipped++;
			}

			// Rate limiting - 100ms delay between requests
			await sleep(100);
		}

		// Write back to file
		fs.writeFileSync(filePath, JSON.stringify(kanjis, null, '\t'));
		console.log(`  Done! Updated: ${updated}, Skipped (already had radicals): ${skipped}`);
	}

	console.log('All files processed!');
}

main().catch(console.error);
