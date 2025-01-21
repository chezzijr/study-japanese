<script lang="ts">
    import MCQ from '$lib/components/mcq.svelte';
    import U1 from '$lib/n5/u1.json';

    const u1 = {}
    Object
        .entries(U1)
        .forEach(([key, value]) => { 
            u1[key] = value.vietnamese
        });
</script>

<MCQ map={u1} keyName="từ/cụm từ" valueName="Tiếng Việt" />

