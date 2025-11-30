<script lang="ts">
	let { data } = $props();

	import Vocab from '$lib/components/vocab.svelte';
	import type { Dictionary } from '$lib/types/vocab';

	const level = data.level;
	const unit = data.unit;
	const kotobas = data.json as Dictionary;
</script>

<svelte:head>
	<title>{unit} - {level.toUpperCase()}</title>
</svelte:head>

<div class="">
	<Vocab kotobas={kotobas} level={level} unit={unit} />
</div>
