import { describe, it, expect } from 'vitest';
import { boThu, mnemonic } from './radicals';

describe('chiết tự (N4, from n4.json chietTu field)', () => {
	it('badges the classifying bộ as primary and lists the chietTu components', () => {
		const { primary, components } = boThu('会');
		expect(primary?.canonical).toBe('人'); // classifying radical NHÂN
		expect(primary?.char).toBe('𠆢'); // shown in its in-kanji form per chietTu
		expect(primary?.isPrimary).toBe(true);
		const chars = components.map((c) => c.char);
		expect(chars).toContain('一');
		expect(chars).toContain('厶');
		expect(chars).not.toContain('𠆢'); // primary is not duplicated in components
	});

	it('uses the chietTu meanings (authoritative) on components', () => {
		const { components } = boThu('会');
		const mot = components.find((c) => c.char === '一');
		expect(mot?.meaning).toBe('một');
	});

	it('exposes the mnemonic for an N4 kanji', () => {
		expect(mnemonic('会')).toContain('để mở **hội**');
	});

	it('does not inject a primary badge when the kanji is itself the radical (谷)', () => {
		// 谷's classifying radical is 谷 (the kanji itself); tmp lists only 八/人/口.
		const { primary, components } = boThu('谷');
		expect(primary).toBeNull();
		expect(components.map((c) => c.char)).toEqual(['八', '人', '口']);
	});
});

describe('chiết tự (N5, from n5.json chietTu field)', () => {
	it('resolves a breakdown and mnemonic for an N5 kanji', () => {
		const { primary } = boThu('一');
		expect(primary?.canonical).toBe('一');
		expect(mnemonic('一')).toContain('**một**');
	});
});

describe('chiết tự (uncovered kanji)', () => {
	it('returns no breakdown and no mnemonic for a non-app kanji', () => {
		const { primary, components } = boThu('龍'); // not in n1..n5
		expect(primary).toBeNull();
		expect(components).toHaveLength(0);
		expect(mnemonic('龍')).toBeNull();
	});
});
