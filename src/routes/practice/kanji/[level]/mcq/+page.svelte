<script lang="ts">
	import KanjiMCQ from '$lib/components/kanji-mcq.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Kanji MCQ - {data.level.toUpperCase()}</title>
</svelte:head>

<KanjiMCQ kanjis={data.kanjis} />
