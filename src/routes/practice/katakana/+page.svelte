<script lang="ts">
    import MCQ from '$lib/components/mcq.svelte';
    import KatakanaJson from '$lib/writing/katakana.json';
</script>

<MCQ map={KatakanaJson} keyName="Katakana" valueName="Romaji" />
