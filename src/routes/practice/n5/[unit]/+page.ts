import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	// in folder n5, list all files
    const unitImportObject = import.meta.glob('$lib/n5/*.json');
    const unitFiles = Object.keys(unitImportObject)
    const unit = params.unit;
    for (const unitFile of unitFiles) {
        if (unitFile.split('/').pop().split('.').shift() === unit) {
            return {
                unit,
                json: (await unitImportObject[unitFile]()).default
            };
        }
    }

	error(404, 'Not found: ' + unit);
};