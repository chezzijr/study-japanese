/**
 * Import/Export functionality for flashcard data
 */

import type { Flashcard, Deck, ReviewLog, ExportData } from './types';
import { EXPORT_VERSION, DEFAULT_SM2_STATE, DEFAULT_DECK_SETTINGS } from './types';
import { generateId } from './db';
import { determineCardStatus } from './sm2';

/**
 * Export a deck with all its data
 */
export function exportDeck(
	deck: Deck,
	cards: Flashcard[],
	reviews?: ReviewLog[]
): ExportData {
	return {
		version: EXPORT_VERSION,
		exportedAt: Date.now(),
		deck,
		cards,
		reviews
	};
}

/**
 * Export to JSON string
 */
export function exportToJSON(data: ExportData, pretty: boolean = true): string {
	return JSON.stringify(data, null, pretty ? 2 : 0);
}

/**
 * Download export as file
 */
export function downloadExport(data: ExportData, filename?: string): void {
	const json = exportToJSON(data);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = filename ?? `flashcard-${data.deck.name}-${Date.now()}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Validation result type
 */
export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	data?: ExportData;
}

/**
 * Validate import data structure
 */
export function validateImportData(data: unknown): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (typeof data !== 'object' || data === null) {
		return { valid: false, errors: ['Invalid JSON structure'], warnings };
	}

	const obj = data as Record<string, unknown>;

	// Check version
	if (!obj.version) {
		errors.push('Missing version field');
	} else if (typeof obj.version !== 'string') {
		errors.push('Invalid version field');
	}

	// Check deck
	if (!obj.deck) {
		errors.push('Missing deck field');
	} else {
		const deck = obj.deck as Record<string, unknown>;
		if (!deck.name || typeof deck.name !== 'string') {
			errors.push('Deck must have a name');
		}
	}

	// Check cards
	if (!Array.isArray(obj.cards)) {
		errors.push('Cards must be an array');
	} else {
		(obj.cards as Array<Record<string, unknown>>).forEach((card, i) => {
			if (!card.front || typeof card.front !== 'string') {
				errors.push(`Card ${i + 1}: missing or invalid front`);
			}
			if (!card.back || typeof card.back !== 'string') {
				errors.push(`Card ${i + 1}: missing or invalid back`);
			}
		});
	}

	// Check reviews (optional)
	if (obj.reviews !== undefined && !Array.isArray(obj.reviews)) {
		warnings.push('Reviews field is not an array, will be ignored');
	}

	return errors.length > 0
		? { valid: false, errors, warnings }
		: { valid: true, errors: [], warnings, data: obj as unknown as ExportData };
}

/**
 * Import options
 */
export interface ImportOptions {
	deckNameConflict: 'skip' | 'rename' | 'replace';
	cardDuplicateStrategy: 'skip' | 'replace' | 'keep-both';
	includeReviews: boolean;
	targetDeckId?: string; // Import into existing deck
}

/**
 * Import result
 */
export interface ImportResult {
	success: boolean;
	deck?: Deck;
	cardsImported: number;
	cardsSkipped: number;
	reviewsImported: number;
	errors: string[];
	warnings: string[];
}

/**
 * Prepare cards from import data
 */
export function prepareImportCards(
	data: ExportData,
	targetDeckId: string,
	existingCards: Flashcard[],
	options: ImportOptions
): { cards: Flashcard[]; skipped: number } {
	const now = Date.now();
	const prepared: Flashcard[] = [];
	let skipped = 0;

	for (const importCard of data.cards) {
		// Check for duplicates by front+back content
		const duplicate = existingCards.find(
			(c) => c.front === importCard.front && c.back === importCard.back
		);

		if (duplicate) {
			switch (options.cardDuplicateStrategy) {
				case 'skip':
					skipped++;
					continue;
				case 'replace':
					// Will replace in storage layer
					prepared.push({
						...importCard,
						id: duplicate.id,
						deckId: targetDeckId,
						updatedAt: now
					});
					continue;
				case 'keep-both':
					// Fall through to add new card
					break;
			}
		}

		// Prepare new card
		const card: Flashcard = {
			id: generateId(),
			deckId: targetDeckId,
			front: importCard.front,
			back: importCard.back,
			frontReading: importCard.frontReading,
			backReading: importCard.backReading,
			notes: importCard.notes,
			tags: importCard.tags ?? [],
			source: { type: 'imported' },
			state: importCard.state ?? { ...DEFAULT_SM2_STATE, dueDate: now },
			status: importCard.state ? determineCardStatus(importCard.state) : 'new',
			createdAt: importCard.createdAt ?? now,
			updatedAt: now
		};

		prepared.push(card);
	}

	return { cards: prepared, skipped };
}

/**
 * Prepare deck from import data
 */
export function prepareImportDeck(
	data: ExportData,
	existingDecks: Deck[],
	options: ImportOptions
): { deck: Deck | null; action: 'create' | 'skip' | 'replace' } {
	const now = Date.now();
	const importDeck = data.deck;

	// Check for name conflict
	const existing = existingDecks.find(
		(d) => d.name.toLowerCase() === importDeck.name.toLowerCase()
	);

	if (existing) {
		switch (options.deckNameConflict) {
			case 'skip':
				return { deck: null, action: 'skip' };
			case 'replace':
				return {
					deck: {
						...importDeck,
						id: existing.id,
						settings: importDeck.settings ?? DEFAULT_DECK_SETTINGS,
						updatedAt: now
					},
					action: 'replace'
				};
			case 'rename':
				// Add suffix to make unique
				let newName = importDeck.name;
				let suffix = 1;
				while (existingDecks.some((d) => d.name.toLowerCase() === newName.toLowerCase())) {
					newName = `${importDeck.name} (${suffix})`;
					suffix++;
				}
				return {
					deck: {
						id: generateId(),
						name: newName,
						description: importDeck.description,
						settings: importDeck.settings ?? DEFAULT_DECK_SETTINGS,
						createdAt: now,
						updatedAt: now
					},
					action: 'create'
				};
		}
	}

	// No conflict, create new deck
	return {
		deck: {
			id: generateId(),
			name: importDeck.name,
			description: importDeck.description,
			settings: importDeck.settings ?? DEFAULT_DECK_SETTINGS,
			createdAt: now,
			updatedAt: now
		},
		action: 'create'
	};
}

/**
 * Parse JSON string to import data
 */
export function parseImportJSON(jsonString: string): { data?: ExportData; error?: string } {
	try {
		const parsed = JSON.parse(jsonString);
		const validation = validateImportData(parsed);

		if (!validation.valid) {
			return { error: validation.errors.join('; ') };
		}

		return { data: validation.data };
	} catch (e) {
		return { error: 'Invalid JSON format' };
	}
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsText(file);
	});
}

/**
 * Export to CSV format (cards only, for spreadsheet compatibility)
 */
export function exportToCSV(cards: Flashcard[]): string {
	const headers = ['front', 'back', 'notes', 'tags'];
	const rows = cards.map((card) => [
		escapeCSV(card.front),
		escapeCSV(card.back),
		escapeCSV(card.notes ?? ''),
		escapeCSV(card.tags.join(', '))
	]);

	return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Escape CSV field
 */
function escapeCSV(field: string): string {
	if (field.includes(',') || field.includes('"') || field.includes('\n')) {
		return `"${field.replace(/"/g, '""')}"`;
	}
	return field;
}

/**
 * Download CSV file
 */
export function downloadCSV(cards: Flashcard[], filename: string): void {
	const csv = exportToCSV(cards);
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
