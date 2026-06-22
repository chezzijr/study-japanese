import { ALL_RADICALS, kanjiForRadical } from '$lib/kanji/radicals';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = () => {
	const radicals = ALL_RADICALS.map((r) => ({
		...r,
		examples: kanjiForRadical(r.radical)
	}));
	return { radicals };
};
