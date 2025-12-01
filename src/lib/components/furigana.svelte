<script lang="ts">
    import { fit } from 'furigana';
    const { text, reading } = $props();

    // Clean reading: remove [context～] patterns, then remove lone brackets
    function cleanReading(r: string | undefined): string | undefined {
        if (!r) return r;
        return r
            .replace(/\[[^\]]*～\]/g, '')
            .replace(/[\[\]]/g, '');
    }

    // Make calculation reactive with $derived.by
    const result = $derived.by(() => {
        const cleaned = cleanReading(reading);
        if (!cleaned) {
            return { error: false, obj: [] as { w: string; r?: string }[] };
        }
        try {
            const fitted = fit(text, cleaned, { type: 'object' }) ?? [];
            return { error: false, obj: fitted };
        } catch (e) {
            return { error: true, obj: [] as { w: string; r?: string }[] };
        }
    });
</script>

{#if result.error || result.obj.length === 0}
    {#if reading}
        <ruby>
            <rb>{text}</rb>
            <rp>(</rp><rt>{reading}</rt><rp>)</rp>
        </ruby>
    {:else}
        <span>{text}</span>
    {/if}
{:else}
    <span class="furigana-wrapper">{#each result.obj as { w, r }}<!--
        --><ruby>
            {#if w !== r}
                <rb>{w}</rb>
                <rp>(</rp><rt>{r}</rt><rp>)</rp>
            {:else}
                <rb>{w}</rb>
            {/if}
        </ruby><!--
    -->{/each}</span>
{/if}
