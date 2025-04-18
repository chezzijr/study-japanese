<script lang="ts">
	let { data } = $props();

    import Vocab from '$lib/components/vocab.svelte';
	import type { Dictionary } from '$lib/types/vocab';

    const u = data.unit
    const json = data.json as Dictionary;

    const wordsList = Object.keys(json);
    const vietnameseList = Object.values(json).map((v) => v.vietnamese);
    const pronunciationsList = Object.values(json).map((v) => v.pronunciation);
    const noteList = Object.values(json).map((v) => v.note);
</script>
<svelte:head>
    <title>{u}</title>
</svelte:head>

<div class="">
    <Vocab words={wordsList} pronunciations={pronunciationsList} meanings={vietnameseList} notes={noteList} />
</div>