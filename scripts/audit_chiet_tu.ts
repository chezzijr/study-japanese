/**
 * Read-only audit of the chiết-tự decomposition for every app kanji.
 *
 * Reports, across all kanji:
 *   MISSING-OVERRIDE  kanji with no explicit decomposition-overrides.json entry
 *   UNRESOLVED        a shown component that resolves to no label at all (hard error)
 *   LABEL-LESS        a component resolved only via the app-kanji fallback (meaning = null)
 *
 * Exits non-zero if any UNRESOLVED or MISSING-OVERRIDE remain, so it can gate the work.
 *
 * Usage:
 *   pnpm audit-chiet-tu            full report
 *   pnpm audit-chiet-tu -- --dump  also print every kanji's primary + components
 */

import { allKanji, boThu, componentLabel, hasOverride } from './chiet_tu_lib';

const dump = process.argv.includes('--dump');
const kanji = allKanji();

const missingOverride: string[] = [];
const unresolved: { kanji: string; char: string }[] = [];
const labelLess: { kanji: string; char: string }[] = [];

for (const { kanji: k } of kanji) {
	if (!hasOverride(k)) missingOverride.push(k);
	const { primary, components } = boThu(k);
	for (const c of components) {
		if (c.source === 'none') unresolved.push({ kanji: k, char: c.char });
		else if (c.source === 'kanji') labelLess.push({ kanji: k, char: c.char });
	}
	if (dump) {
		const p = primary ? `${primary.char}[${primary.hanViet ?? '?'}]` : '—';
		const cs = components.map((c) => `${c.char}[${componentLabel(c) ?? '???'}]`).join('  ');
		console.log(`${k}  ${p}  | ${cs}`);
	}
}

if (dump) console.log('\n' + '─'.repeat(60));

console.log(`\nKanji audited:       ${kanji.length}`);
console.log(`With override:       ${kanji.length - missingOverride.length}/${kanji.length}`);
console.log(`MISSING-OVERRIDE:    ${missingOverride.length}`);
console.log(`UNRESOLVED:          ${unresolved.length}`);
console.log(`LABEL-LESS (kanji):  ${labelLess.length}`);

if (missingOverride.length) console.log(`\nMISSING-OVERRIDE:\n  ${missingOverride.join(' ')}`);
if (unresolved.length)
	console.log(
		`\nUNRESOLVED (need a phonetics.json entry or different component):\n` +
			unresolved.map((u) => `  ${u.kanji} → ${u.char}`).join('\n')
	);
if (labelLess.length)
	console.log(
		`\nLABEL-LESS (resolves via app-kanji only, no meaning — add phonetics or accept):\n` +
			labelLess.map((u) => `  ${u.kanji} → ${u.char}`).join('\n')
	);

const fail = missingOverride.length > 0 || unresolved.length > 0;
console.log(
	fail ? '\n✗ FAIL' : '\n✓ PASS — every kanji has an override and every component resolves'
);
process.exit(fail ? 1 : 0);
