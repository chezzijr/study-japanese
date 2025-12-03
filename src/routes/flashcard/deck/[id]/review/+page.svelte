<script lang="ts">
	/**
	 * Review Session Page
	 *
	 * The main flashcard review experience with flip cards and SM-2 rating.
	 */

	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import FlashcardCard from '$lib/components/flashcard/flashcard-card.svelte';
	import RatingButtons from '$lib/components/flashcard/rating-buttons.svelte';
	import {
		getDeck,
		getCardsByDeck,
		recordReview,
		buildSessionQueue,
		getNextCard,
		markCardCompleted,
		getSessionProgress,
		isSessionComplete,
		prepareCardForDisplay,
		Rating,
		type Deck,
		type Flashcard,
		type SessionQueue,
		type CardDirection
	} from '$lib/flashcard';

	let { data } = $props();

	// State
	let loading = $state(true);
	let error = $state<string | null>(null);
	let deck = $state<Deck | null>(null);
	let queue = $state<SessionQueue | null>(null);
	let currentCard = $state<Flashcard | null>(null);
	let displayCard = $state<{
		front: string;
		back: string;
		frontReading?: string;
		backReading?: string;
	} | null>(null);

	// Review state
	let flipped = $state(false);
	let reviewStartTime = $state(0);
	let direction = $state<CardDirection>('viet-to-jp');

	// Session stats
	let sessionStats = $state({
		correct: 0,
		incorrect: 0,
		total: 0
	});

	// Completed state
	let completed = $state(false);

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
			direction = deck.settings.defaultDirection;

			const cards = await getCardsByDeck(data.deckId);
			if (cards.length === 0) {
				error = 'Bộ thẻ không có thẻ nào.';
				return;
			}

			// Build session queue
			queue = buildSessionQueue(cards, {
				maxNewCards: deck.settings.newCardsPerDay,
				maxReviewCards: deck.settings.reviewsPerDay,
				direction,
				randomizeOrder: true
			});

			if (queue.newCards.length === 0 && queue.reviewCards.length === 0) {
				completed = true;
				return;
			}

			// Get first card
			loadNextCard();
		} catch (e) {
			console.error('Failed to load review session:', e);
			error = 'Không thể tải phiên ôn tập.';
		} finally {
			loading = false;
		}
	}

	function loadNextCard() {
		if (!queue) return;

		const next = getNextCard(queue);
		if (!next) {
			completed = true;
			return;
		}

		currentCard = next;
		displayCard = prepareCardForDisplay(next, direction);
		flipped = false;
		reviewStartTime = Date.now();
	}

	function handleFlip() {
		flipped = !flipped;
	}

	async function handleRate(rating: Rating) {
		if (!currentCard || !queue) return;

		try {
			const responseTime = Date.now() - reviewStartTime;

			// Record the review
			await recordReview(currentCard.id, rating, responseTime);

			// Update session stats
			if (rating >= Rating.Good) {
				sessionStats.correct++;
			} else {
				sessionStats.incorrect++;
			}
			sessionStats.total++;

			// Mark card as completed and get next
			queue = markCardCompleted(queue, currentCard.id);

			if (isSessionComplete(queue)) {
				completed = true;
			} else {
				loadNextCard();
			}
		} catch (e) {
			console.error('Failed to record review:', e);
			error = 'Không thể lưu kết quả ôn tập.';
		}
	}

	function handleDirectionChange(e: Event) {
		direction = (e.target as HTMLSelectElement).value as CardDirection;
		if (currentCard) {
			displayCard = prepareCardForDisplay(currentCard, direction);
			flipped = false;
		}
	}

	function handleFinish() {
		goto(`${base}/flashcard/deck/${data.deckId}`);
	}

	function getProgressPercent(): number {
		if (!queue) return 0;
		const progress = getSessionProgress(queue);
		return progress.percentComplete;
	}
</script>

<svelte:head>
	<title>Ôn tập - {deck?.name ?? 'Flashcard'}</title>
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
{:else if completed}
	<!-- Session Complete -->
	<main class="flex h-screen flex-col items-center justify-center p-4">
		<div class="card w-full max-w-md bg-base-200">
			<div class="card-body text-center">
				<div class="mb-4 text-6xl">🎉</div>
				<h2 class="card-title justify-center text-2xl">Hoàn thành!</h2>
				<p class="mb-4 text-base-content/60">Bạn đã hoàn thành phiên ôn tập hôm nay.</p>

				<!-- Stats -->
				<div class="stats mb-6 shadow">
					<div class="stat">
						<div class="stat-title">Đã ôn</div>
						<div class="stat-value text-lg">{sessionStats.total}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Đúng</div>
						<div class="stat-value text-lg text-success">{sessionStats.correct}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Sai</div>
						<div class="stat-value text-lg text-error">{sessionStats.incorrect}</div>
					</div>
				</div>

				{#if sessionStats.total > 0}
					<div class="mb-4">
						<div class="mb-1 text-sm text-base-content/60">Tỷ lệ đúng</div>
						<div class="text-2xl font-bold">
							{Math.round((sessionStats.correct / sessionStats.total) * 100)}%
						</div>
					</div>
				{/if}

				<div class="card-actions justify-center">
					<button class="btn btn-primary" onclick={handleFinish}> Quay lại bộ thẻ </button>
				</div>
			</div>
		</div>
	</main>
{:else if deck && currentCard && displayCard}
	<!-- Review Session -->
	<main class="flex h-screen flex-col">
		<!-- Header -->
		<header class="flex items-center justify-between bg-base-200 p-4">
			<a href="{base}/flashcard/deck/{deck.id}" class="btn btn-ghost btn-sm">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="h-4 w-4 stroke-current"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</a>

			<div class="flex items-center gap-4">
				<!-- Direction selector -->
				<select
					class="select select-bordered select-sm"
					value={direction}
					onchange={handleDirectionChange}
				>
					<option value="viet-to-jp">Việt → Nhật</option>
					<option value="jp-to-viet">Nhật → Việt</option>
					<option value="random">Ngẫu nhiên</option>
				</select>
			</div>

			<!-- Progress -->
			<div class="text-sm text-base-content/60">
				{#if queue}
					{@const progress = getSessionProgress(queue)}
					{progress.completed} / {progress.total}
				{/if}
			</div>
		</header>

		<!-- Progress bar -->
		<div class="h-1 w-full bg-base-300">
			<div
				class="h-1 bg-primary transition-all duration-300"
				style="width: {getProgressPercent()}%"
			></div>
		</div>

		<!-- Card Area -->
		<div class="flex flex-1 flex-col items-center justify-center gap-8 p-4">
			<!-- Flashcard -->
			<FlashcardCard
				front={displayCard.front}
				back={displayCard.back}
				frontReading={displayCard.frontReading}
				backReading={displayCard.backReading}
				{flipped}
				onFlip={handleFlip}
			/>

			<!-- Notes -->
			{#if currentCard.notes && flipped}
				<div class="max-w-md text-center">
					<div class="text-sm text-base-content/60">
						📝 {currentCard.notes}
					</div>
				</div>
			{/if}

			<!-- Rating Buttons (show only when flipped) -->
			{#if flipped}
				<div class="w-full max-w-md">
					<RatingButtons state={currentCard.state} onRate={handleRate} />
				</div>
			{:else}
				<div class="text-sm text-base-content/50">Nhấn thẻ hoặc phím Space để xem đáp án</div>
			{/if}
		</div>

		<!-- Session Stats Footer -->
		<footer class="flex justify-center gap-8 bg-base-200 p-4 text-sm">
			<div>
				<span class="text-success">✓ {sessionStats.correct}</span>
			</div>
			<div>
				<span class="text-error">✗ {sessionStats.incorrect}</span>
			</div>
		</footer>
	</main>
{/if}
