import type { Dictionary } from '$lib/types/vocab';
import { error } from '@sveltejs/kit';

export default async function importUnit(s: string) {
  // s in form of all, u1, u2, u3-u8, u4-u8, u5-u8, etc.
  // check if s not in above format
  if (!/^(all|u\d+(-u\d+)?)$/.test(s)) {
    throw new Error('Invalid unit format: ' + s);
  }

  const unitImportObject = import.meta.glob('$lib/n5/*.json');
  const unitFiles = Object.keys(unitImportObject);
  // if select all units
  if (s === "all") {
    const allUnits = await Promise.all(unitFiles.map(async (unitFile) => {
      return (await unitImportObject[unitFile]() as any).default as Dictionary;
    }));
    // combine all units into one json
    const allUnitsJson = allUnits.reduce((acc, json) => {
      return [
        ...acc,
        ...json
      ];
    }, []);
    return {
      unit: "all",
      json: allUnitsJson
    };
  }
  // if select range of units
  else if (s.includes('-')) {
    // get range of units
    const [start, end] = s.split('-').map((u) => parseInt(u.replace('u', '')));
    const units = Array.from({ length: end - start + 1 }, (_, i) => `u${start + i}`);
    const dict = await unitFiles.reduce(async (acc, unitFile) => {
      const fileName = unitFile.split('/').pop();
      if (!fileName) {
        return acc;
      }
      const u = fileName.split('.').shift() as string;
      if (units.includes(u)) {
        const json = await unitImportObject[unitFile]() as any;
        return [
          ...await acc,
          ...json.default
        ];
      }
      return await acc;
    }, Promise.resolve([] as Dictionary));
    return {
      unit: s,
      json: dict as Dictionary
    }
  }
  else {
    for (const unitFile of unitFiles) {
      const fileName = unitFile.split('/').pop();
      if (!fileName) {
        continue;
      }
      const u = fileName.split('.').shift();
      if (u === s) {
        return {
          unit: s,
          json: (await unitImportObject[unitFile]() as any).default as Dictionary
        };
      }
    }
  }
  error(404, `Unit ${s} not found`);
}
