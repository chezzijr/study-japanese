<script lang="ts">
	/**
	 * Stats Overview Component
	 *
	 * Displays flashcard statistics summary including retention rate,
	 * streak, card counts by status, and a simple forecast.
	 */

	import type { DeckStats } from '$lib/flashcard';

	let {
		stats,
		showForecast = false,
		forecastData = []
	}: {
		stats: DeckStats;
		showForecast?: boolean;
		forecastData?: { date: string; count: number }[];
	} = $props();

	// Format date for display
	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		if (dateStr === today.toISOString().split('T')[0]) {
			return 'Hôm nay';
		}
		if (dateStr === tomorrow.toISOString().split('T')[0]) {
			return 'Ngày mai';
		}

		return date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' });
	}

	// Get max count for chart scaling
	const maxForecastCount = $derived(
		forecastData.length > 0 ? Math.max(...forecastData.map((d) => d.count), 1) : 1
	);
</script>

<div class="space-y-6">
	<!-- Main Stats Grid -->
	<div class="stats stats-vertical w-full bg-base-200 shadow md:stats-horizontal">
		<!-- Retention Rate -->
		<div class="stat">
			<div class="stat-figure text-success">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="inline-block h-8 w-8 stroke-current"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<div class="stat-title">Tỷ lệ nhớ</div>
			<div class="stat-value text-success">{stats.retentionRate}%</div>
			<div class="stat-desc">30 ngày qua</div>
		</div>

		<!-- Streak -->
		<div class="stat">
			<div class="stat-figure text-warning">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="inline-block h-8 w-8 stroke-current"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
					/>
				</svg>
			</div>
			<div class="stat-title">Streak</div>
			<div class="stat-value text-warning">{stats.currentStreak}</div>
			<div class="stat-desc">Kỷ lục: {stats.longestStreak} ngày</div>
		</div>

		<!-- Due Today -->
		<div class="stat">
			<div class="stat-figure text-primary">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="inline-block h-8 w-8 stroke-current"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
			</div>
			<div class="stat-title">Cần ôn hôm nay</div>
			<div class="stat-value text-primary">{stats.dueToday}</div>
			<div class="stat-desc">Ngày mai: {stats.dueTomorrow}</div>
		</div>
	</div>

	<!-- Card Status Breakdown -->
	<div class="card bg-base-200">
		<div class="card-body">
			<h3 class="card-title text-base">Phân loại thẻ</h3>
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div class="rounded-lg bg-base-100 p-3 text-center">
					<div class="text-2xl font-bold text-info">{stats.newCards}</div>
					<div class="text-sm text-base-content/60">Mới</div>
				</div>
				<div class="rounded-lg bg-base-100 p-3 text-center">
					<div class="text-2xl font-bold text-warning">{stats.learningCards}</div>
					<div class="text-sm text-base-content/60">Đang học</div>
				</div>
				<div class="rounded-lg bg-base-100 p-3 text-center">
					<div class="text-2xl font-bold text-success">{stats.reviewCards}</div>
					<div class="text-sm text-base-content/60">Ôn tập</div>
				</div>
				<div class="rounded-lg bg-base-100 p-3 text-center">
					<div class="text-2xl font-bold text-base-content/40">{stats.suspendedCards}</div>
					<div class="text-sm text-base-content/60">Tạm dừng</div>
				</div>
			</div>
			<div class="mt-4">
				<div class="mb-2 text-sm text-base-content/60">Tổng: {stats.totalCards} thẻ</div>
				{#if stats.totalCards > 0}
					<progress
						class="progress w-full"
						value={stats.totalCards - stats.newCards - stats.suspendedCards}
						max={stats.totalCards}
					></progress>
					<div class="mt-1 text-xs text-base-content/50">
						{Math.round(
							((stats.totalCards - stats.newCards - stats.suspendedCards) / stats.totalCards) * 100
						)}% đã học ít nhất 1 lần
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Ease Factor -->
	<div class="card bg-base-200">
		<div class="card-body">
			<h3 class="card-title text-base">Độ khó trung bình</h3>
			<div class="flex items-center gap-4">
				<div
					class="radial-progress text-primary"
					style="--value:{Math.min(100, (stats.averageEaseFactor / 4) * 100)}; --size:4rem;"
				>
					{stats.averageEaseFactor}
				</div>
				<div class="text-sm text-base-content/60">
					<p>Ease Factor: {stats.averageEaseFactor}</p>
					<p class="mt-1 text-xs">
						{#if stats.averageEaseFactor >= 2.5}
							Bạn đang nhớ tốt!
						{:else if stats.averageEaseFactor >= 2.0}
							Cần ôn tập thường xuyên hơn
						{:else}
							Có vẻ khá khó với bạn
						{/if}
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Forecast Chart -->
	{#if showForecast && forecastData.length > 0}
		<div class="card bg-base-200">
			<div class="card-body">
				<h3 class="card-title text-base">Dự báo ôn tập</h3>
				<div class="flex h-32 items-end gap-1">
					{#each forecastData as day}
						<div
							class="flex flex-1 flex-col items-center justify-end"
							title="{formatDate(day.date)}: {day.count} thẻ"
						>
							<div
								class="hover:bg-primary-focus w-full rounded-t bg-primary transition-all"
								style="height: {(day.count / maxForecastCount) * 100}%; min-height: {day.count > 0
									? '4px'
									: '0'}"
							></div>
							<div class="mt-1 w-full truncate text-center text-xs text-base-content/50">
								{formatDate(day.date).split(' ')[0]}
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-2 text-center text-xs text-base-content/50">
					Số thẻ cần ôn trong 7 ngày tới
				</div>
			</div>
		</div>
	{/if}
</div>
