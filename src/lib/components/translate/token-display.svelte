<script lang="ts">
	import type { Token } from '$lib/translate/types';

	let {
		token,
		tokenKey,
		color,
		isHighlighted = false,
		isDimmed = false,
		onmouseenter,
		onmouseleave
	}: {
		token: Token;
		tokenKey: string;
		color: string;
		isHighlighted?: boolean;
		isDimmed?: boolean;
		onmouseenter?: (key: string, el: HTMLElement) => void;
		onmouseleave?: () => void;
	} = $props();
</script>

<span
	class="token-span inline-block cursor-pointer rounded px-1 py-0.5 transition-all duration-200"
	class:token-highlighted={isHighlighted}
	class:token-dimmed={isDimmed}
	role="button"
	tabindex="0"
	data-id={tokenKey}
	style:border-bottom="2px solid {color}"
	style:background-color="{color}18"
	style:--token-color={color}
	onmouseenter={(e) => onmouseenter?.(tokenKey, e.currentTarget as HTMLElement)}
	onmouseleave={() => onmouseleave?.()}
>
	{token.jp || token.vn}
</span>

<style>
	.token-span {
		user-select: none;
	}

	.token-highlighted {
		transform: translateY(-3px);
		background-color: color-mix(in srgb, var(--token-color) 30%, transparent) !important;
		box-shadow: 0 2px 8px color-mix(in srgb, var(--token-color) 40%, transparent);
	}

	.token-dimmed {
		opacity: 0.35;
	}
</style>
