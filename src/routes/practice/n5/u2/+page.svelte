<script lang="ts">
    import MCQ from '$lib/components/mcq.svelte';
    import U2 from '$lib/n5/u2.json';

    const quesList = Object.keys(U2);
    const ansList = Object.values(U2).map((v) => v.vietnamese);
    const hintList = Object.values(U2).map((v) => v.phonetic);
</script>

<MCQ quesList={quesList} ansList={ansList} hintList={hintList} keyName="Từ/cụm từ" valueName="Tiếng Việt" />
