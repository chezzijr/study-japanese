import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

interface KanjiItem {
	word: string;
	meaning: string;
	kunyomi: string[];
	onyomi: string[];
	radicals?: string;
	examples?: Array<{
		word: string;
		reading: string;
		meaning: string;
		special_case?: boolean;
	}>;
}

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
