<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { SavedTranslation } from '$lib/translate';
	import { getTranslation } from '$lib/translate';
	import Translator from '$lib/components/translate/translator.svelte';
	import HistoryList from '$lib/components/translate/history-list.svelte';

	let initialTranslation = $state<SavedTranslation | undefined>(undefined);
	let showHistory = $state(false);
	let translatorKey = $state(0);

	onMount(async () => {
		// Check for translation ID in query params
		const id = $page.url.searchParams.get('id');
		if (id) {
			try {
				const saved = await getTranslation(id);
				if (saved) {
					initialTranslation = saved;
				}
			} catch (e) {
				console.error('Failed to load translation:', e);
			}
		}
	});

	function handleHistorySelect(translation: SavedTranslation) {
		initialTranslation = translation;
		translatorKey++;
		showHistory = false;
	}
</script>

<svelte:head>
	<title>Dịch thuật AI - Study Japanese</title>
</svelte:head>

<div class="drawer drawer-end">
	<input id="history-drawer" type="checkbox" class="drawer-toggle" bind:checked={showHistory} />
	<div class="drawer-content">
		<main class="container mx-auto max-w-4xl p-4">
			<!-- Header -->
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold">Dịch thuật AI</h1>
					<p class="mt-1 text-base-content/60">
						Dịch văn bản tiếng Nhật sang tiếng Việt với AI
					</p>
				</div>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="btn btn-ghost btn-sm"
						onclick={() => (showHistory = true)}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="h-5 w-5"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						Lịch sử
					</button>
					<a href="{base}/" class="btn btn-ghost btn-sm">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							class="h-5 w-5 stroke-current"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
						Trang chủ
					</a>
				</div>
			</div>

			<!-- Translator -->
			{#key translatorKey}
				<Translator {initialTranslation} />
			{/key}
		</main>
	</div>
	<div class="drawer-side z-20">
		<label for="history-drawer" class="drawer-overlay" aria-label="close sidebar"></label>
		<div class="menu bg-base-200 text-base-content min-h-full w-80 p-4">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-bold">Lịch sử dịch</h2>
				<button
					type="button"
					class="btn btn-ghost btn-sm btn-circle"
					onclick={() => (showHistory = false)}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="h-5 w-5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
			{#if showHistory}
				<HistoryList onselect={handleHistorySelect} />
			{/if}
		</div>
	</div>
</div>
