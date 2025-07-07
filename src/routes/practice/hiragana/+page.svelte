<script lang="ts">
    import MCQ from '$lib/components/old-mcq.svelte';
    import HiraganaJson from '$lib/writing/hiragana.json';
    const questions = Object.keys(HiraganaJson);
    const answers = Object.values(HiraganaJson);
</script>

<MCQ quesList={questions} ansList={answers} hintList={[]} swappable keyName="Hiragana" valueName="Romaji" />
