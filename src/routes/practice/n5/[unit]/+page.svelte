<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

    import MCQ from '$lib/components/mcq.svelte';

    const u = data.unit
    const json = data.json

    const quesList = Object.keys(json);
    const ansList = Object.values(json).map((v) => v.vietnamese);
    const hintList = Object.values(json).map((v) => v.phonetic);
</script>
<svelte:head>
    <title>{u}</title>
</svelte:head>
<MCQ quesList={quesList} ansList={ansList} hintList={hintList} keyName="Từ/cụm từ" valueName="Tiếng Việt" />

