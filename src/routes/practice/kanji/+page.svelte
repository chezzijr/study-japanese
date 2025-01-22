<script lang="ts">
    import MCQ from '$lib/components/mcq.svelte';
    import U1 from '$lib/n5/u1.json';
    import U2 from '$lib/n5/u2.json';
    import U3 from '$lib/n5/u3.json';
    import U4 from '$lib/n5/u4.json';

    // peak readability
    const obj = {...U1, ...U2, ...U3, ...U4};
    const filteredObj = Object.entries(obj).filter(([key, value]) => value.phonetic);
    const quesList = filteredObj.map(([key, value]) => key);
    const ansList = filteredObj.map(([key, value]) => value.vietnamese);
    const hintList = filteredObj.map(([key, value]) => value.phonetic);
</script>

<MCQ quesList={quesList} ansList={ansList} hintList={hintList} keyName="Kanji" valueName="Tiếng Việt" />

