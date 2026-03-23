<script lang="ts">
	import { onMount } from 'svelte';
	import type {
		Token,
		Sentence,
		TranslationResponse,
		AISettings,
		SavedTranslation
	} from '$lib/translate/types';
	import { getProvider, translateChunked } from '$lib/translate/providers/index';
	import { saveTranslation, getSettings } from '$lib/translate/storage';
	import TokenDisplay from './token-display.svelte';
	import TokenPopover from './token-popover.svelte';
	import ProviderSelector from './provider-selector.svelte';

	let {
		initialTranslation
	}: {
		initialTranslation?: SavedTranslation;
	} = $props();

	const TOKEN_COLORS = [
		'#6366f1', // indigo
		'#f59e0b', // amber
		'#10b981', // emerald
		'#ef4444', // red
		'#a855f7', // purple
		'#3b82f6', // blue
		'#ec4899', // pink
		'#14b8a6', // teal
		'#f97316', // orange
		'#84cc16', // lime
		'#06b6d4', // cyan
		'#e11d48', // rose
		'#8b5cf6', // violet
		'#d946ef', // fuchsia
		'#0ea5e9', // sky
		'#65a30d', // green
		'#ca8a04', // yellow
		'#dc2626', // red-dark
		'#7c3aed', // purple-dark
		'#0891b2' // teal-dark
	];

	let inputText = $state('');
	let translation = $state<TranslationResponse | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let hoveredTokenId = $state<string | null>(null);
	let hoveredAnchorEl = $state<HTMLElement | null>(null);
	let settings = $state<AISettings | null>(null);
	let showSettings = $state(false);

	// Build token lookup: maps composite key "si-tid" -> Token
	let tokenMap = $derived.by(() => {
		if (!translation) return new Map<string, Token>();
		const map = new Map<string, Token>();
		for (let si = 0; si < translation.sentences.length; si++) {
			for (const token of translation.sentences[si].tokens) {
				map.set(`${si}-${token.id}`, token);
			}
		}
		return map;
	});

	// Build a color map: composite key "si-tid" -> color (per sentence, index-based)
	let colorMap = $derived.by(() => {
		const map = new Map<string, string>();
		if (!translation) return map;
		for (let si = 0; si < translation.sentences.length; si++) {
			translation.sentences[si].jp_order.forEach((id, i) => {
				map.set(`${si}-${id}`, TOKEN_COLORS[i % TOKEN_COLORS.length]);
			});
		}
		return map;
	});

	// The hovered token data (for popover)
	let hoveredToken = $derived(
		hoveredTokenId !== null ? (tokenMap.get(hoveredTokenId) ?? null) : null
	);

	// Load initial translation if provided
	onMount(async () => {
		const loaded = await getSettings();
		if (loaded) settings = loaded;

		if (initialTranslation) {
			inputText = initialTranslation.sourceText;
			translation = initialTranslation.response;
		}
	});

	function handleSettingsChange(newSettings: AISettings) {
		settings = newSettings;
	}

	async function handleTranslate() {
		if (!inputText.trim()) return;

		if (!settings || !settings.keys[settings.provider]) {
			error = 'Vui lòng cài đặt API key trước khi dịch.';
			showSettings = true;
			return;
		}

		loading = true;
		error = null;
		translation = null;

		try {
			const provider = await getProvider(settings.provider);
			const apiKey = settings.keys[settings.provider]!;
			const response = await translateChunked(provider, inputText.trim(), apiKey);
			translation = response;

			// Auto-save
			await saveTranslation(inputText.trim(), response, settings.provider);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Đã xảy ra lỗi khi dịch.';
		} finally {
			loading = false;
		}
	}

	function handleTokenLeave() {
		hoveredTokenId = null;
		hoveredAnchorEl = null;
	}

	function handleClear() {
		inputText = '';
		translation = null;
		error = null;
		hoveredTokenId = null;
		hoveredAnchorEl = null;
	}

	// Get ordered tokens for a pane from a sentence
	function getJpTokens(sentence: Sentence): Token[] {
		return sentence.jp_order.map((id) => sentence.tokens.find((t) => t.id === id)!);
	}

	function getVnTokens(sentence: Sentence): Token[] {
		return sentence.vn_order.map((id) => sentence.tokens.find((t) => t.id === id)!);
	}
</script>

<div class="flex flex-col gap-4">
	<!-- Settings toggle -->
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold">Dịch thuật AI</h2>
		<button
			type="button"
			class="btn btn-ghost btn-sm"
			onclick={() => (showSettings = !showSettings)}
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
					d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
				/>
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
			Cài đặt
		</button>
	</div>

	<!-- Settings panel (collapsible) -->
	{#if showSettings}
		<div class="card bg-base-200">
			<div class="card-body p-4">
				<ProviderSelector onsettingschange={handleSettingsChange} />
			</div>
		</div>
	{/if}

	<!-- Main translation area -->
	<div class="flex flex-col gap-4 lg:flex-row">
		<!-- Left pane: Input / Japanese tokens -->
		<div class="flex-1">
			<div class="mb-2 text-sm font-semibold opacity-70">Tiếng Nhật</div>
			<div class="card min-h-[200px] bg-base-200">
				<div class="card-body p-4">
					{#if translation}
						<!-- Rendered Japanese tokens -->
						<div class="flex flex-wrap gap-1 text-lg leading-relaxed">
							{#each translation.sentences as sentence, si}
								{#each getJpTokens(sentence) as token (`jp-${si}-${token.id}`)}
									{@const key = `${si}-${token.id}`}
									<TokenDisplay
										{token}
										tokenKey={key}
										color={colorMap.get(key) ?? TOKEN_COLORS[0]}
										isHighlighted={hoveredTokenId === key}
										isDimmed={hoveredTokenId !== null && hoveredTokenId !== key}
										onmouseenter={(k) => {
											hoveredTokenId = k;
											const el = document.querySelector(`[data-id="${k}"]`);
											if (el instanceof HTMLElement) hoveredAnchorEl = el;
										}}
										onmouseleave={() => handleTokenLeave()}
									/>
								{/each}
								{#if si < translation.sentences.length - 1}
									<span class="w-full"></span>
								{/if}
							{/each}
						</div>
					{:else}
						<!-- Textarea for input -->
						<textarea
							class="textarea textarea-ghost h-full min-h-[160px] w-full resize-none text-lg focus:outline-none"
							placeholder="Nhập câu tiếng Nhật cần dịch..."
							bind:value={inputText}
						></textarea>
					{/if}
				</div>
			</div>
		</div>

		<!-- Right pane: Vietnamese tokens -->
		<div class="flex-1">
			<div class="mb-2 text-sm font-semibold opacity-70">Tiếng Việt</div>
			<div class="card min-h-[200px] bg-base-200">
				<div class="card-body p-4">
					{#if translation}
						<!-- Rendered Vietnamese tokens in natural order -->
						<div class="flex flex-wrap gap-1 text-lg leading-relaxed">
							{#each translation.sentences as sentence, si}
								{#each getVnTokens(sentence) as token (`vn-${si}-${token.id}`)}
									{@const key = `${si}-${token.id}`}
									<TokenDisplay
										token={{ ...token, jp: '', vn: token.vn || token.jp }}
										tokenKey={key}
										color={colorMap.get(key) ?? TOKEN_COLORS[0]}
										isHighlighted={hoveredTokenId === key}
										isDimmed={hoveredTokenId !== null && hoveredTokenId !== key}
										onmouseenter={(k) => {
											hoveredTokenId = k;
											const el = document.querySelector(`[data-id="${k}"]`);
											if (el instanceof HTMLElement) hoveredAnchorEl = el;
										}}
										onmouseleave={() => handleTokenLeave()}
									/>
								{/each}
								{#if si < translation.sentences.length - 1}
									<span class="w-full"></span>
								{/if}
							{/each}
						</div>
						<!-- Full Vietnamese translation fallback -->
						<div class="mt-4 border-t border-base-content/10 pt-3 text-sm opacity-60">
							{#each translation.sentences as sentence}
								<p>{sentence.vn_full}</p>
							{/each}
						</div>
					{:else}
						<div class="flex h-full min-h-[160px] items-center justify-center opacity-40">
							<p>Bản dịch sẽ xuất hiện ở đây</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Error message -->
	{#if error}
		<div class="alert alert-error">
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

	<!-- Action buttons -->
	<div class="flex items-center gap-2">
		{#if translation}
			<button type="button" class="btn btn-ghost" onclick={handleClear}> Dịch mới </button>
		{:else}
			<button
				type="button"
				class="btn btn-primary"
				onclick={handleTranslate}
				disabled={loading || !inputText.trim()}
			>
				{#if loading}
					<span class="loading loading-spinner loading-sm"></span>
				{/if}
				Dịch
			</button>
		{/if}
	</div>

	<!-- Token popover -->
	{#if hoveredToken && hoveredAnchorEl}
		<TokenPopover token={hoveredToken} anchorElement={hoveredAnchorEl} />
	{/if}
</div>
