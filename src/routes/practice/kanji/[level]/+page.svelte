<script lang="ts">
	import MCQ from '$lib/components/mcq.svelte';
	let { data }: { data: { level: string; json: any[] } } = $props();
	const { level, json } = data;
</script>

<svelte:head>
	<title>{level}</title>
</svelte:head>
<MCQ kotobas={json} />
