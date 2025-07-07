<script lang="ts">
    import MCQ from '$lib/components/old-mcq.svelte';
    import KatakanaJson from '$lib/writing/katakana.json';
    const questions = Object.keys(KatakanaJson);
    const answers = Object.values(KatakanaJson);

</script>

<MCQ quesList={questions} ansList={answers} hintList={[]} swappable keyName="Katakana" valueName="Romaji" />
