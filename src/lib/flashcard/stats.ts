/**
 * Statistics Calculator
 *
 * Functions for calculating retention rate, streaks, and forecasts
 */

import type { Flashcard, ReviewLog, DeckStats, DailyStats } from './types';
import { Rating } from './types';
import { isDue, isNew } from './sm2';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calculate retention rate over a period
 * Retention = (Good + Easy) / Total reviews
 */
export function calculateRetentionRate(reviews: ReviewLog[], periodDays: number = 30): number {
	const cutoff = Date.now() - periodDays * MS_PER_DAY;
	const recentReviews = reviews.filter((r) => r.reviewedAt >= cutoff);

	if (recentReviews.length === 0) return 0;

	const correct = recentReviews.filter(
		(r) => r.rating === Rating.Good || r.rating === Rating.Easy
	).length;

	return correct / recentReviews.length;
}

/**
 * Calculate daily review streak
 */
export function calculateStreak(
	reviews: ReviewLog[],
	now?: number
): { current: number; longest: number } {
	const timestamp = now ?? Date.now();

	if (reviews.length === 0) return { current: 0, longest: 0 };

	// Get unique days with reviews
	const reviewDays = [
		...new Set(reviews.map((r) => new Date(r.reviewedAt).toISOString().split('T')[0]))
	]
		.sort()
		.reverse();

	if (reviewDays.length === 0) return { current: 0, longest: 0 };

	const today = new Date(timestamp).toISOString().split('T')[0];
	const yesterday = new Date(timestamp - MS_PER_DAY).toISOString().split('T')[0];

	// Current streak must include today or yesterday
	let currentStreak = 0;
	if (reviewDays[0] === today || reviewDays[0] === yesterday) {
		currentStreak = 1;
		const startDate = new Date(reviewDays[0]);

		for (let i = 1; i < reviewDays.length; i++) {
			const expected = new Date(startDate.getTime() - i * MS_PER_DAY)
				.toISOString()
				.split('T')[0];
			if (reviewDays[i] === expected) {
				currentStreak++;
			} else {
				break;
			}
		}
	}

	// Find longest streak
	let longest = 1;
	let temp = 1;
	for (let i = 1; i < reviewDays.length; i++) {
		const prev = new Date(reviewDays[i - 1]);
		const curr = new Date(reviewDays[i]);
		const diff = (prev.getTime() - curr.getTime()) / MS_PER_DAY;

		if (Math.abs(diff - 1) < 0.01) {
			temp++;
		} else {
			longest = Math.max(longest, temp);
			temp = 1;
		}
	}
	longest = Math.max(longest, temp);

	return { current: currentStreak, longest };
}

/**
 * Generate review forecast for next N days
 */
export function forecastReviews(cards: Flashcard[], daysAhead: number = 30): Map<string, number> {
	const forecast = new Map<string, number>();
	const now = Date.now();

	// Initialize all days with 0
	for (let i = 0; i < daysAhead; i++) {
		const date = new Date(now + i * MS_PER_DAY).toISOString().split('T')[0];
		forecast.set(date, 0);
	}

	// Count cards due each day
	for (const card of cards) {
		if (card.status === 'suspended') continue;

		const dueDate = new Date(card.state.dueDate).toISOString().split('T')[0];
		if (forecast.has(dueDate)) {
			forecast.set(dueDate, forecast.get(dueDate)! + 1);
		}
	}

	return forecast;
}

/**
 * Calculate comprehensive deck statistics
 */
export function calculateDeckStats(cards: Flashcard[], reviews: ReviewLog[]): DeckStats {
	const now = Date.now();

	const newCards = cards.filter((c) => c.status === 'new');
	const learningCards = cards.filter((c) => c.status === 'learning');
	const reviewCards = cards.filter((c) => c.status === 'review');
	const suspendedCards = cards.filter((c) => c.status === 'suspended');

	const dueToday = cards.filter(
		(c) => c.status !== 'suspended' && isDue(c.state, now)
	).length;

	const tomorrow = now + MS_PER_DAY;
	const dueTomorrow = cards.filter(
		(c) =>
			c.status !== 'suspended' &&
			c.state.dueDate > now &&
			c.state.dueDate <= tomorrow
	).length;

	// Average ease factor (only for cards with reviews)
	const cardsWithReviews = cards.filter((c) => c.state.lastReviewDate > 0);
	const averageEaseFactor =
		cardsWithReviews.length > 0
			? cardsWithReviews.reduce((sum, c) => sum + c.state.easeFactor, 0) / cardsWithReviews.length
			: 2.5;

	const retentionRate = calculateRetentionRate(reviews, 30);
	const streak = calculateStreak(reviews, now);

	return {
		totalCards: cards.length,
		newCards: newCards.length,
		learningCards: learningCards.length,
		reviewCards: reviewCards.length,
		suspendedCards: suspendedCards.length,
		dueToday,
		dueTomorrow,
		averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
		retentionRate: Math.round(retentionRate * 100),
		currentStreak: streak.current,
		longestStreak: streak.longest
	};
}

/**
 * Aggregate daily stats for a period
 */
export function aggregateDailyStats(stats: DailyStats[]): {
	totalReviewed: number;
	totalNewLearned: number;
	totalCorrect: number;
	totalIncorrect: number;
	totalStudyTimeMs: number;
	averagePerDay: number;
	days: number;
} {
	const totalReviewed = stats.reduce((sum, s) => sum + s.reviewed, 0);
	const totalNewLearned = stats.reduce((sum, s) => sum + s.newLearned, 0);
	const totalCorrect = stats.reduce((sum, s) => sum + s.correct, 0);
	const totalIncorrect = stats.reduce((sum, s) => sum + s.incorrect, 0);
	const totalStudyTimeMs = stats.reduce((sum, s) => sum + s.studyTimeMs, 0);

	const daysWithReviews = stats.filter((s) => s.reviewed > 0).length;
	const averagePerDay = daysWithReviews > 0 ? Math.round(totalReviewed / daysWithReviews) : 0;

	return {
		totalReviewed,
		totalNewLearned,
		totalCorrect,
		totalIncorrect,
		totalStudyTimeMs,
		averagePerDay,
		days: daysWithReviews
	};
}

/**
 * Get date string in YYYY-MM-DD format
 */
export function getDateString(date: Date | number = new Date()): string {
	const d = typeof date === 'number' ? new Date(date) : date;
	return d.toISOString().split('T')[0];
}

/**
 * Generate date range array
 */
export function getDateRange(startDate: string, endDate: string): string[] {
	const dates: string[] = [];
	const current = new Date(startDate);
	const end = new Date(endDate);

	while (current <= end) {
		dates.push(current.toISOString().split('T')[0]);
		current.setDate(current.getDate() + 1);
	}

	return dates;
}

/**
 * Format study time for display
 */
export function formatStudyTime(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m`;
	}
	if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`;
	}
	return `${seconds}s`;
}

/**
 * Calculate mature card count (interval >= 21 days)
 */
export function getMatureCardCount(cards: Flashcard[]): number {
	return cards.filter((c) => c.state.interval >= 21).length;
}

/**
 * Calculate young card count (0 < interval < 21 days)
 */
export function getYoungCardCount(cards: Flashcard[]): number {
	return cards.filter((c) => c.state.interval > 0 && c.state.interval < 21).length;
}
