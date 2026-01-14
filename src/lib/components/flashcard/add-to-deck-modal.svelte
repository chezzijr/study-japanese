<script lang="ts">
	/**
	 * Add to Deck Modal
	 *
	 * Modal for adding vocabulary/kanji to a flashcard deck.
	 * Supports selecting existing deck or creating new one.
	 * Supports bulk mode for adding multiple words at once.
	 */

	import { base } from '$app/paths';
	import type { WordDefinition } from '$lib/types/vocab';
	import {
		getAllDecks,
		createDeck,
		createCard,
		createCards,
		getCardsByDeck,
		vocabToFlashcard,
		isVocabAlreadyInDeck,
		type Deck
	} from '$lib/flashcard';

	// Props
	let {
		open = $bindable(false),
		word,
		bulkWords,
		level,
		unit,
		onSuccess,
		onBulkSuccess
	}: {
		open: boolean;
		word: WordDefinition | null;
		bulkWords?: WordDefinition[];
		level: string;
		unit: string;
		onSuccess?: (cardId: string, deckId: string, deckName: string, actualUnit: string) => void;
		onBulkSuccess?: (
			results: { cardId: string; word: string; actualUnit: string }[],
			deckId: string,
			deckName: string
		) => void;
	} = $props();

	// Computed: determine if we're in bulk mode
	let isBulkMode = $derived(bulkWords && bulkWords.length > 0);
	let bulkCount = $derived(bulkWords?.length ?? 0);

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

	// Check for duplicates when deck selection changes (single mode only)
	$effect(() => {
		if (selectedDeckId && word && !isBulkMode) {
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
			const actualUnit = word._unit ?? unit;
			const isDuplicate = isVocabAlreadyInDeck(cards, word, level, actualUnit);
			duplicateWarning = isDuplicate ? `Từ "${word.word}" đã có trong bộ thẻ này.` : null;
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

			const deck = await createDeck(newDeckName.trim(), newDeckDescription.trim() || undefined);

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
		if (!selectedDeckId) {
			error = 'Vui lòng chọn bộ thẻ.';
			return;
		}

		// Bulk mode
		if (isBulkMode && bulkWords && bulkWords.length > 0 && selectedDeckId) {
			try {
				loading = true;
				error = null;

				const deckId = selectedDeckId; // Capture non-null value for use in map
				// Convert all words to flashcard data
				const cardsData = bulkWords.map((w) => {
					const actualUnit = w._unit ?? unit;
					return vocabToFlashcard(w, deckId, level, actualUnit);
				});

				// Batch create all cards
				const newCards = await createCards(cardsData);

				success = true;
				const selectedDeck = decks.find((d) => d.id === deckId);

				// Build results for callback
				const results = newCards.map((card, index) => ({
					cardId: card.id,
					word: bulkWords[index].word,
					actualUnit: bulkWords[index]._unit ?? unit
				}));

				onBulkSuccess?.(results, deckId, selectedDeck?.name ?? 'Unknown');

				// Close after short delay
				setTimeout(() => {
					open = false;
					success = false;
				}, 1500);
			} catch (e) {
				console.error('Failed to add cards in bulk:', e);
				error = 'Không thể thêm thẻ vào bộ thẻ.';
			} finally {
				loading = false;
			}
			return;
		}

		// Single mode
		if (!word) {
			error = 'Vui lòng chọn bộ thẻ.';
			return;
		}

		try {
			loading = true;
			error = null;

			const actualUnit = word._unit ?? unit;
			const cardData = vocabToFlashcard(word, selectedDeckId, level, actualUnit);
			const newCard = await createCard(cardData);

			success = true;
			const selectedDeck = decks.find((d) => d.id === selectedDeckId);
			onSuccess?.(newCard.id, selectedDeckId, selectedDeck?.name ?? 'Unknown', actualUnit);

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

{#if open && (word || isBulkMode)}
	<!-- Modal backdrop -->
	<div class="modal modal-open">
		<div class="modal-box max-w-md">
			<!-- Header -->
			<h3 class="mb-4 text-lg font-bold">
				{#if isBulkMode}
					Thêm {bulkCount} từ vào Flashcard
				{:else}
					Thêm vào Flashcard
				{/if}
			</h3>

			<!-- Card Preview (single mode) or Summary (bulk mode) -->
			{#if isBulkMode}
				<div class="card mb-4 bg-base-200">
					<div class="card-body p-4">
						<div class="text-center">
							<div class="text-4xl font-bold text-primary">{bulkCount}</div>
							<div class="text-lg text-base-content/70">từ sẽ được thêm vào bộ thẻ</div>
						</div>
					</div>
				</div>
			{:else if word}
				<div class="card mb-4 bg-base-200">
					<div class="card-body p-4">
						<div class="text-center">
							<div class="text-2xl font-bold">{word.word}</div>
							{#if word.reading}
								<div class="text-sm text-base-content/60">{word.reading}</div>
							{/if}
							<div class="divider my-2"></div>
							<div class="text-lg">{word.meaning}</div>
							{#if word.note}
								<div class="mt-2 text-sm text-base-content/50">{word.note}</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- Success Message -->
			{#if success}
				<div class="alert alert-success mb-4">
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
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>
						{#if isBulkMode}
							Đã thêm {bulkCount} thẻ thành công!
						{:else}
							Đã thêm thẻ thành công!
						{/if}
					</span>
				</div>
			{:else}
				<!-- Deck Selection -->
				{#if decks.length > 0 && !showNewDeckForm}
					<div class="form-control mb-4">
						<label class="label">
							<span class="label-text">Chọn bộ thẻ</span>
						</label>
						<select class="select select-bordered w-full" bind:value={selectedDeckId}>
							{#each decks as deck}
								<option value={deck.id}>{deck.name}</option>
							{/each}
						</select>
					</div>

					<!-- Duplicate Warning (single mode only) -->
					{#if !isBulkMode && duplicateWarning}
						<div class="alert alert-warning mb-4">
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
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							<span>{duplicateWarning}</span>
						</div>
					{/if}

					<!-- Toggle to new deck form -->
					<button
						type="button"
						class="btn btn-ghost btn-sm mb-4"
						onclick={() => (showNewDeckForm = true)}
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
								onclick={() => (showNewDeckForm = false)}
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
				{/if}

				<!-- No Decks Message -->
				{#if decks.length === 0 && !showNewDeckForm}
					<div class="py-4 text-center">
						<p class="mb-4 text-base-content/60">Bạn chưa có bộ thẻ nào.</p>
						<button type="button" class="btn btn-primary" onclick={() => (showNewDeckForm = true)}>
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
						disabled={loading || !selectedDeckId || (!isBulkMode && !!duplicateWarning)}
					>
						{#if loading}
							<span class="loading loading-spinner loading-sm"></span>
						{/if}
						{#if isBulkMode}
							Thêm {bulkCount} thẻ
						{:else}
							Thêm thẻ
						{/if}
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
