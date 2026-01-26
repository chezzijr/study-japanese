<script lang="ts">
	import { onMount } from 'svelte';
	import { toHiragana, toKatakana } from 'wanakana';
	import AddKanjiToDeckModal from './flashcard/add-kanji-to-deck-modal.svelte';
	import KanjiPracticeModal from './kanji-practice-modal.svelte';
	import { getAllCards, getAllDecks, deleteCard, type KanjiData } from '$lib/flashcard';

	interface KanjiItem {
		word: string;
		meaning: string;
		kunyomi: string[];
		onyomi: string[];
		radicals?: string;
		examples?: Array<{
			word: string;
			reading: string;
			meaning: string;
			special_case?: boolean;
		}>;
	}

	let { kanjis, level = '' }: { kanjis: KanjiItem[]; level?: string } = $props();

	// Flashcard integration state
	let modalOpen = $state(false);
	let selectedKanji = $state<KanjiData | null>(null);

	function toKanjiData(item: KanjiItem): KanjiData {
		return {
			word: item.word,
			meaning: item.meaning,
			kunyomi: item.kunyomi,
			onyomi: item.onyomi,
			radicals: item.radicals
		};
	}

	function openAddModal(kanji: KanjiItem) {
		selectedKanji = toKanjiData(kanji);
		modalOpen = true;
	}

	// Kanji lookup state for duplicate detection
	type KanjiLookupInfo = { cardId: string; deckId: string; deckName: string };
	let kanjiLookup = $state<Map<string, KanjiLookupInfo>>(new Map());
	let lookupLoading = $state(true);

	// Remove dialog state
	let removeDialogOpen = $state(false);
	let kanjiToRemove = $state<KanjiItem | null>(null);
	let cardToRemove = $state<KanjiLookupInfo | null>(null);
	let removing = $state(false);

	// Expanded examples state
	let expandedKanji = $state<Set<string>>(new Set());

	// Practice modal state
	let practiceModalOpen = $state(false);
	let practiceKanji = $state<{ word: string; meaning: string } | null>(null);

	function openPracticeModal(kanji: KanjiItem) {
		practiceKanji = { word: kanji.word, meaning: kanji.meaning };
		practiceModalOpen = true;
	}

	function makeKey(lvl: string, kanji: string): string {
		return `${lvl}|${kanji}`;
	}

	onMount(async () => {
		if (!level) {
			lookupLoading = false;
			return;
		}

		try {
			const [cards, decks] = await Promise.all([getAllCards(), getAllDecks()]);
			const deckNames = new Map(decks.map((d) => [d.id, d.name]));

			const lookup = new Map<string, KanjiLookupInfo>();
			for (const card of cards) {
				if (card.source.type === 'kanji') {
					const src = card.source as { type: 'kanji'; level: string; kanji: string };
					lookup.set(makeKey(src.level, src.kanji), {
						cardId: card.id,
						deckId: card.deckId,
						deckName: deckNames.get(card.deckId) ?? 'Unknown'
					});
				}
			}
			kanjiLookup = lookup;
		} catch (e) {
			console.error('Failed to load kanji lookup:', e);
		} finally {
			lookupLoading = false;
		}
	});

	function openRemoveDialog(kanji: KanjiItem, info: KanjiLookupInfo) {
		kanjiToRemove = kanji;
		cardToRemove = info;
		removeDialogOpen = true;
	}

	async function handleRemove() {
		if (!cardToRemove || !kanjiToRemove) return;

		removing = true;
		try {
			await deleteCard(cardToRemove.cardId);
			kanjiLookup.delete(makeKey(level, kanjiToRemove.word));
			kanjiLookup = new Map(kanjiLookup); // trigger reactivity
			removeDialogOpen = false;
		} catch (e) {
			console.error('Failed to remove card:', e);
		} finally {
			removing = false;
			kanjiToRemove = null;
			cardToRemove = null;
		}
	}

	function handleAddSuccess(cardId: string, deckId: string, deckName: string) {
		if (selectedKanji) {
			kanjiLookup.set(makeKey(level, selectedKanji.word), {
				cardId,
				deckId,
				deckName
			});
			kanjiLookup = new Map(kanjiLookup); // trigger reactivity
		}
	}

	function toggleExpanded(kanji: string) {
		if (expandedKanji.has(kanji)) {
			expandedKanji.delete(kanji);
		} else {
			expandedKanji.add(kanji);
		}
		expandedKanji = new Set(expandedKanji); // trigger reactivity
	}

	let searchTerm = $state('');

	// Filter function that searches across kanji, meaning, readings, and radicals
	function matchesSearch(kanji: KanjiItem, term: string): boolean {
		if (!term.trim()) return true;

		const normalizedTerm = term.toLowerCase().trim();

		// 1. Direct kanji match
		if (kanji.word.includes(normalizedTerm)) return true;

		// 2. Meaning match (Sino-Vietnamese, case-insensitive)
		if (kanji.meaning.toLowerCase().includes(normalizedTerm)) return true;

		// 3. Onyomi match
		if (kanji.onyomi.some((r) => r.includes(normalizedTerm))) return true;

		// 4. Kunyomi match
		if (kanji.kunyomi.some((r) => r.includes(normalizedTerm))) return true;

		// 5. Radicals match
		if (kanji.radicals?.includes(normalizedTerm)) return true;

		// 6. Romaji to kana conversion
		try {
			const asHiragana = toHiragana(normalizedTerm);
			const asKatakana = toKatakana(normalizedTerm);

			if (kanji.onyomi.some((r) => r.includes(asKatakana))) return true;
			if (kanji.kunyomi.some((r) => r.includes(asHiragana))) return true;
		} catch {
			// Invalid romaji input, skip conversion
		}

		return false;
	}

	let filteredKanjis = $derived(kanjis.filter((k) => matchesSearch(k, searchTerm)));
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
				placeholder="Tìm kiếm (kanji, âm HV, onyomi, kunyomi, romaji)..."
				class="input input-sm input-bordered w-full max-w-md"
				bind:value={searchTerm}
			/>
		</div>
		<div class="badge badge-neutral">
			{filteredKanjis.length} / {kanjis.length}
		</div>
	</div>

	<!-- Table container -->
	<div class="flex-1 overflow-auto rounded-b-box border border-base-content/5 bg-base-100">
		<table class="table table-zebra table-pin-rows text-center">
			<thead class="text-lg">
				<tr>
					<th class="w-16">Kanji</th>
					<th class="w-24">Âm HV</th>
					<th class="w-32">Onyomi</th>
					<th class="w-32">Kunyomi</th>
					<th class="w-16">Bộ thủ</th>
					<th class="w-auto">Ví dụ</th>
					{#if level}
						<th class="w-12"></th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each filteredKanjis as kanji}
					<tr class="hover:bg-base-300">
						<td class="text-3xl font-bold text-primary">{kanji.word}</td>
						<td class="font-medium">{kanji.meaning}</td>
						<td class="text-sm text-base-content/80">{kanji.onyomi.join(', ') || '-'}</td>
						<td class="text-sm text-base-content/80">{kanji.kunyomi.join(', ') || '-'}</td>
						<td class="text-xl">{kanji.radicals || '-'}</td>
						<td class="text-left text-sm">
							{#if kanji.examples && kanji.examples.length > 0}
								{@const isExpanded = expandedKanji.has(kanji.word)}
								{@const displayExamples = isExpanded ? kanji.examples : kanji.examples.slice(0, 2)}
								<div class="flex flex-col gap-1">
									{#each displayExamples as ex}
										<div class="flex items-baseline gap-2">
											<span class="font-medium">{ex.word}</span>
											<span class="text-base-content/60">({ex.reading})</span>
											<span class="text-base-content/80">- {ex.meaning}</span>
										</div>
									{/each}
									{#if kanji.examples.length > 2}
										<button
											type="button"
											class="btn btn-ghost btn-xs self-start"
											onclick={() => toggleExpanded(kanji.word)}
										>
											{isExpanded ? 'Thu gọn' : `+${kanji.examples.length - 2} ví dụ khác`}
										</button>
									{/if}
								</div>
							{:else}
								<span class="text-base-content/50">-</span>
							{/if}
						</td>
						{#if level}
							<td>
								<div class="flex items-center justify-center gap-1">
									<!-- Practice Writing Button -->
									<button
										type="button"
										class="btn btn-ghost btn-xs"
										title="Luyện viết"
										aria-label="Luyện viết kanji {kanji.word}"
										onclick={() => openPracticeModal(kanji)}
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
												d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
											/>
										</svg>
									</button>

									<!-- Flashcard Buttons -->
									{#if lookupLoading}
										<span class="loading loading-spinner loading-xs"></span>
									{:else}
										{@const existing = kanjiLookup.get(makeKey(level, kanji.word))}
										{#if existing}
											<div class="tooltip" data-tip="Trong: {existing.deckName}">
												<button
													type="button"
													class="btn btn-ghost btn-xs text-error"
													title="Xóa khỏi Flashcard"
													onclick={() => openRemoveDialog(kanji, existing)}
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
												onclick={() => openAddModal(kanji)}
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
								</div>
							</td>
						{/if}
					</tr>
				{:else}
					<tr>
						<td colspan={level ? 7 : 6} class="py-8 text-center text-base-content/50">
							Không tìm thấy kết quả cho "{searchTerm}"
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Add to Deck Modal -->
{#if level}
	<AddKanjiToDeckModal
		bind:open={modalOpen}
		kanji={selectedKanji}
		{level}
		onSuccess={handleAddSuccess}
	/>
{/if}

<!-- Remove Confirmation Dialog -->
{#if removeDialogOpen && kanjiToRemove && cardToRemove}
	<div class="modal modal-open">
		<div class="modal-box max-w-sm">
			<h3 class="text-lg font-bold">Xác nhận xóa</h3>
			<p class="py-4">
				Xóa kanji <strong class="text-2xl">"{kanjiToRemove.word}"</strong> khỏi bộ thẻ
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

<!-- Kanji Practice Modal -->
{#if practiceKanji}
	<KanjiPracticeModal
		bind:open={practiceModalOpen}
		kanji={practiceKanji.word}
		meaning={practiceKanji.meaning}
	/>
{/if}
