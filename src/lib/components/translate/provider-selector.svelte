<script lang="ts">
	import { onMount } from 'svelte';
	import type { AISettings } from '$lib/translate/types';
	import { MODEL_REGISTRY, getProviderForModel } from '$lib/translate/models';
	import type { ModelOption, ProviderName } from '$lib/translate/models';
	import { getSettings, saveSettings } from '$lib/translate/storage';

	let {
		onsettingschange,
		onsaved
	}: {
		onsettingschange: (settings: AISettings) => void;
		onsaved?: () => void;
	} = $props();

	let translationModel = $state('gemini-2.5-flash-lite');
	let tokenizationModel = $state('claude-sonnet-4-6');
	let keys = $state<Record<string, string>>({ claude: '', gemini: '', openai: '' });
	let saving = $state(false);
	let saved = $state(false);
	let settings = $state<AISettings | null>(null);

	// Determine which providers need keys based on selected models
	let requiredProviders = $derived.by(() => {
		const providers = new Set<ProviderName>();
		try {
			providers.add(getProviderForModel(translationModel));
		} catch {
			/* unknown model */
		}
		try {
			providers.add(getProviderForModel(tokenizationModel));
		} catch {
			/* unknown model */
		}
		return providers;
	});

	// Provider color dots for model dropdown
	function providerDot(provider: ProviderName): string {
		switch (provider) {
			case 'gemini':
				return '\u{1F7E2}';
			case 'claude':
				return '\u{1F7E3}';
			case 'openai':
				return '\u{1F535}';
		}
	}

	function modelLabel(m: ModelOption): string {
		return `${providerDot(m.provider)} ${m.label} (${m.inputPrice}/${m.outputPrice})`;
	}

	onMount(async () => {
		const loaded = await getSettings();
		if (loaded) {
			settings = loaded;
			translationModel = loaded.translationModel;
			tokenizationModel = loaded.tokenizationModel;
			keys = {
				claude: loaded.keys.claude ?? '',
				gemini: loaded.keys.gemini ?? '',
				openai: loaded.keys.openai ?? ''
			};
			onsettingschange(loaded);
		}
	});

	async function handleSave() {
		saving = true;
		try {
			const updated: AISettings = {
				id: 'default',
				translationModel,
				tokenizationModel,
				keys: {
					claude: keys.claude || undefined,
					gemini: keys.gemini || undefined,
					openai: keys.openai || undefined
				}
			};
			await saveSettings(updated);
			settings = updated;
			onsettingschange(updated);
			onsaved?.();
			saved = true;
			setTimeout(() => (saved = false), 2000);
		} finally {
			saving = false;
		}
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Two model dropdowns side by side -->
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<!-- Translation model -->
		<div class="form-control">
			<label class="label" for="translation-model">
				<span class="label-text text-xs uppercase opacity-60">Model dịch</span>
			</label>
			<select
				id="translation-model"
				class="select select-bordered select-sm w-full"
				bind:value={translationModel}
			>
				{#each MODEL_REGISTRY as m}
					<option value={m.id}>{modelLabel(m)}</option>
				{/each}
			</select>
		</div>

		<!-- Tokenization model -->
		<div class="form-control">
			<label class="label" for="tokenization-model">
				<span class="label-text text-xs uppercase opacity-60">Model phân tích</span>
			</label>
			<select
				id="tokenization-model"
				class="select select-bordered select-sm w-full"
				bind:value={tokenizationModel}
			>
				{#each MODEL_REGISTRY as m}
					<option value={m.id}>{modelLabel(m)}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- API keys for required providers -->
	<div class="flex flex-col gap-2">
		{#each ['gemini', 'claude', 'openai'] as provider}
			{#if requiredProviders.has(provider as ProviderName)}
				<div class="form-control">
					<label class="label" for="{provider}-key">
						<span class="label-text text-xs"
							>{providerDot(provider as ProviderName)}
							{provider.charAt(0).toUpperCase() + provider.slice(1)} API Key</span
						>
					</label>
					<input
						id="{provider}-key"
						type="password"
						class="input input-sm input-bordered w-full"
						placeholder="Nhập API key..."
						bind:value={keys[provider]}
					/>
				</div>
			{/if}
		{/each}
	</div>

	<!-- Save button -->
	<button type="button" class="btn btn-primary btn-sm" onclick={handleSave} disabled={saving}>
		{#if saving}
			<span class="loading loading-spinner loading-xs"></span>
		{:else if saved}
			Đã lưu!
		{:else}
			Lưu cài đặt
		{/if}
	</button>

	<!-- Security notice -->
	<p class="text-xs opacity-50">
		API key được lưu cục bộ trên thiết bị của bạn và không bao giờ được gửi đi nơi khác.
	</p>
</div>
