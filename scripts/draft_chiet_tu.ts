/**
 * Read-only draft generator: for every kanji that still LACKS an explicit override,
 * print a candidate component array (seeded from the auto-filter) plus annotations, so the
 * curated decomposition-overrides.json can be filled in without guessing.
 *
 * For each kanji it prints:
 *   "kanji": [ ...candidate components... ],   // <primary bộ> | <component labels> | dropped: <raw parts the filter discarded>
 *
 * The "dropped" list surfaces meaningful phonetic parts the lossy filter would lose — add
 * them to phonetics.json and include them in the array.
 *
 * Usage: pnpm draft-chiet-tu   (optionally pipe through `less`)
 */

import {
	allKanji,
	boThu,
	componentLabel,
	droppedRawParts,
	getClassifying,
	hasOverride,
	resolveComponent
} from './chiet_tu_lib';

for (const { kanji: k, level } of allKanji()) {
	if (hasOverride(k)) continue;
	const primaryInfo = getClassifying(k);
	const { primary, components } = boThu(k);

	const arr = components.map((c) => `"${c.char}"`).join(', ');
	const primaryLabel = primary ? `${primary.char}[${primary.hanViet ?? '?'}]` : '(no bộ)';
	const compLabels = components
		.map((c) => `${c.char}=${componentLabel(c) ?? '???UNRESOLVED'}`)
		.join('  ');

	const dropped = droppedRawParts(k, primaryInfo?.radical ?? null);
	const droppedAnn = dropped
		.map((d) => {
			const r = resolveComponent(d, false);
			return r.source === 'none' ? d : `${d}(${componentLabel(r)})`;
		})
		.join(' ');

	console.log(
		`\t"${k}": [${arr}],` +
			`\t// ${level} bộ=${primaryLabel} | ${compLabels || '(none)'}` +
			(dropped.length ? ` | dropped: ${droppedAnn}` : '')
	);
}
