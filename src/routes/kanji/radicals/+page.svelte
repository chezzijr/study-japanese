<script lang="ts">
	import RadicalListing from '$lib/components/radical-listing.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Bộ thủ - Danh sách 214 bộ thủ Kanji</title>
</svelte:head>

<main class="container mx-auto p-4">
	<h1 class="mb-1 text-3xl font-bold">Bộ thủ (214 bộ)</h1>
	<p class="mb-4 text-base-content/70">
		Tra cứu các bộ thủ Kanji: âm Hán-Việt, ý nghĩa, số nét và kanji ví dụ.
	</p>
	<RadicalListing radicals={data.radicals} />
</main>
