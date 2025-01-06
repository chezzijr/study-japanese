<script lang="ts">
    import MCQ from '$lib/components/mcq.svelte';
    import HiraganaJson from '$lib/writing/hiragana.json';
</script>

<MCQ map={HiraganaJson} keyName="Hiragana" valueName="Romaji" />
