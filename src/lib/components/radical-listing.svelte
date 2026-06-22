<script lang="ts">
	import type { RadicalInfo } from '$lib/types/kanji';

	type RadicalRow = RadicalInfo & { examples: string[] };

	let { radicals }: { radicals: RadicalRow[] } = $props();

	// Strip Vietnamese diacritics so "thuy" matches "THỦY", "dien" matches "ĐIỀN".
	function normalizeVi(s: string): string {
		return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
	}

	let searchTerm = $state('');

	function matchesSearch(r: RadicalRow, term: string): boolean {
		if (!term.trim()) return true;
		const raw = term.toLowerCase().trim();
		const norm = normalizeVi(term);

		// Direct character match (radical or its variants)
		if (r.radical.includes(raw)) return true;
		if (r.variants?.some((v) => v.includes(raw))) return true;

		// Hán-Việt name / Vietnamese meaning, diacritic-insensitive
		if (normalizeVi(r.hanViet).includes(norm)) return true;
		if (normalizeVi(r.meaning).includes(norm)) return true;

		// Stroke count
		if (String(r.strokes) === raw) return true;

		return false;
	}

	let filtered = $derived(radicals.filter((r) => matchesSearch(r, searchTerm)));
</script>

<div class="flex h-[90vh] flex-col">
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
				placeholder="Tìm kiếm (bộ thủ, âm HV, nghĩa, số nét)..."
				class="input input-sm input-bordered w-full max-w-md"
				bind:value={searchTerm}
			/>
		</div>
		<div class="badge badge-neutral">
			{filtered.length} / {radicals.length}
		</div>
	</div>

	<!-- Table -->
	<div class="flex-1 overflow-auto rounded-b-box border border-base-content/5 bg-base-100">
		<table class="table table-zebra table-pin-rows">
			<thead class="text-base">
				<tr>
					<th class="w-16 text-center">Bộ thủ</th>
					<th class="w-24">Âm HV</th>
					<th class="w-auto">Nghĩa</th>
					<th class="w-16 text-center">Số nét</th>
					<th class="w-24 text-center">Dị thể</th>
					<th class="w-auto">Kanji ví dụ</th>
				</tr>
			</thead>
			<tbody>
				{#each filtered as r}
					<tr class="hover:bg-base-300">
						<td class="text-center text-3xl font-bold text-primary">{r.radical}</td>
						<td class="font-medium">{r.hanViet}</td>
						<td class="text-base-content/80">{r.meaning}</td>
						<td class="text-center">{r.strokes}</td>
						<td class="text-center text-lg text-base-content/70">
							{r.variants && r.variants.length > 0 ? r.variants.join(' ') : '-'}
						</td>
						<td class="text-lg">
							{#if r.examples.length > 0}
								<div class="flex flex-wrap gap-1">
									{#each r.examples.slice(0, 12) as k}
										<span class="text-base-content/80">{k}</span>
									{/each}
									{#if r.examples.length > 12}
										<span class="text-sm text-base-content/50">+{r.examples.length - 12}</span>
									{/if}
								</div>
							{:else}
								<span class="text-base-content/40">-</span>
							{/if}
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="py-8 text-center text-base-content/50">
							Không tìm thấy kết quả cho "{searchTerm}"
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
