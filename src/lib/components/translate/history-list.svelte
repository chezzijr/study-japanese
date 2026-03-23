<script lang="ts">
	import { onMount } from 'svelte';
	import type { SavedTranslation } from '$lib/translate/types';
	import { getTranslations, deleteTranslation } from '$lib/translate/storage';

	let {
		onselect
	}: {
		onselect: (translation: SavedTranslation) => void;
	} = $props();

	let translations = $state<SavedTranslation[]>([]);
	let loading = $state(true);
	let searchTerm = $state('');
	let deletingId = $state<string | null>(null);

	let filtered = $derived(
		searchTerm.trim()
			? translations.filter((t) => t.sourceText.toLowerCase().includes(searchTerm.toLowerCase()))
			: translations
	);

	onMount(async () => {
		try {
			translations = await getTranslations(50);
		} catch (e) {
			console.error('Failed to load translations:', e);
		} finally {
			loading = false;
		}
	});

	async function handleDelete(id: string, event: MouseEvent) {
		event.stopPropagation();
		deletingId = id;
		try {
			await deleteTranslation(id);
			translations = translations.filter((t) => t.id !== id);
		} catch (e) {
			console.error('Failed to delete translation:', e);
		} finally {
			deletingId = null;
		}
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString('vi-VN', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	const providerLabels: Record<string, string> = {
		claude: 'Claude Sonnet',
		gemini: 'Gemini Flash',
		openai: 'GPT-4o-mini'
	};
</script>

<div class="flex flex-col gap-3">
	<!-- Search -->
	<div class="flex items-center gap-2">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			class="h-5 w-5 stroke-current opacity-70"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
		<input
			type="text"
			placeholder="Tìm kiếm..."
			class="input input-sm input-bordered w-full"
			bind:value={searchTerm}
		/>
	</div>

	<!-- List -->
	{#if loading}
		<div class="flex justify-center py-8">
			<span class="loading loading-spinner loading-md"></span>
		</div>
	{:else if filtered.length === 0}
		<div class="py-8 text-center opacity-50">
			{#if searchTerm.trim()}
				Khong tim thay ket qua cho "{searchTerm}"
			{:else}
				Chua co ban dich nao
			{/if}
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			{#each filtered as item (item.id)}
				<div
					class="card card-compact cursor-pointer bg-base-200 transition-colors hover:bg-base-300"
					role="button"
					tabindex="0"
					onclick={() => onselect(item)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							onselect(item);
						}
					}}
				>
					<div class="card-body flex-row items-center gap-3 p-3">
						<div class="min-w-0 flex-1">
							<p class="line-clamp-1 break-all font-medium">{item.sourceText}</p>
							<div class="mt-1 flex items-center gap-2 text-xs opacity-50">
								<span class="badge badge-ghost badge-xs"
									>{providerLabels[item.provider] ?? item.provider}</span
								>
								<span>{formatDate(item.createdAt)}</span>
							</div>
						</div>
						<button
							type="button"
							class="btn btn-ghost btn-xs text-error"
							onclick={(e) => handleDelete(item.id, e)}
							disabled={deletingId === item.id}
							title="Xoa"
						>
							{#if deletingId === item.id}
								<span class="loading loading-spinner loading-xs"></span>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
									class="h-4 w-4"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
									/>
								</svg>
							{/if}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
