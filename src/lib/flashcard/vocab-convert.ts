/**
 * Vocabulary/Kanji to Flashcard Conversion
 *
 * Converts existing vocabulary and kanji data to flashcard format
 */

import type { WordDefinition } from '$lib/types/vocab';
import type { Flashcard, CardSource } from './types';
import { DEFAULT_SM2_STATE } from './types';
import { generateId } from './db';

/**
 * Kanji data structure from n5.json, n4.json, etc.
 */
export interface KanjiData {
	word: string;
	meaning: string;
	kunyomi: string[];
	onyomi: string[];
	radicals?: string;
}

/**
 * Convert a vocabulary word to flashcard
 *
 * Front: Japanese word (with reading)
 * Back: Vietnamese meaning
 */
export function vocabToFlashcard(
	word: WordDefinition,
	deckId: string,
	level: string,
	unit: string
): Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt' | 'status'> {
	const source: CardSource = {
		type: 'vocab',
		level,
		unit,
		word: word.word
	};

	// Combine type and note into notes for flashcard display
	const noteParts: string[] = [];
	if (word.type) noteParts.push(word.type);
	if (word.note) noteParts.push(word.note);
	const notes = noteParts.length > 0 ? noteParts.join(' | ') : undefined;

	return {
		deckId,
		front: word.word,
		back: word.meaning,
		frontReading: word.reading,
		notes,
		tags: [level, unit],
		source,
		state: { ...DEFAULT_SM2_STATE, dueDate: Date.now() }
	};
}

/**
 * Convert kanji data to flashcard
 *
 * Front: Kanji character
 * Back: Meaning with readings
 */
export function kanjiToFlashcard(
	kanji: KanjiData,
	deckId: string,
	level: string
): Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt' | 'status'> {
	const source: CardSource = {
		type: 'kanji',
		level,
		kanji: kanji.word
	};

	// Format back content with all kanji info
	const backParts: string[] = [];

	// Main meaning in Vietnamese (Âm Hán Việt)
	backParts.push(kanji.meaning);

	// Add readings
	if (kanji.onyomi.length > 0) {
		backParts.push(`Onyomi: ${kanji.onyomi.join(', ')}`);
	}
	if (kanji.kunyomi.length > 0) {
		backParts.push(`Kunyomi: ${kanji.kunyomi.join(', ')}`);
	}

	const back = backParts.join('\n');

	// Notes with radicals
	const notes = kanji.radicals ? `Bộ thủ: ${kanji.radicals}` : undefined;

	return {
		deckId,
		front: kanji.word,
		back,
		notes,
		tags: [level, 'kanji'],
		source,
		state: { ...DEFAULT_SM2_STATE, dueDate: Date.now() }
	};
}

/**
 * Batch convert vocabulary list to flashcards
 */
export function vocabListToFlashcards(
	words: WordDefinition[],
	deckId: string,
	level: string,
	unit: string
): Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt' | 'status'>[] {
	return words.map((word) => vocabToFlashcard(word, deckId, level, unit));
}

/**
 * Batch convert kanji list to flashcards
 */
export function kanjiListToFlashcards(
	kanjiList: KanjiData[],
	deckId: string,
	level: string
): Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt' | 'status'>[] {
	return kanjiList.map((kanji) => kanjiToFlashcard(kanji, deckId, level));
}

/**
 * Create a custom flashcard (user-created)
 */
export function createCustomFlashcard(
	front: string,
	back: string,
	deckId: string,
	options?: {
		frontReading?: string;
		backReading?: string;
		notes?: string;
		tags?: string[];
	}
): Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt' | 'status'> {
	return {
		deckId,
		front,
		back,
		frontReading: options?.frontReading,
		backReading: options?.backReading,
		notes: options?.notes,
		tags: options?.tags ?? [],
		source: { type: 'custom' },
		state: { ...DEFAULT_SM2_STATE, dueDate: Date.now() }
	};
}

/**
 * Check if a vocab word already exists as a card in a deck
 */
export function isVocabAlreadyInDeck(
	cards: Flashcard[],
	word: WordDefinition,
	level: string,
	unit: string
): boolean {
	return cards.some((card) => {
		if (card.source.type !== 'vocab') return false;
		const vocabSource = card.source as { type: 'vocab'; level: string; unit: string; word: string };
		return (
			vocabSource.level === level && vocabSource.unit === unit && vocabSource.word === word.word
		);
	});
}

/**
 * Check if a kanji already exists as a card in a deck
 */
export function isKanjiAlreadyInDeck(cards: Flashcard[], kanji: KanjiData, level: string): boolean {
	return cards.some((card) => {
		if (card.source.type !== 'kanji') return false;
		const kanjiSource = card.source as { type: 'kanji'; level: string; kanji: string };
		return kanjiSource.level === level && kanjiSource.kanji === kanji.word;
	});
}

/**
 * Filter out vocab words that are already in the deck
 */
export function filterNewVocab(
	words: WordDefinition[],
	existingCards: Flashcard[],
	level: string,
	unit: string
): WordDefinition[] {
	return words.filter((word) => !isVocabAlreadyInDeck(existingCards, word, level, unit));
}

/**
 * Filter out kanji that are already in the deck
 */
export function filterNewKanji(
	kanjiList: KanjiData[],
	existingCards: Flashcard[],
	level: string
): KanjiData[] {
	return kanjiList.filter((kanji) => !isKanjiAlreadyInDeck(existingCards, kanji, level));
}

/**
 * Get suggested deck name for a vocab unit
 */
export function suggestVocabDeckName(level: string, unit: string): string {
	const levelUpper = level.toUpperCase();
	if (unit === 'all') {
		return `${levelUpper} - Tất cả từ vựng`;
	}
	return `${levelUpper} - Unit ${unit.replace('u', '')}`;
}

/**
 * Get suggested deck name for kanji
 */
export function suggestKanjiDeckName(level: string): string {
	return `${level.toUpperCase()} - Kanji`;
}
