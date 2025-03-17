<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

    import MCQ from '$lib/components/mcq.svelte';

    const level = data.level
    const json = data.json

    const quesList = Object.keys(json);
    const ansList = Object.values(json).map((v) => [].concat(v.kunyomi ?? []).concat(v.onyomi ?? []));
    const hintList = Object.values(json).map((v) => v.meanings.join(', '));
</script>
<svelte:head>
    <title>{level}</title>
</svelte:head>
<MCQ quesList={quesList} ansList={ansList} hintList={hintList} keyName="Kanji" valueName="Cách đọc" swappable={false} />