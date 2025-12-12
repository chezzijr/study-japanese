import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

interface KanjiItem {
	word: string;
	meaning: string;
	meaning_resolution?: string;
	kunyomi?: string[];
	onyomi?: string[];
	radicals?: string[];
}

// Client-only route (uses canvas and fetch API)
export const ssr = false;
export const prerender = false;

export const load: PageLoad = async ({ params }) => {
	const kanjiImportObject = import.meta.glob('$lib/kanji/*.json');
	const level = params.level;

	for (const [path, importer] of Object.entries(kanjiImportObject)) {
		const fileName = path.split('/').pop();
		if (!fileName) continue;

		const k = fileName.replace('.json', '');
		// Skip definition files (e.g., n5_def.json)
		if (k.includes('_def')) continue;

		if (k === level) {
			const data = ((await importer()) as { default: KanjiItem[] }).default;
			return {
				level,
				kanjis: data
			};
		}
	}

	error(404, 'Not found: ' + level);
};
