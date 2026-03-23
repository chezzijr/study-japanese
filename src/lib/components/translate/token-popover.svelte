<script lang="ts">
	import type { Token } from '$lib/translate/types';
	import { onMount, tick } from 'svelte';

	let {
		token,
		anchorElement
	}: {
		token: Token;
		anchorElement: HTMLElement | null;
	} = $props();

	let popoverEl: HTMLElement | undefined = $state();
	let top = $state(0);
	let left = $state(0);
	let showAbove = $state(true);

	async function updatePosition() {
		if (!anchorElement || !popoverEl) return;

		await tick();

		const anchorRect = anchorElement.getBoundingClientRect();
		const popoverRect = popoverEl.getBoundingClientRect();
		const gap = 8;

		// Prefer above; fall below if not enough space
		if (anchorRect.top - popoverRect.height - gap < 0) {
			showAbove = false;
			top = anchorRect.bottom + gap + window.scrollY;
		} else {
			showAbove = true;
			top = anchorRect.top - popoverRect.height - gap + window.scrollY;
		}

		// Center horizontally, clamped to viewport
		let rawLeft = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2 + window.scrollX;
		const maxLeft = window.innerWidth - popoverRect.width - 8;
		rawLeft = Math.max(8, Math.min(rawLeft, maxLeft));
		left = rawLeft;
	}

	$effect(() => {
		if (anchorElement && popoverEl) {
			updatePosition();
		}
	});

	onMount(() => {
		updatePosition();
	});

	// Word type badge color
	function typeBadgeClass(type: string): string {
		if (type.startsWith('dong tu') || type.startsWith('động từ')) return 'badge-primary';
		if (type === 'danh từ') return 'badge-secondary';
		if (type.startsWith('tính từ')) return 'badge-accent';
		if (type === 'phó từ') return 'badge-info';
		if (type === 'trợ từ' || type === 'particle') return 'badge-warning';
		return 'badge-ghost';
	}
</script>

{#if anchorElement}
	<div
		bind:this={popoverEl}
		class="popover-container fixed z-50 w-72 rounded-lg border border-base-content/10 bg-neutral p-3 text-neutral-content shadow-xl"
		style:top="{top}px"
		style:left="{left}px"
		style:position="absolute"
		style:pointer-events="none"
	>
		<!-- Arrow indicator -->
		<div
			class="popover-arrow"
			class:popover-arrow-bottom={showAbove}
			class:popover-arrow-top={!showAbove}
		></div>

		<!-- Word section (always shown) -->
		<div class="mb-2">
			<div class="flex items-center gap-2">
				<span class="text-lg font-bold">{token.base_form}</span>
				{#if token.reading}
					<span class="text-sm opacity-70">{token.reading}</span>
				{/if}
			</div>
			<div class="mt-1 flex items-center gap-2">
				<span>{token.vn}</span>
				<span class="badge badge-sm {typeBadgeClass(token.type)}">{token.type}</span>
			</div>
		</div>

		<!-- Grammar section -->
		{#if token.grammar}
			<div class="mt-2 border-t border-base-content/10 pt-2">
				<div class="mb-1 text-xs font-semibold uppercase opacity-50">Ngữ pháp</div>
				<div class="text-sm">
					<span class="font-medium">{token.grammar.form}</span>
					<span class="opacity-80"> - {token.grammar.explanation}</span>
				</div>
			</div>
		{/if}

		<!-- Kanji section -->
		{#if token.kanji && token.kanji.length > 0}
			<div class="mt-2 border-t border-base-content/10 pt-2">
				<div class="mb-1 text-xs font-semibold uppercase opacity-50">Hán tự</div>
				<div class="flex flex-wrap gap-2">
					{#each token.kanji as k}
						<div class="flex items-center gap-1 rounded bg-base-content/10 px-2 py-0.5">
							<span class="text-lg font-bold">{k.char}</span>
							<div class="text-xs">
								<div class="font-medium">{k.hv}</div>
								<div class="opacity-70">{k.meaning}</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Context section -->
		{#if token.context}
			<div class="mt-2 border-t border-base-content/10 pt-2">
				<div class="mb-1 text-xs font-semibold uppercase opacity-50">Vai trò</div>
				<div class="text-sm opacity-80">{token.context}</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.popover-container {
		animation: popover-in 150ms ease-out;
	}

	@keyframes popover-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.popover-arrow {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
	}

	.popover-arrow-bottom {
		bottom: -6px;
		border-left: 6px solid transparent;
		border-right: 6px solid transparent;
		border-top: 6px solid oklch(var(--n));
	}

	.popover-arrow-top {
		top: -6px;
		border-left: 6px solid transparent;
		border-right: 6px solid transparent;
		border-bottom: 6px solid oklch(var(--n));
	}
</style>
