import type { Dictionary } from '$lib/types/vocab';
import { error } from '@sveltejs/kit';

const LEVEL_IMPORTS = {
	n1: import.meta.glob<{ default: Dictionary }>('$lib/n1/*.json'),
	n2: import.meta.glob<{ default: Dictionary }>('$lib/n2/*.json'),
	n3: import.meta.glob<{ default: Dictionary }>('$lib/n3/*.json'),
	n4: import.meta.glob<{ default: Dictionary }>('$lib/n4/*.json'),
	n5: import.meta.glob<{ default: Dictionary }>('$lib/n5/*.json')
};

type Level = keyof typeof LEVEL_IMPORTS;

// Parse comma-separated unit string like "u1-u3,u5,u8-u10" into sorted array of unit numbers
function parseUnitString(s: string): number[] {
	const segments = s.split(',');
	const unitNumbers = new Set<number>();

	for (const segment of segments) {
		if (segment.includes('-')) {
			const [start, end] = segment.split('-').map((u) => parseInt(u.replace('u', '')));
			for (let i = start; i <= end; i++) {
				unitNumbers.add(i);
			}
		} else {
			unitNumbers.add(parseInt(segment.replace('u', '')));
		}
	}

	return [...unitNumbers].sort((a, b) => a - b);
}

export default async function importUnit(s: string, level: Level = 'n5') {
	// s in form of: all, u1, u3-u8, u1-u3,u5,u8-u10 (comma-separated segments)
	if (!/^(all|u\d+(-u\d+)?(,u\d+(-u\d+)?)*)$/.test(s)) {
		throw new Error('Invalid unit format: ' + s);
	}

	const unitImportObject = LEVEL_IMPORTS[level];
	const unitFiles = Object.keys(unitImportObject);

	// Handle 'all'
	if (s === 'all') {
		const allUnits = await Promise.all(
			unitFiles.map(async (unitFile) => {
				const fileName = unitFile.split('/').pop();
				const u = fileName?.split('.').shift() ?? '';
				const words = (await unitImportObject[unitFile]()).default;
				return words.map((w) => ({ ...w, _unit: u }));
			})
		);
		const allUnitsJson = allUnits.reduce((acc, json) => {
			return [...acc, ...json];
		}, [] as Dictionary);
		return {
			unit: 'all',
			json: allUnitsJson
		};
	}

	// Parse the unit string (handles single, range, and comma-separated formats)
	const unitNumbers = parseUnitString(s);
	const targetUnits = unitNumbers.map((n) => `u${n}`);

	// Single unit - don't add _unit field
	if (targetUnits.length === 1) {
		const targetUnit = targetUnits[0];
		for (const unitFile of unitFiles) {
			const fileName = unitFile.split('/').pop();
			if (!fileName) continue;
			const u = fileName.split('.').shift();
			if (u === targetUnit) {
				return {
					unit: s,
					json: (await unitImportObject[unitFile]()).default
				};
			}
		}
		error(404, `Unit ${s} not found`);
	}

	// Multiple units - add _unit field for tracking
	const dict = await unitFiles.reduce(
		async (acc, unitFile) => {
			const fileName = unitFile.split('/').pop();
			if (!fileName) return acc;
			const u = fileName.split('.').shift() as string;
			if (targetUnits.includes(u)) {
				const json = await unitImportObject[unitFile]();
				const wordsWithUnit = json.default.map((w) => ({ ...w, _unit: u }));
				return [...(await acc), ...wordsWithUnit];
			}
			return await acc;
		},
		Promise.resolve([] as Dictionary)
	);

	if (dict.length === 0) {
		error(404, `No units found for ${s}`);
	}

	return { unit: s, json: dict as Dictionary };
}
