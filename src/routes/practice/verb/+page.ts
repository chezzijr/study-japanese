import type { PageLoad } from './$types';
import importUnit from '$lib/unit_import';

export const load: PageLoad = async ({ params }) => {
	const data = await importUnit('all');
	return {
		unit: data.unit,
		json: data.json.filter((kotoba) => ['I', 'II', 'III'].includes(kotoba.note ?? ''))
	};
};
