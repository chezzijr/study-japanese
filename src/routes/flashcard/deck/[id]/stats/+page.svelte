<script lang="ts">
	/**
	 * Deck Statistics Page
	 *
	 * Comprehensive statistics view for a specific deck.
	 */

	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import StatsOverview from '$lib/components/flashcard/stats-overview.svelte';
	import {
		getDeck,
		getCardsByDeck,
		getReviewsByDateRange,
		getDailyStatsRange,
		calculateDeckStats,
		forecastReviews,
		aggregateDailyStats,
		formatStudyTime,
		getDateString,
		getMatureCardCount,
		getYoungCardCount,
		type Deck,
		type DeckStats
	} from '$lib/flashcard';

	let { data } = $props();

	// State
	let loading = $state(true);
	let error = $state<string | null>(null);
	let deck = $state<Deck | null>(null);
	let stats = $state<DeckStats | null>(null);
	let forecastData = $state<{ date: string; count: number }[]>([]);
	let aggregatedStats = $state<ReturnType<typeof aggregateDailyStats> | null>(null);
	let matureCount = $state(0);
	let youngCount = $state(0);

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		try {
			loading = true;
			error = null;

			const loadedDeck = await getDeck(data.deckId);
			if (!loadedDeck) {
				error = 'Không tìm thấy bộ thẻ.';
				return;
			}

			deck = loadedDeck;

			// Load cards and reviews
			const cards = await getCardsByDeck(data.deckId);
			const now = Date.now();
			const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
			const reviews = await getReviewsByDateRange(data.deckId, thirtyDaysAgo, now);

			// Calculate stats
			stats = calculateDeckStats(cards, reviews);

			// Calculate mature/young counts
			matureCount = getMatureCardCount(cards);
			youngCount = getYoungCardCount(cards);

			// Generate forecast
			const forecast = forecastReviews(cards, 7);
			forecastData = Array.from(forecast.entries()).map(([date, count]) => ({
				date,
				count
			}));

			// Load daily stats for the past 30 days
			const today = getDateString();
			const startDate = getDateString(thirtyDaysAgo);
			const dailyStats = await getDailyStatsRange(startDate, today, data.deckId);
			aggregatedStats = aggregateDailyStats(dailyStats);
		} catch (e) {
			console.error('Failed to load statistics:', e);
			error = 'Không thể tải thống kê.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Thống kê - {deck?.name ?? 'Flashcard'}</title>
</svelte:head>

{#if loading}
	<main class="flex h-screen items-center justify-center">
		<span class="loading loading-spinner loading-lg"></span>
	</main>
{:else if error}
	<main class="flex h-screen flex-col items-center justify-center gap-4">
		<div class="alert alert-error max-w-md">
			<span>{error}</span>
		</div>
		<a href="{base}/flashcard" class="btn btn-ghost">Quay lại</a>
	</main>
{:else if deck && stats}
	<main class="min-h-screen p-4 md:p-6">
		<!-- Header -->
		<header class="mb-6">
			<div class="mb-2 flex items-center gap-2 text-sm text-base-content/60">
				<a href="{base}/flashcard" class="hover:text-base-content">Flashcard</a>
				<span>/</span>
				<a href="{base}/flashcard/deck/{deck.id}" class="hover:text-base-content">{deck.name}</a>
				<span>/</span>
				<span>Thống kê</span>
			</div>
			<h1 class="text-2xl font-bold md:text-3xl">Thống kê: {deck.name}</h1>
			{#if deck.description}
				<p class="mt-1 text-base-content/60">{deck.description}</p>
			{/if}
		</header>

		<!-- Stats Overview Component -->
		<StatsOverview {stats} showForecast={true} {forecastData} />

		<!-- Additional Statistics -->
		<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Card Maturity -->
			<div class="card bg-base-200">
				<div class="card-body">
					<h3 class="card-title text-base">Độ chín của thẻ</h3>
					<div class="space-y-4">
						<div>
							<div class="mb-1 flex justify-between text-sm">
								<span>Thẻ trưởng thành (21+ ngày)</span>
								<span class="font-medium">{matureCount}</span>
							</div>
							<progress
								class="progress progress-success"
								value={matureCount}
								max={stats.totalCards || 1}
							></progress>
						</div>
						<div>
							<div class="mb-1 flex justify-between text-sm">
								<span>Thẻ non (1-20 ngày)</span>
								<span class="font-medium">{youngCount}</span>
							</div>
							<progress
								class="progress progress-warning"
								value={youngCount}
								max={stats.totalCards || 1}
							></progress>
						</div>
						<div>
							<div class="mb-1 flex justify-between text-sm">
								<span>Thẻ mới (chưa học)</span>
								<span class="font-medium">{stats.newCards}</span>
							</div>
							<progress
								class="progress progress-info"
								value={stats.newCards}
								max={stats.totalCards || 1}
							></progress>
						</div>
					</div>
				</div>
			</div>

			<!-- Study Summary (30 days) -->
			{#if aggregatedStats}
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-base">Tổng kết 30 ngày</h3>
						<div class="grid grid-cols-2 gap-4">
							<div class="rounded-lg bg-base-100 p-3 text-center">
								<div class="text-2xl font-bold text-primary">{aggregatedStats.totalReviewed}</div>
								<div class="text-sm text-base-content/60">Lần ôn</div>
							</div>
							<div class="rounded-lg bg-base-100 p-3 text-center">
								<div class="text-2xl font-bold text-success">{aggregatedStats.totalNewLearned}</div>
								<div class="text-sm text-base-content/60">Thẻ mới</div>
							</div>
							<div class="rounded-lg bg-base-100 p-3 text-center">
								<div class="text-2xl font-bold text-info">{aggregatedStats.averagePerDay}</div>
								<div class="text-sm text-base-content/60">TB/ngày</div>
							</div>
							<div class="rounded-lg bg-base-100 p-3 text-center">
								<div class="text-2xl font-bold text-warning">
									{formatStudyTime(aggregatedStats.totalStudyTimeMs)}
								</div>
								<div class="text-sm text-base-content/60">Thời gian</div>
							</div>
						</div>
						{#if aggregatedStats.totalReviewed > 0}
							<div class="mt-4">
								<div class="text-sm text-base-content/60">Tỷ lệ đúng</div>
								<progress
									class="progress progress-success"
									value={aggregatedStats.totalCorrect}
									max={aggregatedStats.totalReviewed}
								></progress>
								<div class="mt-1 text-xs text-base-content/50">
									{Math.round(
										(aggregatedStats.totalCorrect / aggregatedStats.totalReviewed) * 100
									)}% ({aggregatedStats.totalCorrect}/{aggregatedStats.totalReviewed})
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Actions -->
		<div class="mt-8 flex justify-center gap-4">
			<a href="{base}/flashcard/deck/{deck.id}" class="btn btn-ghost"> Quay lại </a>
			{#if stats.dueToday > 0}
				<a href="{base}/flashcard/deck/{deck.id}/review" class="btn btn-primary">
					Ôn tập ngay ({stats.dueToday})
				</a>
			{/if}
		</div>
	</main>
{/if}
