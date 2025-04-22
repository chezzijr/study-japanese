<script lang="ts">
	import { fit } from 'furigana';
	const { text, reading } = $props();
	const obj = fit(text, reading, { type: 'object' }) ?? [];
</script>

{#each obj as { w, r }}
    <ruby>
        {#if w !== r}
            <rb>{w}</rb>
            <rp>(</rp><rt>{r}</rt><rp>)</rp>
        {:else}
            <span>{w}</span>
        {/if}
    </ruby>
{/each}