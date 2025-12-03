<script lang="ts">
	/**
	 * Create New Deck Page
	 */

	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import DeckForm from '$lib/components/flashcard/deck-form.svelte';
	import { createDeck, type DeckSettings } from '$lib/flashcard';

	let error = $state<string | null>(null);
	let saving = $state(false);

	async function handleSave(data: { name: string; description?: string; settings: DeckSettings }) {
		try {
			saving = true;
			error = null;

			const deck = await createDeck(data.name, data.description, data.settings);

			// Navigate to the new deck
			await goto(`${base}/flashcard/deck/${deck.id}`);
		} catch (e) {
			console.error('Failed to create deck:', e);
			error = 'Không thể tạo bộ thẻ. Vui lòng thử lại.';
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		goto(`${base}/flashcard`);
	}
</script>

<svelte:head>
	<title>Tạo bộ thẻ mới - Flashcard</title>
</svelte:head>

<main class="container mx-auto max-w-xl p-4">
	<!-- Header -->
	<div class="mb-6">
		<a href="{base}/flashcard" class="btn btn-ghost btn-sm mb-4 gap-1">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="h-4 w-4 stroke-current"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Quay lại
		</a>
		<h1 class="text-2xl font-bold">Tạo bộ thẻ mới</h1>
	</div>

	<!-- Error -->
	{#if error}
		<div class="alert alert-error mb-4">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 shrink-0 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span>{error}</span>
		</div>
	{/if}

	<!-- Form -->
	<div class="card bg-base-200">
		<div class="card-body">
			{#if saving}
				<div class="flex items-center justify-center py-10">
					<span class="loading loading-spinner loading-lg"></span>
				</div>
			{:else}
				<DeckForm onSave={handleSave} onCancel={handleCancel} />
			{/if}
		</div>
	</div>
</main>
