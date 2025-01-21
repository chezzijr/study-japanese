<script lang="ts">
    import MCQ from '$lib/components/mcq.svelte';
    import U4 from '$lib/n5/u4.json';

    const quesList = Object.keys(U4);
    const ansList = Object.values(U4).map((v) => v.vietnamese);
    const hintList = Object.values(U4).map((v) => v.phonetic);
</script>

<MCQ quesList={quesList} ansList={ansList} hintList={hintList} keyName="Từ/cụm từ" valueName="Tiếng Việt" />

