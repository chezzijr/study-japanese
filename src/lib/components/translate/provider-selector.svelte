<script lang="ts">
	import { onMount } from 'svelte';
	import type { AISettings, ProviderName } from '$lib/translate/types';
	import { getSettings, saveSettings } from '$lib/translate/storage';

	let {
		onsettingschange
	}: {
		onsettingschange: (settings: AISettings) => void;
	} = $props();

	let provider = $state<ProviderName>('claude');
	let apiKey = $state('');
	let showKey = $state(false);
	let saving = $state(false);
	let saved = $state(false);
	let settings = $state<AISettings | null>(null);

	// When provider changes, load the corresponding API key
	$effect(() => {
		if (settings) {
			apiKey = settings.keys[provider] ?? '';
		}
	});

	onMount(async () => {
		const loaded = await getSettings();
		if (loaded) {
			settings = loaded;
			provider = loaded.provider;
			apiKey = loaded.keys[loaded.provider] ?? '';
			onsettingschange(loaded);
		}
	});

	async function handleSave() {
		saving = true;
		try {
			const updated: AISettings = {
				id: 'default',
				provider,
				keys: {
					...(settings?.keys ?? {}),
					[provider]: apiKey
				}
			};
			await saveSettings(updated);
			settings = updated;
			onsettingschange(updated);
			saved = true;
			setTimeout(() => (saved = false), 2000);
		} finally {
			saving = false;
		}
	}

	const providers: { value: ProviderName; label: string }[] = [
		{ value: 'claude', label: 'Claude Haiku' },
		{ value: 'gemini', label: 'Gemini Flash' },
		{ value: 'openai', label: 'GPT-4o-mini' }
	];
</script>

<div class="flex flex-col gap-3">
	<!-- Provider dropdown -->
	<div class="form-control">
		<label class="label" for="provider-select">
			<span class="label-text">Nhà cung cấp AI</span>
		</label>
		<select
			id="provider-select"
			class="select select-bordered select-sm w-full"
			bind:value={provider}
		>
			{#each providers as p}
				<option value={p.value}>{p.label}</option>
			{/each}
		</select>
	</div>

	<!-- API key input -->
	<div class="form-control">
		<label class="label" for="api-key-input">
			<span class="label-text">API Key</span>
		</label>
		<div class="join w-full">
			<input
				id="api-key-input"
				type={showKey ? 'text' : 'password'}
				class="input input-bordered input-sm join-item w-full"
				placeholder="Nhập API key..."
				bind:value={apiKey}
			/>
			<button
				type="button"
				class="btn btn-sm btn-ghost join-item"
				onclick={() => (showKey = !showKey)}
				title={showKey ? 'Ẩn' : 'Hiện'}
			>
				{#if showKey}
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Save button -->
	<button
		type="button"
		class="btn btn-primary btn-sm"
		onclick={handleSave}
		disabled={saving || !apiKey.trim()}
	>
		{#if saving}
			<span class="loading loading-spinner loading-xs"></span>
		{:else if saved}
			Saved!
		{:else}
			Lưu cài đặt
		{/if}
	</button>

	<!-- Security notice -->
	<p class="text-xs opacity-50">
		API key được lưu cục bộ trên thiết bị của bạn và không bao giờ được gửi đi nơi khác.
	</p>
</div>
