<script lang="ts">
	import { onMount } from 'svelte';
	import type { Dictionary, WordDefinition } from '$lib/types/vocab';
	import { toHiragana, toKatakana } from 'wanakana';
	import AddToDeckModal from './flashcard/add-to-deck-modal.svelte';
	import { getAllCards, getAllDecks, deleteCard, deleteCards } from '$lib/flashcard';

	let {
		kotobas,
		level = '',
		unit = ''
	}: { kotobas: Dictionary; level?: string; unit?: string } = $props();

	// Flashcard integration state
	let modalOpen = $state(false);
	let selectedWord = $state<WordDefinition | null>(null);

	function openAddModal(word: WordDefinition) {
		selectedWord = word;
		modalOpen = true;
	}

	// Vocab lookup state for duplicate detection
	type VocabLookupInfo = { cardId: string; deckId: string; deckName: string };
	let vocabLookup = $state<Map<string, VocabLookupInfo>>(new Map());
	let lookupLoading = $state(true);

	// Remove dialog state
	let removeDialogOpen = $state(false);
	let wordToRemove = $state<WordDefinition | null>(null);
	let cardToRemove = $state<VocabLookupInfo | null>(null);
	let removing = $state(false);

	function makeKey(lvl: string, u: string, word: string): string {
		return `${lvl}|${u}|${word}`;
	}

	onMount(async () => {
		if (!level || !unit) {
			lookupLoading = false;
			return;
		}

		try {
			const [cards, decks] = await Promise.all([getAllCards(), getAllDecks()]);
			const deckNames = new Map(decks.map((d) => [d.id, d.name]));

			const lookup = new Map<string, VocabLookupInfo>();
			for (const card of cards) {
				if (card.source.type === 'vocab') {
					const src = card.source as { type: 'vocab'; level: string; unit: string; word: string };
					lookup.set(makeKey(src.level, src.unit, src.word), {
						cardId: card.id,
						deckId: card.deckId,
						deckName: deckNames.get(card.deckId) ?? 'Unknown'
					});
				}
			}
			vocabLookup = lookup;
		} catch (e) {
			console.error('Failed to load vocab lookup:', e);
		} finally {
			lookupLoading = false;
		}
	});

	function openRemoveDialog(word: WordDefinition, info: VocabLookupInfo) {
		wordToRemove = word;
		cardToRemove = info;
		removeDialogOpen = true;
	}

	async function handleRemove() {
		if (!cardToRemove || !wordToRemove) return;

		removing = true;
		try {
			await deleteCard(cardToRemove.cardId);
			const actualUnit = wordToRemove._unit ?? unit;
			vocabLookup.delete(makeKey(level, actualUnit, wordToRemove.word));
			vocabLookup = new Map(vocabLookup); // trigger reactivity
			removeDialogOpen = false;
		} catch (e) {
			console.error('Failed to remove card:', e);
		} finally {
			removing = false;
			wordToRemove = null;
			cardToRemove = null;
		}
	}

	function handleAddSuccess(cardId: string, deckId: string, deckName: string, actualUnit: string) {
		if (selectedWord) {
			vocabLookup.set(makeKey(level, actualUnit, selectedWord.word), {
				cardId,
				deckId,
				deckName
			});
			vocabLookup = new Map(vocabLookup); // trigger reactivity
		}
	}

	// Bulk action state
	let bulkAddModalOpen = $state(false);
	let bulkWordsToAdd = $state<WordDefinition[]>([]);
	let bulkConfirmOpen = $state(false);
	let bulkConfirmMessage = $state('');
	let bulkConfirmAction = $state<() => void>(() => {});
	let bulkRemoving = $state(false);

	// Count words not in any deck
	let wordsToAddCount = $derived.by(() => {
		if (!level || !unit) return 0;
		return kotobas.filter((w) => {
			const actualUnit = w._unit ?? unit;
			return !vocabLookup.has(makeKey(level, actualUnit, w.word));
		}).length;
	});

	// Count words in decks (and collect their info for removal)
	let wordsInDecks = $derived.by(() => {
		if (!level || !unit) return [];
		return kotobas
			.map((w) => {
				const actualUnit = w._unit ?? unit;
				const info = vocabLookup.get(makeKey(level, actualUnit, w.word));
				return info ? { word: w, info, actualUnit } : null;
			})
			.filter((item): item is NonNullable<typeof item> => item !== null);
	});

	function handleAddAll() {
		// Check if this is "all" or range view - show confirmation first
		if (unit === 'all' || unit.includes('-') || unit.includes(',')) {
			bulkConfirmMessage = `Thêm ${wordsToAddCount} từ từ ${unit}?`;
			bulkConfirmAction = () => {
				bulkConfirmOpen = false;
				proceedWithAddAll();
			};
			bulkConfirmOpen = true;
			return;
		}
		proceedWithAddAll();
	}

	function proceedWithAddAll() {
		// Filter words not in any deck
		const newWords = kotobas.filter((w) => {
			const actualUnit = w._unit ?? unit;
			return !vocabLookup.has(makeKey(level, actualUnit, w.word));
		});
		bulkWordsToAdd = newWords;
		bulkAddModalOpen = true;
	}

	function handleBulkAddSuccess(
		results: { cardId: string; word: string; actualUnit: string }[],
		deckId: string,
		deckName: string
	) {
		// Update vocabLookup for all added words
		for (const result of results) {
			vocabLookup.set(makeKey(level, result.actualUnit, result.word), {
				cardId: result.cardId,
				deckId,
				deckName
			});
		}
		vocabLookup = new Map(vocabLookup); // trigger reactivity
		bulkWordsToAdd = [];
	}

	function handleRemoveAll() {
		const toRemove = wordsInDecks;
		if (toRemove.length === 0) return;

		// Show confirmation (always for remove)
		const isAllView = unit === 'all' || unit.includes('-') || unit.includes(',');
		bulkConfirmMessage = isAllView
			? `Xóa ${toRemove.length} từ khỏi các bộ thẻ? Tiến trình học sẽ bị mất.`
			: `Xóa ${toRemove.length} từ khỏi các bộ thẻ? Tiến trình học sẽ bị mất.`;

		bulkConfirmAction = async () => {
			bulkConfirmOpen = false;
			await proceedWithRemoveAll(toRemove);
		};
		bulkConfirmOpen = true;
	}

	async function proceedWithRemoveAll(
		toRemove: { word: WordDefinition; info: VocabLookupInfo; actualUnit: string }[]
	) {
		try {
			bulkRemoving = true;
			const cardIds = toRemove.map((item) => item.info.cardId);
			await deleteCards(cardIds);

			// Update vocabLookup
			for (const item of toRemove) {
				vocabLookup.delete(makeKey(level, item.actualUnit, item.word.word));
			}
			vocabLookup = new Map(vocabLookup); // trigger reactivity
		} catch (e) {
			console.error('Failed to remove cards:', e);
		} finally {
			bulkRemoving = false;
		}
	}

	let searchTerm = $state('');

	// Filter function that searches across word, reading, meaning, and romaji
	function matchesSearch(kotoba: Dictionary[number], term: string): boolean {
		if (!term.trim()) return true;

		const normalizedTerm = term.toLowerCase().trim();

		// 1. Direct word match (kanji/kana)
		if (kotoba.word.includes(normalizedTerm)) return true;

		// 2. Reading match (hiragana/katakana)
		if (kotoba.reading?.includes(normalizedTerm)) return true;

		// 3. Meaning match (Vietnamese, case-insensitive)
		if (kotoba.meaning.toLowerCase().includes(normalizedTerm)) return true;

		// 4. Note match
		if (kotoba.note?.toLowerCase().includes(normalizedTerm)) return true;

		// 5. Romaji to kana conversion - try both hiragana and katakana
		try {
			const asHiragana = toHiragana(normalizedTerm);
			const asKatakana = toKatakana(normalizedTerm);

			// Match converted term against word and reading
			if (kotoba.word.includes(asHiragana) || kotoba.word.includes(asKatakana)) return true;
			if (kotoba.reading?.includes(asHiragana) || kotoba.reading?.includes(asKatakana)) return true;
		} catch {
			// Invalid romaji input, skip conversion
		}

		return false;
	}

	let filteredKotobas = $derived(kotobas.filter((kotoba) => matchesSearch(kotoba, searchTerm)));
</script>

<div class="flex h-[95vh] flex-col">
	<!-- Search bar -->
	<div class="flex items-center justify-between gap-4 rounded-t-box bg-base-200 p-4">
		<div class="flex flex-1 items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="h-5 w-5 stroke-current opacity-70"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				></path>
			</svg>
			<input
				type="text"
				placeholder="Tìm kiếm (kanji, hiragana, romaji, nghĩa)..."
				class="input input-sm input-bordered w-full max-w-md"
				bind:value={searchTerm}
			/>
		</div>
		{#if level && unit}
			<div class="flex items-center gap-2">
				<button
					type="button"
					class="btn btn-primary btn-sm"
					onclick={handleAddAll}
					disabled={lookupLoading || bulkRemoving || wordsToAddCount === 0}
				>
					Thêm tất cả ({wordsToAddCount})
				</button>
				<button
					type="button"
					class="btn btn-outline btn-error btn-sm"
					onclick={handleRemoveAll}
					disabled={lookupLoading || bulkRemoving || wordsInDecks.length === 0}
				>
					{#if bulkRemoving}
						<span class="loading loading-spinner loading-xs"></span>
					{/if}
					Xóa tất cả ({wordsInDecks.length})
				</button>
			</div>
		{/if}
		<div class="badge badge-neutral">
			{filteredKotobas.length} / {kotobas.length}
		</div>
	</div>

	<!-- Table container -->
	<div class="flex-1 overflow-auto rounded-b-box border border-base-content/5 bg-base-100">
		<table class="table table-zebra table-pin-rows text-center">
			<thead class="text-lg">
				<tr>
					<th class="w-1/6">Từ</th>
					<th class="w-1/5">Phiên âm Hiragana</th>
					<th class="w-2/5">Nghĩa</th>
					<th class="w-1/6">Ghi chú</th>
					{#if level && unit}
						<th class="w-12"></th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each filteredKotobas as kotoba}
					<tr class="hover:bg-base-300">
						<td class="font-medium">{kotoba.word}</td>
						<td class="text-base-content/80">{kotoba.reading ?? ''}</td>
						<td>{kotoba.meaning}</td>
						<td class="text-sm text-base-content/60">{kotoba.note ?? ''}</td>
						{#if level && unit}
							<td>
								{#if lookupLoading}
									<span class="loading loading-spinner loading-xs"></span>
								{:else}
									{@const actualUnit = kotoba._unit ?? unit}
									{@const existing = vocabLookup.get(makeKey(level, actualUnit, kotoba.word))}
									{#if existing}
										<div class="tooltip" data-tip="Trong: {existing.deckName}">
											<button
												type="button"
												class="btn btn-ghost btn-xs text-error"
												title="Xóa khỏi Flashcard"
												onclick={() => openRemoveDialog(kotoba, existing)}
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke-width="2"
													stroke="currentColor"
													class="h-4 w-4"
												>
													<path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
												</svg>
											</button>
										</div>
									{:else}
										<button
											type="button"
											class="btn btn-ghost btn-xs"
											title="Thêm vào Flashcard"
											onclick={() => openAddModal(kotoba)}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="2"
												stroke="currentColor"
												class="h-4 w-4"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M12 4.5v15m7.5-7.5h-15"
												/>
											</svg>
										</button>
									{/if}
								{/if}
							</td>
						{/if}
					</tr>
				{:else}
					<tr>
						<td colspan={level && unit ? 5 : 4} class="text-center py-8 text-base-content/50">
							Không tìm thấy kết quả cho "{searchTerm}"
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Add to Deck Modal -->
{#if level && unit}
	<AddToDeckModal
		bind:open={modalOpen}
		word={selectedWord}
		{level}
		{unit}
		onSuccess={handleAddSuccess}
	/>
{/if}

<!-- Remove Confirmation Dialog -->
{#if removeDialogOpen && wordToRemove && cardToRemove}
	<div class="modal modal-open">
		<div class="modal-box max-w-sm">
			<h3 class="text-lg font-bold">Xác nhận xóa</h3>
			<p class="py-4">
				Xóa từ <strong>"{wordToRemove.word}"</strong> khỏi bộ thẻ
				<strong>"{cardToRemove.deckName}"</strong>?
			</p>
			<div class="modal-action">
				<button type="button" class="btn btn-ghost" onclick={() => (removeDialogOpen = false)}>
					Hủy
				</button>
				<button type="button" class="btn btn-error" onclick={handleRemove} disabled={removing}>
					{#if removing}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					Xóa
				</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={() => (removeDialogOpen = false)}>close</button>
		</form>
	</div>
{/if}

<!-- Bulk Add Modal -->
{#if level && unit}
	<AddToDeckModal
		bind:open={bulkAddModalOpen}
		word={null}
		bulkWords={bulkWordsToAdd}
		{level}
		{unit}
		onBulkSuccess={handleBulkAddSuccess}
	/>
{/if}

<!-- Bulk Confirmation Dialog -->
{#if bulkConfirmOpen}
	<div class="modal modal-open">
		<div class="modal-box max-w-sm">
			<h3 class="text-lg font-bold">Xác nhận</h3>
			<p class="py-4">{bulkConfirmMessage}</p>
			<div class="modal-action">
				<button type="button" class="btn btn-ghost" onclick={() => (bulkConfirmOpen = false)}>
					Hủy
				</button>
				<button type="button" class="btn btn-primary" onclick={bulkConfirmAction}>
					Xác nhận
				</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={() => (bulkConfirmOpen = false)}>close</button>
		</form>
	</div>
{/if}
