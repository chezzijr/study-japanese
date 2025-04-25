import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { Dictionary } from '$lib/types/vocab';
import importUnit from '$lib/unit_import';

export const load: PageLoad = async ({ params }) => {
    // in folder n5, list all files
    // const unitImportObject = import.meta.glob('$lib/n5/*.json');
    // const unitFiles = Object.keys(unitImportObject);
    // const allUnits = await Promise.all(unitFiles.map(async (unitFile) => {
    //     return (await unitImportObject[unitFile]() as any).default as Dictionary;
    // }));
    // // combine all units into one json
    // const allUnitsJson = allUnits.reduce((acc, json) => {
    //     for (const key in json) {
    //         if (json[key].note && ['I', 'II', 'III'].includes(json[key].note)) {
    //             acc[key] = json[key];
    //         }
    //     }
    //     return acc;
    // }, {});
    // return {
    //     unit: "all",
    //     json: allUnitsJson
    // };
    
    return importUnit("all");
};