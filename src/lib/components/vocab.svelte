<script lang="ts">
	import type { Dictionary, WordDefinition } from '$lib/types/vocab';
	import { toHiragana, toKatakana } from 'wanakana';
	import AddToDeckModal from './flashcard/add-to-deck-modal.svelte';

	let { kotobas, level = '', unit = '' }: { kotobas: Dictionary; level?: string; unit?: string } = $props();

	// Flashcard integration state
	let modalOpen = $state(false);
	let selectedWord = $state<WordDefinition | null>(null);

	function openAddModal(word: WordDefinition) {
		selectedWord = word;
		modalOpen = true;
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

	let filteredKotobas = $derived(
		kotobas.filter(kotoba => matchesSearch(kotoba, searchTerm))
	);
</script>

<div class="flex flex-col h-[95vh]">
	<!-- Search bar -->
	<div class="flex items-center justify-between gap-4 p-4 bg-base-200 rounded-t-box">
		<div class="flex items-center gap-2 flex-1">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-5 h-5 stroke-current opacity-70">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
			</svg>
			<input
				type="text"
				placeholder="Tìm kiếm (kanji, hiragana, romaji, nghĩa)..."
				class="input input-bordered input-sm w-full max-w-md"
				bind:value={searchTerm}
			/>
		</div>
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
						<td class="text-base-content/60 text-sm">{kotoba.note ?? ''}</td>
						{#if level && unit}
							<td>
								<button
									type="button"
									class="btn btn-ghost btn-xs"
									title="Thêm vào Flashcard"
									onclick={() => openAddModal(kotoba)}
								>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
									</svg>
								</button>
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
	/>
{/if}
