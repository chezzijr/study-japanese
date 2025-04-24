<script lang="ts">
	let { data } = $props();

    import MCQ from '$lib/components/mcq.svelte';
	import type { Dictionary } from '$lib/types/vocab';

    const u = data.unit
    const json = data.json as Dictionary;

    const quesList = Object.keys(json);
    const ansList = Object.values(json).map((v) => v.vietnamese);
    const hintList = Object.values(json).map((v) => v.pronunciation);
</script>
<svelte:head>
    <title>{u}</title>
</svelte:head>
<MCQ quesList={quesList} ansList={ansList} hintList={hintList} keyName="Tiếng Việt" valueName="Từ/Cụm từ" swappable={true} />