import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { Kanji } from '$lib/types/kanji';

export const load: PageLoad = async ({ params }) => {
  // in folder n5, list all files
  const kanjiImportObject = import.meta.glob('$lib/kanji/*.json');
  const kanjiFiles = Object.keys(kanjiImportObject)
  const level = params.level;
  for (const kanjiFile of kanjiFiles) {
    const fileName = kanjiFile.split('/').pop();
    if (!fileName) {
      continue;
    }
    const k = fileName.split('.').shift();
    if (k === level) {
      return {
        level,
        json: (await kanjiImportObject[kanjiFile]() as any).default as Kanji
      };
    }
  }

  error(404, 'Not found: ' + level);
};
