import type { PageLoad } from './$types';
import importUnit from '$lib/unit_import';

export const load: PageLoad = async ({ params }) => {
	const { level, unit } = params;
	return importUnit(unit, level as 'n1' | 'n2' | 'n3' | 'n4' | 'n5');
};
