<script lang="ts">
	/**
	 * Deck Detail Page
	 *
	 * View and manage cards in a deck.
	 */

	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import CardForm from '$lib/components/flashcard/card-form.svelte';
	import {
		getDeck,
		getCardsByDeck,
		createCard,
		updateCard,
		deleteCard,
		deleteCards,
		setCardSuspended,
		createCustomFlashcard,
		getReviewableCount,
		type Deck,
		type Flashcard
	} from '$lib/flashcard';
	import { toHiragana, toKatakana } from 'wanakana';

	let { data } = $props();

	// State
	let loading = $state(true);
	let error = $state<string | null>(null);
	let deck = $state<Deck | null>(null);
	let cards = $state<Flashcard[]>([]);
	let reviewableCount = $state({ dueCount: 0, newCount: 0, totalReviewable: 0 });

	// Search and filter
	let searchTerm = $state('');
	let statusFilter = $state<'all' | 'new' | 'learning' | 'review' | 'suspended'>('all');

	// UI state
	let showAddCard = $state(false);
	let editingCard = $state<Flashcard | null>(null);
	let selectedCards = $state<Set<string>>(new Set());
	let deleteConfirmCard = $state<Flashcard | null>(null);
	let showBulkDeleteConfirm = $state(false);

	// Filtered cards
	let filteredCards = $derived.by(() => {
		let result = cards;

		// Status filter
		if (statusFilter !== 'all') {
			result = result.filter((c) => c.status === statusFilter);
		}

		// Search filter
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase().trim();
			const hiragana = toHiragana(term);
			const katakana = toKatakana(term);

			result = result.filter((c) => {
				return (
					c.front.toLowerCase().includes(term) ||
					c.back.toLowerCase().includes(term) ||
					c.frontReading?.toLowerCase().includes(term) ||
					c.notes?.toLowerCase().includes(term) ||
					c.front.includes(hiragana) ||
					c.front.includes(katakana) ||
					c.frontReading?.includes(hiragana)
				);
			});
		}

		return result;
	});

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
			cards = await getCardsByDeck(data.deckId);
			reviewableCount = getReviewableCount(cards);
		} catch (e) {
			console.error('Failed to load deck:', e);
			error = 'Không thể tải dữ liệu bộ thẻ.';
		} finally {
			loading = false;
		}
	}

	async function handleAddCard(cardData: {
		front: string;
		back: string;
		frontReading?: string;
		notes?: string;
		tags?: string[];
	}) {
		try {
			const newCard = createCustomFlashcard(cardData.front, cardData.back, data.deckId, {
				frontReading: cardData.frontReading,
				notes: cardData.notes,
				tags: cardData.tags
			});

			await createCard(newCard);
			showAddCard = false;
			await loadData();
		} catch (e) {
			console.error('Failed to add card:', e);
			error = 'Không thể thêm thẻ.';
		}
	}

	async function handleEditCard(cardData: {
		front: string;
		back: string;
		frontReading?: string;
		notes?: string;
		tags?: string[];
	}) {
		if (!editingCard) return;

		try {
			await updateCard(editingCard.id, {
				front: cardData.front,
				back: cardData.back,
				frontReading: cardData.frontReading,
				notes: cardData.notes,
				tags: cardData.tags ?? []
			});
			editingCard = null;
			await loadData();
		} catch (e) {
			console.error('Failed to update card:', e);
			error = 'Không thể cập nhật thẻ.';
		}
	}

	async function handleDeleteCard() {
		if (!deleteConfirmCard) return;

		try {
			await deleteCard(deleteConfirmCard.id);
			deleteConfirmCard = null;
			await loadData();
		} catch (e) {
			console.error('Failed to delete card:', e);
			error = 'Không thể xóa thẻ.';
		}
	}

	async function handleBulkDelete() {
		try {
			await deleteCards(Array.from(selectedCards));
			selectedCards = new Set();
			showBulkDeleteConfirm = false;
			await loadData();
		} catch (e) {
			console.error('Failed to delete cards:', e);
			error = 'Không thể xóa các thẻ đã chọn.';
		}
	}

	async function handleToggleSuspend(card: Flashcard) {
		try {
			await setCardSuspended(card.id, card.status !== 'suspended');
			await loadData();
		} catch (e) {
			console.error('Failed to suspend card:', e);
		}
	}

	function toggleCardSelection(cardId: string) {
		const newSet = new Set(selectedCards);
		if (newSet.has(cardId)) {
			newSet.delete(cardId);
		} else {
			newSet.add(cardId);
		}
		selectedCards = newSet;
	}

	function toggleSelectAll() {
		if (selectedCards.size === filteredCards.length) {
			selectedCards = new Set();
		} else {
			selectedCards = new Set(filteredCards.map((c) => c.id));
		}
	}

	function getStatusBadgeClass(status: string): string {
		switch (status) {
			case 'new':
				return 'badge-primary';
			case 'learning':
				return 'badge-warning';
			case 'review':
				return 'badge-success';
			case 'suspended':
				return 'badge-ghost';
			default:
				return '';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'new':
				return 'Mới';
			case 'learning':
				return 'Đang học';
			case 'review':
				return 'Ôn tập';
			case 'suspended':
				return 'Tạm dừng';
			default:
				return status;
		}
	}
</script>

<svelte:head>
	<title>{deck?.name ?? 'Bộ thẻ'} - Flashcard</title>
</svelte:head>

<main class="container mx-auto max-w-4xl p-4">
	<!-- Header -->
	<div class="mb-6">
		<a href="{base}/flashcard" class="btn btn-ghost btn-sm gap-1 mb-4">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-4 h-4 stroke-current">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Quay lại
		</a>

		{#if deck}
			<div class="flex items-start justify-between">
				<div>
					<h1 class="text-2xl font-bold">{deck.name}</h1>
					{#if deck.description}
						<p class="text-base-content/60 mt-1">{deck.description}</p>
					{/if}
				</div>
				{#if reviewableCount.totalReviewable > 0}
					<a href="{base}/flashcard/deck/{deck.id}/review" class="btn btn-primary">
						Ôn tập ({reviewableCount.totalReviewable})
					</a>
				{/if}
			</div>

			<!-- Quick Stats -->
			<div class="stats shadow mt-4">
				<div class="stat py-3">
					<div class="stat-title text-sm">Mới</div>
					<div class="stat-value text-lg text-primary">{reviewableCount.newCount}</div>
				</div>
				<div class="stat py-3">
					<div class="stat-title text-sm">Đến hạn</div>
					<div class="stat-value text-lg text-secondary">{reviewableCount.dueCount}</div>
				</div>
				<div class="stat py-3">
					<div class="stat-title text-sm">Tổng</div>
					<div class="stat-value text-lg">{cards.length}</div>
				</div>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="flex justify-center items-center py-20">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if error}
		<div class="alert alert-error">
			<span>{error}</span>
		</div>
	{:else if deck}
		<!-- Toolbar -->
		<div class="flex flex-wrap items-center gap-4 mb-4">
			<!-- Search -->
			<div class="flex items-center gap-2 flex-1 min-w-64">
				<input
					type="text"
					placeholder="Tìm kiếm..."
					class="input input-bordered input-sm w-full max-w-xs"
					bind:value={searchTerm}
				/>
			</div>

			<!-- Status Filter -->
			<select class="select select-bordered select-sm" bind:value={statusFilter}>
				<option value="all">Tất cả</option>
				<option value="new">Mới</option>
				<option value="learning">Đang học</option>
				<option value="review">Ôn tập</option>
				<option value="suspended">Tạm dừng</option>
			</select>

			<!-- Add Card Button -->
			<button class="btn btn-primary btn-sm" onclick={() => (showAddCard = true)}>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-4 h-4 stroke-current">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Thêm thẻ
			</button>
		</div>

		<!-- Bulk Actions -->
		{#if selectedCards.size > 0}
			<div class="bg-base-200 p-2 rounded-lg mb-4 flex items-center gap-4">
				<span class="text-sm">{selectedCards.size} thẻ đã chọn</span>
				<button class="btn btn-error btn-sm" onclick={() => (showBulkDeleteConfirm = true)}>
					Xóa đã chọn
				</button>
				<button class="btn btn-ghost btn-sm" onclick={() => (selectedCards = new Set())}>
					Bỏ chọn
				</button>
			</div>
		{/if}

		<!-- Cards Table -->
		{#if cards.length === 0}
			<div class="text-center py-20">
				<div class="text-5xl mb-4">📝</div>
				<h2 class="text-xl font-semibold mb-2">Chưa có thẻ nào</h2>
				<p class="text-base-content/60 mb-6">Thêm thẻ đầu tiên để bắt đầu ôn tập</p>
				<button class="btn btn-primary" onclick={() => (showAddCard = true)}>
					Thêm thẻ mới
				</button>
			</div>
		{:else}
			<div class="overflow-x-auto rounded-lg border border-base-content/10">
				<table class="table table-zebra">
					<thead>
						<tr>
							<th>
								<input
									type="checkbox"
									class="checkbox checkbox-sm"
									checked={selectedCards.size === filteredCards.length && filteredCards.length > 0}
									onchange={toggleSelectAll}
								/>
							</th>
							<th>Mặt trước</th>
							<th>Mặt sau</th>
							<th>Trạng thái</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each filteredCards as card (card.id)}
							<tr class="hover">
								<td>
									<input
										type="checkbox"
										class="checkbox checkbox-sm"
										checked={selectedCards.has(card.id)}
										onchange={() => toggleCardSelection(card.id)}
									/>
								</td>
								<td>
									<div class="font-medium">{card.front}</div>
									{#if card.frontReading}
										<div class="text-sm text-base-content/60">{card.frontReading}</div>
									{/if}
								</td>
								<td>
									<div class="max-w-xs truncate">{card.back}</div>
								</td>
								<td>
									<span class="badge badge-sm {getStatusBadgeClass(card.status)}">
										{getStatusLabel(card.status)}
									</span>
								</td>
								<td>
									<div class="dropdown dropdown-end">
										<button tabindex="0" class="btn btn-ghost btn-xs">
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-4 h-4 stroke-current">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
											</svg>
										</button>
										<ul tabindex="0" class="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-40">
											<li><button onclick={() => (editingCard = card)}>Sửa</button></li>
											<li>
												<button onclick={() => handleToggleSuspend(card)}>
													{card.status === 'suspended' ? 'Bỏ tạm dừng' : 'Tạm dừng'}
												</button>
											</li>
											<li><button onclick={() => (deleteConfirmCard = card)} class="text-error">Xóa</button></li>
										</ul>
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="5" class="text-center py-8 text-base-content/50">
									Không tìm thấy thẻ phù hợp
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="mt-4 text-sm text-base-content/60">
				Hiển thị {filteredCards.length} / {cards.length} thẻ
			</div>
		{/if}
	{/if}
</main>

<!-- Add Card Modal -->
{#if showAddCard}
	<div class="modal modal-open">
		<div class="modal-box max-w-lg">
			<h3 class="font-bold text-lg mb-4">Thêm thẻ mới</h3>
			<CardForm onSave={handleAddCard} onCancel={() => (showAddCard = false)} />
		</div>
		<div class="modal-backdrop" onclick={() => (showAddCard = false)}></div>
	</div>
{/if}

<!-- Edit Card Modal -->
{#if editingCard}
	<div class="modal modal-open">
		<div class="modal-box max-w-lg">
			<h3 class="font-bold text-lg mb-4">Sửa thẻ</h3>
			<CardForm card={editingCard} onSave={handleEditCard} onCancel={() => (editingCard = null)} />
		</div>
		<div class="modal-backdrop" onclick={() => (editingCard = null)}></div>
	</div>
{/if}

<!-- Delete Confirm Modal -->
{#if deleteConfirmCard}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg">Xác nhận xóa</h3>
			<p class="py-4">Bạn có chắc muốn xóa thẻ này?</p>
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (deleteConfirmCard = null)}>Hủy</button>
				<button class="btn btn-error" onclick={handleDeleteCard}>Xóa</button>
			</div>
		</div>
		<div class="modal-backdrop" onclick={() => (deleteConfirmCard = null)}></div>
	</div>
{/if}

<!-- Bulk Delete Confirm Modal -->
{#if showBulkDeleteConfirm}
	<div class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg">Xác nhận xóa</h3>
			<p class="py-4">Bạn có chắc muốn xóa {selectedCards.size} thẻ đã chọn?</p>
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (showBulkDeleteConfirm = false)}>Hủy</button>
				<button class="btn btn-error" onclick={handleBulkDelete}>Xóa</button>
			</div>
		</div>
		<div class="modal-backdrop" onclick={() => (showBulkDeleteConfirm = false)}></div>
	</div>
{/if}
