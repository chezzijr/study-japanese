<script lang="ts">
	/**
	 * Add Kanji to Deck Modal
	 *
	 * Modal for adding kanji to a flashcard deck.
	 * Supports selecting existing deck or creating new one.
	 */

	import {
		getAllDecks,
		createDeck,
		createCard,
		getCardsByDeck,
		kanjiToFlashcard,
		isKanjiAlreadyInDeck,
		type Deck,
		type KanjiData
	} from '$lib/flashcard';

	// Props
	let {
		open = $bindable(false),
		kanji,
		level,
		onSuccess
	}: {
		open: boolean;
		kanji: KanjiData | null;
		level: string;
		onSuccess?: (cardId: string, deckId: string, deckName: string) => void;
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
		if (selectedDeckId && kanji) {
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
		if (!selectedDeckId || !kanji) return;

		try {
			const cards = await getCardsByDeck(selectedDeckId);
			const isDuplicate = isKanjiAlreadyInDeck(cards, kanji, level);
			duplicateWarning = isDuplicate ? `Kanji "${kanji.word}" đã có trong bộ thẻ này.` : null;
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
		if (!selectedDeckId || !kanji) {
			error = 'Vui lòng chọn bộ thẻ.';
			return;
		}

		try {
			loading = true;
			error = null;

			const cardData = kanjiToFlashcard(kanji, selectedDeckId, level);
			const newCard = await createCard(cardData);

			success = true;
			const selectedDeck = decks.find((d) => d.id === selectedDeckId);
			onSuccess?.(newCard.id, selectedDeckId, selectedDeck?.name ?? 'Unknown');

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

{#if open && kanji}
	<!-- Modal backdrop -->
	<div class="modal modal-open">
		<div class="modal-box max-w-md">
			<!-- Header -->
			<h3 class="mb-4 text-lg font-bold">Thêm Kanji vào Flashcard</h3>

			<!-- Card Preview -->
			<div class="card mb-4 bg-base-200">
				<div class="card-body p-4">
					<div class="text-center">
						<div class="text-5xl font-bold text-primary">{kanji.word}</div>
						<div class="mt-2 text-xl font-medium">{kanji.meaning}</div>
						<div class="divider my-2"></div>
						<div class="flex justify-center gap-4 text-sm">
							{#if kanji.onyomi.length > 0}
								<div>
									<span class="text-base-content/60">Onyomi:</span>
									{kanji.onyomi.join(', ')}
								</div>
							{/if}
							{#if kanji.kunyomi.length > 0}
								<div>
									<span class="text-base-content/60">Kunyomi:</span>
									{kanji.kunyomi.join(', ')}
								</div>
							{/if}
						</div>
						{#if kanji.radicals}
							<div class="mt-2 text-sm text-base-content/50">
								Bộ thủ: {kanji.radicals}
							</div>
						{/if}
					</div>
				</div>
			</div>

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
					<span>Đã thêm thẻ thành công!</span>
				</div>
			{:else}
				<!-- Deck Selection -->
				{#if decks.length > 0 && !showNewDeckForm}
					<div class="form-control mb-4">
						<label class="label" for="deck-select">
							<span class="label-text">Chọn bộ thẻ</span>
						</label>
						<select
							id="deck-select"
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
							<label class="label" for="new-deck-name">
								<span class="label-text">Tên bộ thẻ mới *</span>
							</label>
							<input
								id="new-deck-name"
								type="text"
								class="input input-bordered w-full"
								placeholder="VD: N5 - Kanji"
								bind:value={newDeckName}
							/>
						</div>

						<div class="form-control mb-4">
							<label class="label" for="new-deck-desc">
								<span class="label-text">Mô tả (tùy chọn)</span>
							</label>
							<textarea
								id="new-deck-desc"
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
