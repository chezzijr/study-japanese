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

<main class="container mx-auto max-w-4xl p-4">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Dịch thuật AI</h1>
			<p class="mt-1 text-base-content/60">Dịch văn bản tiếng Nhật sang tiếng Việt với AI</p>
		</div>
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

	<!-- Translator -->
	{#key translatorKey}
		<Translator {initialTranslation} />
	{/key}

	<!-- History Section -->
	<div class="divider mt-8"></div>

	<div class="collapse collapse-arrow bg-base-200">
		<input type="checkbox" bind:checked={showHistory} />
		<div class="collapse-title font-medium">Lịch sử dịch</div>
		<div class="collapse-content">
			{#if showHistory}
				<HistoryList onselect={handleHistorySelect} />
			{/if}
		</div>
	</div>
</main>
