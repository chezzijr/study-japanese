<script lang="ts">
	import KanjiListing from '$lib/components/kanji-listing.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Kanji {data.level.toUpperCase()} - Danh sách</title>
</svelte:head>

<main class="container mx-auto p-4">
	<h1 class="mb-4 text-3xl font-bold">Kanji {data.level.toUpperCase()}</h1>
	<KanjiListing kanjis={data.kanjis} level={data.level} />
</main>
