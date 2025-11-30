<script lang="ts">
	/**
	 * Add to Deck Modal
	 *
	 * Modal for adding vocabulary/kanji to a flashcard deck.
	 * Supports selecting existing deck or creating new one.
	 */

	import { base } from '$app/paths';
	import type { WordDefinition } from '$lib/types/vocab';
	import {
		getAllDecks,
		createDeck,
		createCard,
		getCardsByDeck,
		vocabToFlashcard,
		isVocabAlreadyInDeck,
		type Deck
	} from '$lib/flashcard';

	// Props
	let {
		open = $bindable(false),
		word,
		level,
		unit,
		onSuccess
	}: {
		open: boolean;
		word: WordDefinition | null;
		level: string;
		unit: string;
		onSuccess?: () => void;
	} = $props();

	// State
	let decks = $state<Deck[]>([]);
	let selectedDeckId = $state<string | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);
	let duplicateWarning = $state<string | null>(null);

	// New deck form
	let showNewDeckForm = $state(false);
	let newDeckName = $state('');
	let newDeckDescription = $state('');
	let creatingDeck = $state(false);

	// Load decks when modal opens
	$effect(() => {
		if (open) {
			loadDecks();
			// Reset state
			error = null;
			success = false;
			duplicateWarning = null;
			showNewDeckForm = false;
			newDeckName = '';
			newDeckDescription = '';
		}
	});

	// Check for duplicates when deck selection changes
	$effect(() => {
		if (selectedDeckId && word) {
			checkDuplicate();
		} else {
			duplicateWarning = null;
		}
	});

	async function loadDecks() {
		try {
			decks = await getAllDecks();
			// Auto-select first deck if available
			if (decks.length > 0 && !selectedDeckId) {
				selectedDeckId = decks[0].id;
			}
		} catch (e) {
			console.error('Failed to load decks:', e);
			error = 'Không thể tải danh sách bộ thẻ.';
		}
	}

	async function checkDuplicate() {
		if (!selectedDeckId || !word) return;

		try {
			const cards = await getCardsByDeck(selectedDeckId);
			const isDuplicate = isVocabAlreadyInDeck(cards, word, level, unit);
			duplicateWarning = isDuplicate
				? `Từ "${word.word}" đã có trong bộ thẻ này.`
				: null;
		} catch (e) {
			console.error('Failed to check duplicate:', e);
		}
	}

	async function handleCreateDeck() {
		if (!newDeckName.trim()) {
			error = 'Vui lòng nhập tên bộ thẻ.';
			return;
		}

		try {
			creatingDeck = true;
			error = null;

			const deck = await createDeck(
				newDeckName.trim(),
				newDeckDescription.trim() || undefined
			);

			decks = [...decks, deck];
			selectedDeckId = deck.id;
			showNewDeckForm = false;
			newDeckName = '';
			newDeckDescription = '';
		} catch (e) {
			console.error('Failed to create deck:', e);
			error = 'Không thể tạo bộ thẻ mới.';
		} finally {
			creatingDeck = false;
		}
	}

	async function handleAddCard() {
		if (!selectedDeckId || !word) {
			error = 'Vui lòng chọn bộ thẻ.';
			return;
		}

		try {
			loading = true;
			error = null;

			const cardData = vocabToFlashcard(word, selectedDeckId, level, unit);
			await createCard(cardData);

			success = true;
			onSuccess?.();

			// Close after short delay
			setTimeout(() => {
				open = false;
				success = false;
			}, 1500);
		} catch (e) {
			console.error('Failed to add card:', e);
			error = 'Không thể thêm thẻ vào bộ thẻ.';
		} finally {
			loading = false;
		}
	}

	function handleClose() {
		open = false;
		error = null;
		success = false;
	}
</script>

{#if open && word}
	<!-- Modal backdrop -->
	<div class="modal modal-open">
		<div class="modal-box max-w-md">
			<!-- Header -->
			<h3 class="font-bold text-lg mb-4">Thêm vào Flashcard</h3>

			<!-- Card Preview -->
			<div class="card bg-base-200 mb-4">
				<div class="card-body p-4">
					<div class="text-center">
						<div class="text-2xl font-bold">{word.word}</div>
						{#if word.reading}
							<div class="text-sm text-base-content/60">{word.reading}</div>
						{/if}
						<div class="divider my-2"></div>
						<div class="text-lg">{word.meaning}</div>
						{#if word.note}
							<div class="text-sm text-base-content/50 mt-2">{word.note}</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Success Message -->
			{#if success}
				<div class="alert alert-success mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span>Đã thêm thẻ thành công!</span>
				</div>
			{:else}
				<!-- Deck Selection -->
				{#if decks.length > 0 && !showNewDeckForm}
					<div class="form-control mb-4">
						<label class="label">
							<span class="label-text">Chọn bộ thẻ</span>
						</label>
						<select
							class="select select-bordered w-full"
							bind:value={selectedDeckId}
						>
							{#each decks as deck}
								<option value={deck.id}>{deck.name}</option>
							{/each}
						</select>
					</div>

					<!-- Duplicate Warning -->
					{#if duplicateWarning}
						<div class="alert alert-warning mb-4">
							<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
							<span>{duplicateWarning}</span>
						</div>
					{/if}

					<!-- Toggle to new deck form -->
					<button
						type="button"
						class="btn btn-ghost btn-sm mb-4"
						onclick={() => showNewDeckForm = true}
					>
						+ Tạo bộ thẻ mới
					</button>
				{:else}
					<!-- New Deck Form -->
					<div class="mb-4">
						{#if decks.length > 0}
							<button
								type="button"
								class="btn btn-ghost btn-sm mb-2"
								onclick={() => showNewDeckForm = false}
							>
								&larr; Chọn bộ thẻ có sẵn
							</button>
						{/if}

						<div class="form-control mb-2">
							<label class="label">
								<span class="label-text">Tên bộ thẻ mới *</span>
							</label>
							<input
								type="text"
								class="input input-bordered w-full"
								placeholder="VD: N5 - Từ vựng"
								bind:value={newDeckName}
							/>
						</div>

						<div class="form-control mb-4">
							<label class="label">
								<span class="label-text">Mô tả (tùy chọn)</span>
							</label>
							<textarea
								class="textarea textarea-bordered w-full"
								placeholder="Mô tả ngắn về bộ thẻ..."
								bind:value={newDeckDescription}
							></textarea>
						</div>

						<button
							type="button"
							class="btn btn-secondary w-full"
							onclick={handleCreateDeck}
							disabled={creatingDeck || !newDeckName.trim()}
						>
							{#if creatingDeck}
								<span class="loading loading-spinner loading-sm"></span>
							{/if}
							Tạo bộ thẻ
						</button>
					</div>
				{/if}

				<!-- Error Message -->
				{#if error}
					<div class="alert alert-error mb-4">
						<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span>{error}</span>
					</div>
				{/if}

				<!-- No Decks Message -->
				{#if decks.length === 0 && !showNewDeckForm}
					<div class="text-center py-4">
						<p class="text-base-content/60 mb-4">Bạn chưa có bộ thẻ nào.</p>
						<button
							type="button"
							class="btn btn-primary"
							onclick={() => showNewDeckForm = true}
						>
							Tạo bộ thẻ đầu tiên
						</button>
					</div>
				{/if}
			{/if}

			<!-- Actions -->
			<div class="modal-action">
				<button type="button" class="btn btn-ghost" onclick={handleClose}>
					{success ? 'Đóng' : 'Hủy'}
				</button>
				{#if !success && (selectedDeckId || showNewDeckForm === false) && decks.length > 0}
					<button
						type="button"
						class="btn btn-primary"
						onclick={handleAddCard}
						disabled={loading || !selectedDeckId || !!duplicateWarning}
					>
						{#if loading}
							<span class="loading loading-spinner loading-sm"></span>
						{/if}
						Thêm thẻ
					</button>
				{/if}
			</div>
		</div>

		<!-- Click outside to close -->
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={handleClose}>close</button>
		</form>
	</div>
{/if}
