<script lang="ts">
    import MCQ from '$lib/components/mcq.svelte';
    import U3 from '$lib/n5/u3.json';

    const quesList = Object.keys(U3);
    const ansList = Object.values(U3).map((v) => v.vietnamese);
    const hintList = Object.values(U3).map((v) => v.phonetic);
</script>

<MCQ quesList={quesList} ansList={ansList} hintList={hintList} keyName="Từ/cụm từ" valueName="Tiếng Việt" />

