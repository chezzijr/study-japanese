/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Based on: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 *
 * Core formulas:
 * - EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 * - EF minimum = 1.3
 * - If q < 3: reset repetitions to 0, interval = 1
 * - Intervals: rep 1 = 1 day, rep 2 = 6 days, rep n = interval * EF
 */

import { Rating, type SM2State, type CardStatus, DEFAULT_SM2_STATE } from './types';

// Algorithm configuration constants
const MIN_EASE_FACTOR = 1.3;
const EASY_BONUS = 1.3; // Multiplier for Easy rating
const HARD_MULTIPLIER = 1.2; // Multiplier for Hard rating
const LAPSE_INTERVAL = 1; // Days after Again
const GRADUATING_INTERVAL = 1; // First interval after learning
const EASY_INTERVAL = 4; // First interval if Easy on new card

/**
 * Map 4-button rating to SM-2 quality (0-5 scale)
 */
function ratingToQuality(rating: Rating): number {
	switch (rating) {
		case Rating.Again:
			return 0;
		case Rating.Hard:
			return 2;
		case Rating.Good:
			return 3;
		case Rating.Easy:
			return 5;
	}
}

/**
 * Calculate new ease factor using SM-2 formula
 * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 */
function calculateNewEaseFactor(currentEF: number, quality: number): number {
	const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
	return Math.max(MIN_EASE_FACTOR, currentEF + delta);
}

/**
 * Calculate the next SM-2 state based on current state and rating
 * This is the core scheduling algorithm
 */
export function calculateNextState(currentState: SM2State, rating: Rating, now?: number): SM2State {
	const timestamp = now ?? Date.now();
	const quality = ratingToQuality(rating);

	let newEaseFactor = calculateNewEaseFactor(currentState.easeFactor, quality);
	let newInterval: number;
	let newRepetitions: number;

	if (rating === Rating.Again) {
		// Lapse: reset progress completely
		newRepetitions = 0;
		newInterval = LAPSE_INTERVAL;
		// Additional penalty beyond standard formula
		newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor - 0.2);
	} else if (rating === Rating.Hard) {
		// Hard: slower progression, don't reset
		if (currentState.repetitions === 0) {
			newInterval = GRADUATING_INTERVAL;
		} else {
			// Increase interval but less than Good
			newInterval = Math.max(1, Math.round(currentState.interval * HARD_MULTIPLIER));
		}
		newRepetitions = currentState.repetitions + 1;
	} else if (rating === Rating.Good) {
		// Good: standard SM-2 progression
		if (currentState.repetitions === 0) {
			newInterval = GRADUATING_INTERVAL;
		} else if (currentState.repetitions === 1) {
			newInterval = 6;
		} else {
			newInterval = Math.round(currentState.interval * newEaseFactor);
		}
		newRepetitions = currentState.repetitions + 1;
	} else {
		// Easy: accelerated progression
		if (currentState.repetitions === 0) {
			newInterval = EASY_INTERVAL;
		} else {
			newInterval = Math.round(currentState.interval * newEaseFactor * EASY_BONUS);
		}
		newRepetitions = currentState.repetitions + 1;
	}

	// Calculate next due date
	const msPerDay = 24 * 60 * 60 * 1000;
	const dueDate = timestamp + newInterval * msPerDay;

	return {
		easeFactor: newEaseFactor,
		interval: newInterval,
		repetitions: newRepetitions,
		dueDate,
		lastReviewDate: timestamp
	};
}

/**
 * Check if a card is due for review
 */
export function isDue(state: SM2State, now?: number): boolean {
	const timestamp = now ?? Date.now();
	return state.dueDate <= timestamp;
}

/**
 * Check if a card is new (never reviewed)
 */
export function isNew(state: SM2State): boolean {
	return state.repetitions === 0 && state.lastReviewDate === 0;
}

/**
 * Calculate days overdue (negative if not yet due)
 */
export function daysOverdue(state: SM2State, now?: number): number {
	const timestamp = now ?? Date.now();
	const msPerDay = 24 * 60 * 60 * 1000;
	return Math.floor((timestamp - state.dueDate) / msPerDay);
}

/**
 * Determine card status based on scheduling state
 */
export function determineCardStatus(state: SM2State): CardStatus {
	if (state.lastReviewDate === 0) {
		return 'new';
	}

	if (state.repetitions < 2 || state.interval < 1) {
		return 'learning';
	}

	return 'review';
}

/**
 * Preview next intervals for all ratings (for UI display)
 */
export function previewIntervals(state: SM2State): Record<Rating, number> {
	return {
		[Rating.Again]: calculateNextState(state, Rating.Again).interval,
		[Rating.Hard]: calculateNextState(state, Rating.Hard).interval,
		[Rating.Good]: calculateNextState(state, Rating.Good).interval,
		[Rating.Easy]: calculateNextState(state, Rating.Easy).interval
	};
}

/**
 * Format interval for human-readable display
 */
export function formatInterval(days: number): string {
	if (days < 1) return '< 1 ngày';
	if (days === 1) return '1 ngày';
	if (days < 7) return `${days} ngày`;
	if (days < 30) {
		const weeks = Math.round(days / 7);
		return weeks === 1 ? '1 tuần' : `${weeks} tuần`;
	}
	if (days < 365) {
		const months = Math.round(days / 30);
		return months === 1 ? '1 tháng' : `${months} tháng`;
	}
	const years = (days / 365).toFixed(1);
	return `${years} năm`;
}

/**
 * Create initial SM2 state for a new card
 */
export function createInitialState(): SM2State {
	return {
		...DEFAULT_SM2_STATE,
		dueDate: Date.now()
	};
}
