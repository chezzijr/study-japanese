import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { Dictionary } from '$lib/types/vocab';
import importUnit from '$lib/unit_import';

export const load: PageLoad = async ({ params }) => {
	// in folder n5, list all files
    const unit = params.unit;
    return importUnit(unit)
    // const unitImportObject = import.meta.glob('$lib/n5/*.json');
    // const unitFiles = Object.keys(unitImportObject);
    // if (unit === "all") {
    //     const allUnits = await Promise.all(unitFiles.map(async (unitFile) => {
    //         return (await unitImportObject[unitFile]() as any).default as Dictionary;
    //     }));
    //     // combine all units into one json
    //     const allUnitsJson = allUnits.reduce((acc, json) => {
    //         return {
    //             ...acc,
    //             ...json
    //         };
    //     }, {});
    //     return {
    //         unit: "all",
    //         json: allUnitsJson
    //     };
    // }
    // for (const unitFile of unitFiles) {
    //     const fileName = unitFile.split('/').pop();
    //     if (!fileName) {
    //         continue;
    //     }
    //     const u = fileName.split('.').shift();
    //     if (u === unit) {
    //         return {
    //             unit,
    //             json: (await unitImportObject[unitFile]() as any).default as Dictionary
    //         };
    //     }
    // }
};