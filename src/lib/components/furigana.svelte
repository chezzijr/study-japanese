<script lang="ts">
	import { fit } from 'furigana';
	const { text, reading } = $props();
    let error = $state(false);
    let obj: { w: string; r?: string }[] = $state([]);
    try {
        obj = fit(text, reading, { type: 'object' }) ?? [];
    } catch (e) {
        error = true;
    }

</script>

{#if error || obj.length === 0}
    <span>${text} (${reading})</span>
{:else}
    {#each obj as { w, r }}
        <ruby>
            {#if r}
                <rb>{w}</rb>
                <rp>(</rp><rt>{r}</rt><rp>)</rp>
            {:else}
                <rb>{w}</rb>
            {/if}
        </ruby>
    {/each}
{/if}
