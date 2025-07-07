<script lang="ts">
	import type { DictionaryV2 } from '$lib/types/vocab';

	// let { words, pronunciations, meanings, notes } = $props()
	let { kotobas }: { kotobas: DictionaryV2 } = $props();
</script>

<div class="h-[95vh] overflow-x-auto rounded-box border border-base-content/5 bg-base-100 px-20">
	<table class="table table-pin-rows text-center">
		<thead class="text-2xl">
			<tr>
				<th>Từ</th>
				<th>Phiên âm Hiragana</th>
				<th>Nghĩa</th>
				<th>Ghi chú</th>
			</tr>
			<!-- <tr id="filter">
                <th><input type="text"></th>
            </tr> -->
		</thead>
		<tbody>
			{#each kotobas as kotoba}
				<tr class="hover:bg-base-300">
					<td>{kotoba.word}</td>
					<td>{kotoba.reading}</td>
					<td>{kotoba.meaning}</td>
					<td>{kotoba.note}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

