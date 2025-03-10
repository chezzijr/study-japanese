<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

    import Vocab from '$lib/components/vocab.svelte';

    const u = data.unit
    const json = data.json

    const quesList = Object.keys(json);
    const ansList = Object.values(json).map((v) => v.vietnamese);
    const hintList = Object.values(json).map((v) => v.phonetic);
    const noteList = Object.values(json).map((v) => v.note);
</script>
<svelte:head>
    <title>{u}</title>
</svelte:head>

<div class="mx-10 my-6">
    <Vocab words={quesList} phonetics={hintList} meanings={ansList} notes={noteList} />
</div>