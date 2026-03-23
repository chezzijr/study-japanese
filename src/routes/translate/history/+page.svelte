<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import type { SavedTranslation } from '$lib/translate';
	import HistoryList from '$lib/components/translate/history-list.svelte';

	function handleSelect(translation: SavedTranslation) {
		goto(`${base}/translate?id=${translation.id}`);
	}
</script>

<svelte:head>
	<title>Lịch sử dịch - Study Japanese</title>
</svelte:head>

<main class="container mx-auto max-w-4xl p-4">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Lịch sử dịch</h1>
			<p class="mt-1 text-base-content/60">Xem lại các bản dịch trước đó</p>
		</div>
		<a href="{base}/translate" class="btn btn-ghost btn-sm">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="h-5 w-5 stroke-current"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 19l-7-7m0 0l7-7m-7 7h18"
				/>
			</svg>
			Quay lại
		</a>
	</div>

	<!-- History List -->
	<HistoryList onselect={handleSelect} />
</main>
