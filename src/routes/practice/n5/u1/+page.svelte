<script lang="ts">
    import MCQ from '$lib/components/mcq.svelte';
    import U1 from '$lib/n5/u1.json';

    const quesList = Object.keys(U1);
    const ansList = Object.values(U1).map((v) => v.vietnamese);
    const hintList = Object.values(U1).map((v) => v.phonetic);
</script>

<MCQ quesList={quesList} ansList={ansList} hintList={hintList} keyName="Từ/cụm từ" valueName="Tiếng Việt" />

