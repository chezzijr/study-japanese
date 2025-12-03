<script lang="ts">
	/**
	 * Flashcard Dashboard
	 *
	 * Lists all decks with stats and provides quick access to review.
	 */

	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import DeckCard from '$lib/components/flashcard/deck-card.svelte';
	import {
		getAllDecks,
		getCardsByDeck,
		deleteDeck,
		isIndexedDBAvailable,
		getTotalDueCount,
		type Deck,
		type Flashcard
	} from '$lib/flashcard';
	import { getReviewableCount } from '$lib/flashcard';

	// State
	let loading = $state(true);
	let error = $state<string | null>(null);
	let decks = $state<Deck[]>([]);
	let deckStats = $state<Map<string, { dueCount: number; newCount: number; totalCount: number }>>(
		new Map()
	);
	let totalDue = $state(0);

	// Confirmation modal state
	let deleteConfirmDeck = $state<Deck | null>(null);

	onMount(async () => {
		if (!isIndexedDBAvailable()) {
			error = 'IndexedDB không khả dụng. Flashcard cần IndexedDB để lưu trữ dữ liệu.';
			loading = false;
			return;
		}

		await loadData();
	});

	async function loadData() {
		try {
			loading = true;
			error = null;

			decks = await getAllDecks();
			totalDue = await getTotalDueCount();

			// Load stats for each deck
			const stats = new Map<string, { dueCount: number; newCount: number; totalCount: number }>();
			for (const deck of decks) {
				const cards = await getCardsByDeck(deck.id);
				const { dueCount, newCount } = getReviewableCount(cards);
				stats.set(deck.id, {
					dueCount,
					newCount,
					totalCount: cards.length
				});
			}
			deckStats = stats;
		} catch (e) {
			console.error('Failed to load flashcard data:', e);
			error = 'Không thể tải dữ liệu flashcard.';
		} finally {
			loading = false;
		}
	}

	function handleEditDeck(deck: Deck) {
		// Navigate to edit page or open modal
		// For now, just navigate
		window.location.href = `${base}/flashcard/deck/${deck.id}`;
	}

	function handleDeleteDeck(deck: Deck) {
		deleteConfirmDeck = deck;
	}

	async function confirmDelete() {
		if (!deleteConfirmDeck) return;

		try {
			await deleteDeck(deleteConfirmDeck.id);
			deleteConfirmDeck = null;
			await loadData();
		} catch (e) {
			console.error('Failed to delete deck:', e);
			error = 'Không thể xóa bộ thẻ.';
		}
	}

	function cancelDelete() {
		deleteConfirmDeck = null;
	}
</script>

<svelte:head>
	<title>Flashcard - Study Japanese</title>
</svelte:head>

<main class="container mx-auto max-w-4xl p-4">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Flashcard</h1>
			<p class="mt-1 text-base-content/60">
				Ôn tập với thẻ ghi nhớ theo phương pháp lặp lại ngắt quãng
			</p>
		</div>
		<a href="{base}/flashcard/deck/new" class="btn btn-primary">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="h-5 w-5 stroke-current"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Tạo bộ thẻ
		</a>
	</div>

	<!-- Overall Stats -->
	{#if !loading && !error && decks.length > 0}
		<div class="stats mb-6 w-full shadow">
			<div class="stat">
				<div class="stat-title">Tổng bộ thẻ</div>
				<div class="stat-value text-primary">{decks.length}</div>
			</div>
			<div class="stat">
				<div class="stat-title">Cần ôn tập</div>
				<div class="stat-value text-secondary">{totalDue}</div>
			</div>
		</div>
	{/if}

	<!-- Loading State -->
	{#if loading}
		<div class="flex items-center justify-center py-20">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="alert alert-error">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 shrink-0 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span>{error}</span>
		</div>
	{:else if decks.length === 0}
		<!-- Empty State -->
		<div class="py-20 text-center">
			<div class="mb-4 text-6xl">📚</div>
			<h2 class="mb-2 text-xl font-semibold">Chưa có bộ thẻ nào</h2>
			<p class="mb-6 text-base-content/60">Tạo bộ thẻ đầu tiên để bắt đầu ôn tập</p>
			<a href="{base}/flashcard/deck/new" class="btn btn-primary"> Tạo bộ thẻ mới </a>
		</div>
	{:else}
		<!-- Deck Grid -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each decks as deck (deck.id)}
				{@const stats = deckStats.get(deck.id)}
				<DeckCard
					{deck}
					dueCount={stats?.dueCount ?? 0}
					newCount={stats?.newCount ?? 0}
					totalCount={stats?.totalCount ?? 0}
					onEdit={handleEditDeck}
					onDelete={handleDeleteDeck}
				/>
			{/each}
		</div>
	{/if}
</main>

<!-- Delete Confirmation Modal -->
{#if deleteConfirmDeck}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="text-lg font-bold">Xác nhận xóa</h3>
			<p class="py-4">
				Bạn có chắc muốn xóa bộ thẻ "{deleteConfirmDeck.name}"?
				<br />
				<span class="text-error">Tất cả thẻ trong bộ sẽ bị xóa vĩnh viễn.</span>
			</p>
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={cancelDelete}>Hủy</button>
				<button class="btn btn-error" onclick={confirmDelete}>Xóa</button>
			</div>
		</div>
		<div class="modal-backdrop" onclick={cancelDelete}></div>
	</div>
{/if}
