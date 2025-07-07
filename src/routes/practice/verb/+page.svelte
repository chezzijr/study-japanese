<script lang="ts">
	let { data } = $props();

	import MCQ from '$lib/components/mcq.svelte';
	import type { Dictionary } from '$lib/types/vocab';

	const u = data.unit;
	const kotobas = data.json as Dictionary;
</script>

<svelte:head>
	<title>{u}</title>
</svelte:head>
<MCQ {kotobas} />

