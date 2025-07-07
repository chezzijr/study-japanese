<script lang="ts">
	let { data } = $props();

	import MCQ from '$lib/components/mcq.svelte';

	import type { DictionaryV2 } from '$lib/types/vocab';

	const u = data.unit;
	const kotobas = data.json as DictionaryV2;
</script>

<svelte:head>
	<title>{u}</title>
</svelte:head>

<MCQ kotobas={kotobas} />
