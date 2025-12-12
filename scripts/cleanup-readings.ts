import * as fs from 'fs';
import * as path from 'path';

// Check if character is hiragana (U+3040-U+309F)
function isHiragana(char: string): boolean {
	const code = char.charCodeAt(0);
	return code >= 0x3040 && code <= 0x309f;
}

// Check if character is katakana (U+30A0-U+30FF)
function isKatakana(char: string): boolean {
	const code = char.charCodeAt(0);
	return code >= 0x30a0 && code <= 0x30ff;
}

// Check if character is kana (hiragana or katakana)
function isKana(char: string): boolean {
	return isHiragana(char) || isKatakana(char);
}

// Check if word is kana-only (ignoring punctuation/symbols)
function isKanaOnly(word: string): boolean {
	for (const char of word) {
		// Skip common punctuation and symbols
		if ('～・ー'.includes(char)) continue;
		// If not kana, return false
		if (!isKana(char)) return false;
	}
	return true;
}

interface WordEntry {
	word: string;
	reading?: string;
	meaning: string;
	note?: string;
}

function processFile(filePath: string): number {
	const content = fs.readFileSync(filePath, 'utf-8');
	const entries: WordEntry[] = JSON.parse(content);
	let count = 0;

	for (const entry of entries) {
		if (entry.reading && isKanaOnly(entry.word)) {
			delete entry.reading;
			count++;
		}
	}

	if (count > 0) {
		fs.writeFileSync(filePath, JSON.stringify(entries, null, '\t') + '\n');
		console.log(`Updated: ${path.basename(filePath)} (${count} entries)`);
	}

	return count;
}

// Process all N4 JSON files
const n4Dir = path.join(import.meta.dirname, '../src/lib/n4');
const files = fs.readdirSync(n4Dir).filter((f) => f.endsWith('.json'));

let total = 0;
for (const file of files) {
	total += processFile(path.join(n4Dir, file));
}

console.log(`\nTotal entries updated: ${total}`);
