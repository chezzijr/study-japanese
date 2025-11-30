<script lang="ts">
	import { base } from "$app/paths";
	import { onMount } from "svelte";
	import { getTotalDueCount, isIndexedDBAvailable } from "$lib/flashcard";

	// Get unit counts for each level
	const n5Units = Object.keys(import.meta.glob('$lib/n5/*.json'));
	const n4Units = Object.keys(import.meta.glob('$lib/n4/*.json'));

	// Flashcard due count (loaded client-side)
	let dueCount = $state<number | null>(null);
	let flashcardAvailable = $state(false);

	onMount(async () => {
		if (isIndexedDBAvailable()) {
			flashcardAvailable = true;
			try {
				dueCount = await getTotalDueCount();
			} catch (e) {
				console.error('Failed to load due count:', e);
			}
		}
	});

	// Extract unit numbers
	const n5UnitNumbers = n5Units.map(f => f.split('/').pop()?.replace('.json', '') ?? '').sort((a, b) => {
		const numA = parseInt(a.replace('u', ''));
		const numB = parseInt(b.replace('u', ''));
		return numA - numB;
	});
	const n4UnitNumbers = n4Units.map(f => f.split('/').pop()?.replace('.json', '') ?? '').sort((a, b) => {
		const numA = parseInt(a.replace('u', ''));
		const numB = parseInt(b.replace('u', ''));
		return numA - numB;
	});
</script>

<svelte:head>
	<title>Study Japanese</title>
</svelte:head>

<main class="min-h-screen p-6 md:p-10">
	<!-- Header -->
	<header class="mb-8">
		<h1 class="text-3xl md:text-4xl font-bold">Quá trình học tiếng Nhật</h1>
		<p class="text-base-content/70 mt-2">Dashboard học tập</p>
	</header>

	<!-- Stats Section -->
	<section class="mb-8">
		<div class="stats stats-vertical md:stats-horizontal shadow w-full">
			<div class="stat">
				<div class="stat-figure text-primary">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
					</svg>
				</div>
				<div class="stat-title">N5</div>
				<div class="stat-value text-primary">{n5Units.length}</div>
				<div class="stat-desc">units</div>
			</div>

			<div class="stat">
				<div class="stat-figure text-secondary">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
					</svg>
				</div>
				<div class="stat-title">N4</div>
				<div class="stat-value text-secondary">{n4Units.length}</div>
				<div class="stat-desc">units</div>
			</div>
		</div>
	</section>

	<!-- Quick Actions - Feature Cards -->
	<section class="mb-8">
		<h2 class="text-xl font-semibold mb-4">Tính năng</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			<!-- Vocabulary Card -->
			<div class="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
				<div class="card-body">
					<h3 class="card-title">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-6 h-6 stroke-current">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
						</svg>
						Từ vựng
					</h3>
					<p class="text-base-content/70">Xem danh sách từ vựng theo level</p>
					<div class="card-actions justify-end mt-2">
						<a href="{base}/vocab/n5/all" class="btn btn-primary btn-sm">N5</a>
						<a href="{base}/vocab/n4/all" class="btn btn-secondary btn-sm">N4</a>
					</div>
				</div>
			</div>

			<!-- Practice Card -->
			<div class="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
				<div class="card-body">
					<h3 class="card-title">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-6 h-6 stroke-current">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
						</svg>
						Luyện tập
					</h3>
					<p class="text-base-content/70">Luyện tập từ vựng với MCQ</p>
					<div class="card-actions justify-end mt-2">
						<a href="{base}/practice/n5/all" class="btn btn-primary btn-sm">N5</a>
						<a href="{base}/practice/n4/all" class="btn btn-secondary btn-sm">N4</a>
					</div>
				</div>
			</div>

			<!-- Kanji Card -->
			<div class="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
				<div class="card-body">
					<h3 class="card-title">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-6 h-6 stroke-current">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
						</svg>
						Kanji
					</h3>
					<p class="text-base-content/70">Luyện tập Hán tự</p>
					<div class="card-actions justify-end mt-2">
						<a href="{base}/practice/kanji/n5" class="btn btn-primary btn-sm">N5</a>
					</div>
				</div>
			</div>

			<!-- Grammar Card -->
			<div class="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
				<div class="card-body">
					<h3 class="card-title">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-6 h-6 stroke-current">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
						</svg>
						Ngữ pháp
					</h3>
					<p class="text-base-content/70">Hướng dẫn ngữ pháp</p>
					<div class="card-actions justify-end mt-2">
						<a href="{base}/grammar/verb" class="btn btn-accent btn-sm">Động từ</a>
					</div>
				</div>
			</div>

			<!-- Verb Practice Card -->
			<div class="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
				<div class="card-body">
					<h3 class="card-title">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-6 h-6 stroke-current">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
						</svg>
						Chia động từ
					</h3>
					<p class="text-base-content/70">Luyện tập chia động từ</p>
					<div class="card-actions justify-end mt-2">
						<a href="{base}/practice/verb" class="btn btn-accent btn-sm">Luyện tập</a>
					</div>
				</div>
			</div>

			<!-- Flashcard Card -->
			<div class="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
				<div class="card-body">
					<h3 class="card-title">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-6 h-6 stroke-current">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
						</svg>
						Flashcard
					</h3>
					<p class="text-base-content/70">Ôn tập với thẻ ghi nhớ (SM-2)</p>
					<div class="card-actions justify-between items-center mt-2">
						{#if flashcardAvailable && dueCount !== null}
							{#if dueCount > 0}
								<span class="badge badge-secondary">{dueCount} thẻ cần ôn</span>
							{:else}
								<span class="badge badge-success">Đã hoàn thành</span>
							{/if}
						{:else}
							<span></span>
						{/if}
						<a href="{base}/flashcard" class="btn btn-info btn-sm">Mở</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Unit Navigation -->
	<section class="mb-8">
		<h2 class="text-xl font-semibold mb-4">Chọn Unit</h2>

		<!-- N5 Units -->
		<div class="collapse collapse-arrow bg-base-200 mb-2">
			<input type="checkbox" checked />
			<div class="collapse-title font-medium">
				N5 - {n5Units.length} units
			</div>
			<div class="collapse-content">
				<div class="flex flex-wrap gap-2 mb-4">
					<span class="text-sm text-base-content/70 w-full mb-1">Từ vựng:</span>
					{#each n5UnitNumbers as unit}
						<a href="{base}/vocab/n5/{unit}" class="btn btn-xs btn-outline">{unit}</a>
					{/each}
					<a href="{base}/vocab/n5/all" class="btn btn-xs btn-primary">all</a>
				</div>
				<div class="flex flex-wrap gap-2">
					<span class="text-sm text-base-content/70 w-full mb-1">Luyện tập:</span>
					{#each n5UnitNumbers as unit}
						<a href="{base}/practice/n5/{unit}" class="btn btn-xs btn-outline">{unit}</a>
					{/each}
					<a href="{base}/practice/n5/all" class="btn btn-xs btn-secondary">all</a>
				</div>
			</div>
		</div>

		<!-- N4 Units -->
		<div class="collapse collapse-arrow bg-base-200">
			<input type="checkbox" />
			<div class="collapse-title font-medium">
				N4 - {n4Units.length} units
			</div>
			<div class="collapse-content">
				<div class="flex flex-wrap gap-2 mb-4">
					<span class="text-sm text-base-content/70 w-full mb-1">Từ vựng:</span>
					{#each n4UnitNumbers as unit}
						<a href="{base}/vocab/n4/{unit}" class="btn btn-xs btn-outline">{unit}</a>
					{/each}
					<a href="{base}/vocab/n4/all" class="btn btn-xs btn-primary">all</a>
				</div>
				<div class="flex flex-wrap gap-2">
					<span class="text-sm text-base-content/70 w-full mb-1">Luyện tập:</span>
					{#each n4UnitNumbers as unit}
						<a href="{base}/practice/n4/{unit}" class="btn btn-xs btn-outline">{unit}</a>
					{/each}
					<a href="{base}/practice/n4/all" class="btn btn-xs btn-secondary">all</a>
				</div>
			</div>
		</div>
	</section>
</main>
