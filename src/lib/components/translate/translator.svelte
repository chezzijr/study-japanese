<script lang="ts">
	import { onMount } from 'svelte';
	import type {
		Token,
		Sentence,
		TranslationResponse,
		TokenInfo,
		SentenceMapping,
		TranslationResponseV2,
		Direction,
		AISettings,
		SavedTranslation
	} from '$lib/translate/types';
	import { isV2 } from '$lib/translate/types';
	import { translateTwoStep } from '$lib/translate/providers/index';
	import { saveTranslation, getSettings } from '$lib/translate/storage';
	import { getProviderForModel } from '$lib/translate/models';
	import TokenDisplay from './token-display.svelte';
	import TokenPopover from './token-popover.svelte';
	import ProviderSelector from './provider-selector.svelte';

	let { initialTranslation }: { initialTranslation?: SavedTranslation } = $props();

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

	// State
	let inputText = $state('');
	let direction = $state<Direction>('jp-vn');
	let jlptLevel = $state<string | null>(null); // null = natural, 'n5'...'n1' = constrained
	let naturalTranslation = $state<string | null>(null); // step 1 result
	let translationV2 = $state<TranslationResponseV2 | null>(null); // step 2 result
	let translationV1 = $state<TranslationResponse | null>(null); // for old saved translations
	let translating = $state(false); // step 1 in progress
	let analyzing = $state(false); // step 2 in progress
	let error = $state<string | null>(null);
	let step2Error = $state<string | null>(null); // step 2 specific error (step 1 preserved)
	let hoveredTokenId = $state<string | null>(null);
	let hoveredAnchorEl = $state<HTMLElement | null>(null);
	let settings = $state<AISettings | null>(null);
	let showSettings = $state(false);

	// V2 derived state: group-based mapping
	let tokenToGroup = $derived.by(() => {
		if (!translationV2) return new Map<string, number>();
		const map = new Map<string, number>();
		for (let si = 0; si < translationV2.sentences.length; si++) {
			for (const group of translationV2.sentences[si].groups) {
				for (const id of group.source_ids) {
					map.set(`s-${si}-${id}`, group.group_id);
				}
				for (const id of group.target_ids) {
					map.set(`t-${si}-${id}`, group.group_id);
				}
			}
		}
		return map;
	});

	let groupToTokenKeys = $derived.by(() => {
		if (!translationV2) return new Map<string, string[]>(); // key: "si-groupId"
		const map = new Map<string, string[]>();
		for (let si = 0; si < translationV2.sentences.length; si++) {
			for (const group of translationV2.sentences[si].groups) {
				const keys: string[] = [];
				for (const id of group.source_ids) keys.push(`s-${si}-${id}`);
				for (const id of group.target_ids) keys.push(`t-${si}-${id}`);
				map.set(`${si}-${group.group_id}`, keys);
			}
		}
		return map;
	});

	// Color map: assigns colors per group
	let colorMap = $derived.by(() => {
		const map = new Map<string, string>();
		if (!translationV2) return map;
		for (let si = 0; si < translationV2.sentences.length; si++) {
			let colorIdx = 0;
			for (const group of translationV2.sentences[si].groups) {
				const isUnmapped = group.source_ids.length === 0 || group.target_ids.length === 0;
				const color = isUnmapped ? '#9ca3af' : TOKEN_COLORS[colorIdx++ % TOKEN_COLORS.length];
				const groupKey = `${si}-${group.group_id}`;
				const keys = groupToTokenKeys.get(groupKey) ?? [];
				for (const k of keys) {
					map.set(k, color);
				}
			}
		}
		return map;
	});

	// Determine if a token key is "unmapped" (in a group with empty counterpart)
	let unmappedKeys = $derived.by(() => {
		if (!translationV2) return new Set<string>();
		const set = new Set<string>();
		for (let si = 0; si < translationV2.sentences.length; si++) {
			for (const group of translationV2.sentences[si].groups) {
				if (group.source_ids.length === 0 || group.target_ids.length === 0) {
					for (const id of group.source_ids) set.add(`s-${si}-${id}`);
					for (const id of group.target_ids) set.add(`t-${si}-${id}`);
				}
			}
		}
		return set;
	});

	// Get all token keys in the same group as the hovered token
	let highlightedKeys = $derived.by(() => {
		if (!hoveredTokenId || !translationV2) return new Set<string>();
		const groupId = tokenToGroup.get(hoveredTokenId);
		if (groupId === undefined) return new Set<string>();
		// Find which sentence
		const si = parseInt(hoveredTokenId.split('-')[1]);
		const groupKey = `${si}-${groupId}`;
		return new Set(groupToTokenKeys.get(groupKey) ?? []);
	});

	// Resolve the JP token for popover display
	let hoveredJpToken = $derived.by((): TokenInfo | null => {
		if (!hoveredTokenId || !translationV2) return null;
		const parts = hoveredTokenId.split('-');
		const side = parts[0]; // 's' or 't'
		const si = parseInt(parts[1]);
		const tokenId = parseInt(parts[2]);
		const sentence = translationV2.sentences[si];
		if (!sentence) return null;

		// Determine which side is Japanese
		const jpSide = direction === 'jp-vn' ? 's' : 't';

		if (side === jpSide) {
			// Hovered token IS the JP token
			const tokens = jpSide === 's' ? sentence.source_tokens : sentence.target_tokens;
			return tokens.find((t) => t.id === tokenId) ?? null;
		} else {
			// Hovered token is the other language — find linked JP token via group
			const groupId = tokenToGroup.get(hoveredTokenId);
			if (groupId === undefined) return null;
			const group = sentence.groups.find((g) => g.group_id === groupId);
			if (!group) return null;
			const jpIds = jpSide === 's' ? group.source_ids : group.target_ids;
			if (jpIds.length === 0) return null;
			const jpTokens = jpSide === 's' ? sentence.source_tokens : sentence.target_tokens;
			return jpTokens.find((t) => t.id === jpIds[0]) ?? null;
		}
	});

	// Resolve the target text for popover
	let hoveredTargetText = $derived.by((): string => {
		if (!hoveredTokenId || !translationV2) return '';
		const parts = hoveredTokenId.split('-');
		const side = parts[0];
		const si = parseInt(parts[1]);
		const tokenId = parseInt(parts[2]);
		const sentence = translationV2.sentences[si];
		if (!sentence) return '';

		const vnSide = direction === 'jp-vn' ? 't' : 's';

		if (side === vnSide) {
			// Hovered token IS the VN side
			const tokens = vnSide === 's' ? sentence.source_tokens : sentence.target_tokens;
			const token = tokens.find((t) => t.id === tokenId);
			return token?.text ?? '';
		} else {
			// Hovered token is JP side — find linked VN tokens via group
			const groupId = tokenToGroup.get(hoveredTokenId);
			if (groupId === undefined) return '';
			const group = sentence.groups.find((g) => g.group_id === groupId);
			if (!group) return '';
			const vnIds = vnSide === 's' ? group.source_ids : group.target_ids;
			const vnTokens = vnSide === 's' ? sentence.source_tokens : sentence.target_tokens;
			return vnIds.map((id) => vnTokens.find((t) => t.id === id)?.text ?? '').join(' ');
		}
	});

	// ──── V1 backward compat (for old saved translations) ────
	let v1TokenMap = $derived.by(() => {
		if (!translationV1) return new Map<string, Token>();
		const map = new Map<string, Token>();
		for (let si = 0; si < translationV1.sentences.length; si++) {
			for (const token of translationV1.sentences[si].tokens) {
				map.set(`${si}-${token.id}`, token);
			}
		}
		return map;
	});

	let v1ColorMap = $derived.by(() => {
		const map = new Map<string, string>();
		if (!translationV1) return map;
		for (let si = 0; si < translationV1.sentences.length; si++) {
			let colorIdx = 0;
			translationV1.sentences[si].jp_order.forEach((id) => {
				map.set(`${si}-${id}`, TOKEN_COLORS[colorIdx++ % TOKEN_COLORS.length]);
			});
			for (const id of translationV1.sentences[si].vn_order) {
				const key = `${si}-${id}`;
				if (!map.has(key)) {
					map.set(key, TOKEN_COLORS[colorIdx++ % TOKEN_COLORS.length]);
				}
			}
		}
		return map;
	});

	let v1HoveredToken = $derived(
		hoveredTokenId !== null ? (v1TokenMap.get(hoveredTokenId) ?? null) : null
	);

	// ──── Functions ────

	onMount(async () => {
		const loaded = await getSettings();
		if (loaded) settings = loaded;

		if (initialTranslation) {
			inputText = initialTranslation.sourceText;
			direction = initialTranslation.direction ?? 'jp-vn';
			if (isV2(initialTranslation.response)) {
				translationV2 = initialTranslation.response;
				naturalTranslation = initialTranslation.response.sentences
					.map((s) => s.target_text)
					.join('\n');
			} else {
				translationV1 = initialTranslation.response;
			}
		}
	});

	function handleSettingsChange(newSettings: AISettings) {
		settings = newSettings;
	}

	function handleSwapDirection() {
		direction = direction === 'jp-vn' ? 'vn-jp' : 'jp-vn';
		handleClear();
	}

	async function handleTranslate() {
		if (!inputText.trim() || !settings) return;

		// Check API keys
		const transProvider = getProviderForModel(settings.translationModel);
		const tokenProvider = getProviderForModel(settings.tokenizationModel);
		if (!settings.keys[transProvider] || !settings.keys[tokenProvider]) {
			error = 'Vui lòng cài đặt API key trước khi dịch.';
			showSettings = true;
			return;
		}

		translating = true;
		error = null;
		step2Error = null;
		naturalTranslation = null;
		translationV2 = null;
		translationV1 = null;

		try {
			const result = await translateTwoStep(
				inputText.trim(),
				direction,
				settings,
				jlptLevel ?? undefined,
				(text) => {
					// Callback: step 1 done
					naturalTranslation = text;
					translating = false;
					analyzing = true;
				}
			);
			translationV2 = result;

			// Auto-save
			await saveTranslation(inputText.trim(), result, {
				direction,
				translationModel: settings.translationModel,
				tokenizationModel: settings.tokenizationModel
			});
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Đã xảy ra lỗi.';
			if (naturalTranslation) {
				// Step 2 failed, step 1 preserved
				step2Error = msg;
			} else {
				error = msg;
			}
		} finally {
			translating = false;
			analyzing = false;
		}
	}

	async function handleRetryStep2() {
		if (!inputText.trim() || !settings || !naturalTranslation) return;
		analyzing = true;
		step2Error = null;
		try {
			const result = await translateTwoStep(inputText.trim(), direction, settings, jlptLevel ?? undefined);
			translationV2 = result;
			await saveTranslation(inputText.trim(), result, {
				direction,
				translationModel: settings.translationModel,
				tokenizationModel: settings.tokenizationModel
			});
		} catch (e) {
			step2Error = e instanceof Error ? e.message : 'Lỗi phân tích.';
		} finally {
			analyzing = false;
		}
	}

	function handleTokenHover(key: string, el: HTMLElement) {
		hoveredTokenId = key;
		hoveredAnchorEl = el;
	}

	function handleTokenLeave() {
		hoveredTokenId = null;
		hoveredAnchorEl = null;
	}

	function handleClear() {
		inputText = '';
		naturalTranslation = null;
		translationV2 = null;
		translationV1 = null;
		error = null;
		step2Error = null;
		hoveredTokenId = null;
		hoveredAnchorEl = null;
	}

	// V1 compat helpers
	function getJpTokens(sentence: Sentence): Token[] {
		return sentence.jp_order.map((id) => sentence.tokens.find((t) => t.id === id)!);
	}
	function getVnTokens(sentence: Sentence): Token[] {
		return sentence.vn_order.map((id) => sentence.tokens.find((t) => t.id === id)!);
	}

	const JLPT_LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1'];
</script>

<div class="flex flex-col gap-4">
	<!-- Header with settings toggle -->
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
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				/>
			</svg>
			Cài đặt
		</button>
	</div>

	<!-- Settings panel (collapsible with transition) -->
	{#if showSettings}
		<div class="card bg-base-200" style="animation: slideDown 0.2s ease-out;">
			<div class="card-body p-4">
				<ProviderSelector
					onsettingschange={handleSettingsChange}
					onsaved={() => (showSettings = false)}
				/>
			</div>
		</div>
	{/if}

	<!-- Language swap bar -->
	<div class="flex items-center justify-center gap-3">
		<span
			class="rounded-lg bg-base-200 px-3 py-1 text-sm font-semibold"
			class:text-primary={direction === 'jp-vn'}
		>
			{direction === 'jp-vn' ? '日本語' : 'Tiếng Việt'}
		</span>
		<button
			type="button"
			class="btn btn-circle btn-ghost btn-sm"
			onclick={handleSwapDirection}
			title="Đổi chiều dịch"
		>
			⇄
		</button>
		<span
			class="rounded-lg bg-base-200 px-3 py-1 text-sm font-semibold"
			class:text-secondary={direction === 'jp-vn'}
		>
			{direction === 'jp-vn' ? 'Tiếng Việt' : '日本語'}
		</span>

		<!-- JLPT level toggle (only for VN->JP) -->
		{#if direction === 'vn-jp'}
			<select class="select select-bordered select-xs ml-4" bind:value={jlptLevel}>
				<option value={null}>Tự nhiên</option>
				{#each JLPT_LEVELS as level}
					<option value={level}>{level.toUpperCase()}</option>
				{/each}
			</select>
		{/if}
	</div>

	<!-- Input area -->
	<div class="card bg-base-200">
		<div class="card-body p-4">
			<div class="mb-2 text-xs font-semibold uppercase opacity-50">Nhập văn bản</div>
			<textarea
				class="textarea textarea-ghost h-full min-h-[120px] w-full resize-none text-lg focus:outline-none"
				placeholder={direction === 'jp-vn'
					? 'Nhập câu tiếng Nhật cần dịch...'
					: 'Nhập câu tiếng Việt cần dịch...'}
				bind:value={inputText}
				disabled={translating || analyzing}
			></textarea>
		</div>
	</div>

	<!-- Action buttons -->
	<div class="flex items-center gap-2">
		<button
			type="button"
			class="btn btn-primary"
			onclick={handleTranslate}
			disabled={translating || analyzing || !inputText.trim()}
		>
			{#if translating || analyzing}
				<span class="loading loading-spinner loading-sm"></span>
			{/if}
			Dịch
		</button>
		{#if naturalTranslation || translationV2 || translationV1}
			<button type="button" class="btn btn-ghost" onclick={handleClear}>Dịch mới</button>
		{/if}
	</div>

	<!-- Progress indicator -->
	{#if translating || analyzing}
		<div class="flex items-center gap-3 text-sm">
			{#if naturalTranslation}
				<span class="flex items-center gap-1 text-success">✓ Dịch xong</span>
			{:else if translating}
				<span class="flex items-center gap-1">
					<span class="loading loading-spinner loading-xs"></span> Đang dịch...
				</span>
			{/if}
			{#if analyzing}
				<span class="flex items-center gap-1">
					<span class="loading loading-spinner loading-xs"></span> Đang phân tích...
				</span>
			{/if}
		</div>
	{/if}

	<!-- Error messages -->
	{#if error}
		<div class="alert alert-error">
			<span>{error}</span>
		</div>
	{/if}

	<!-- Natural translation (appears after step 1) -->
	{#if naturalTranslation}
		<div class="card border border-success/20 bg-success/5">
			<div class="card-body p-4">
				<div class="mb-2 text-xs font-semibold uppercase text-success">Bản dịch</div>
				<div class="whitespace-pre-line text-lg leading-relaxed">{naturalTranslation}</div>
			</div>
		</div>
	{/if}

	<!-- Step 2 error with retry -->
	{#if step2Error}
		<div class="alert alert-warning">
			<span>Lỗi phân tích token: {step2Error}</span>
			<button type="button" class="btn btn-sm btn-warning" onclick={handleRetryStep2}
				>Thử lại</button
			>
		</div>
	{/if}

	<!-- V2 Token panes (appears after step 2) -->
	{#if translationV2}
		<div class="flex flex-col gap-4 lg:flex-row">
			<!-- Source tokens pane -->
			<div class="flex-1">
				<div class="mb-2 text-xs font-semibold uppercase opacity-50">Source tokens</div>
				<div class="card bg-base-200">
					<div class="card-body p-4">
						<div class="flex flex-wrap gap-1 text-lg leading-relaxed">
							{#each translationV2.sentences as sentence, si}
								{#each sentence.source_tokens as token (`s-${si}-${token.id}`)}
									{@const key = `s-${si}-${token.id}`}
									<TokenDisplay
										{token}
										tokenKey={key}
										color={colorMap.get(key) ?? '#9ca3af'}
										isHighlighted={highlightedKeys.has(key)}
										isDimmed={hoveredTokenId !== null && !highlightedKeys.has(key)}
										isUnmapped={unmappedKeys.has(key)}
										onmouseenter={handleTokenHover}
										onmouseleave={handleTokenLeave}
									/>
								{/each}
								{#if si < translationV2.sentences.length - 1}
									<span class="w-full"></span>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Target tokens pane -->
			<div class="flex-1">
				<div class="mb-2 text-xs font-semibold uppercase opacity-50">Mapped tokens</div>
				<div class="card bg-base-200">
					<div class="card-body p-4">
						<div class="flex flex-wrap gap-1 text-lg leading-relaxed">
							{#each translationV2.sentences as sentence, si}
								{#each sentence.target_tokens as token (`t-${si}-${token.id}`)}
									{@const key = `t-${si}-${token.id}`}
									<TokenDisplay
										{token}
										tokenKey={key}
										color={colorMap.get(key) ?? '#9ca3af'}
										isHighlighted={highlightedKeys.has(key)}
										isDimmed={hoveredTokenId !== null && !highlightedKeys.has(key)}
										isUnmapped={unmappedKeys.has(key)}
										onmouseenter={handleTokenHover}
										onmouseleave={handleTokenLeave}
									/>
								{/each}
								{#if si < translationV2.sentences.length - 1}
									<span class="w-full"></span>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- V1 backward compat rendering (for old saved translations) -->
	{#if translationV1}
		<div class="flex flex-col gap-4 lg:flex-row">
			<!-- Left pane: JP tokens -->
			<div class="flex-1">
				<div class="mb-2 text-sm font-semibold opacity-70">Tiếng Nhật</div>
				<div class="card min-h-[200px] bg-base-200">
					<div class="card-body p-4">
						<div class="flex flex-wrap gap-1 text-lg leading-relaxed">
							{#each translationV1.sentences as sentence, si}
								{#each getJpTokens(sentence) as token (`jp-${si}-${token.id}`)}
									{@const key = `${si}-${token.id}`}
									{@const adapted = { ...token, text: token.jp || token.vn }}
									<TokenDisplay
										token={adapted}
										tokenKey={key}
										color={v1ColorMap.get(key) ?? TOKEN_COLORS[0]}
										isHighlighted={hoveredTokenId === key}
										isDimmed={hoveredTokenId !== null && hoveredTokenId !== key}
										onmouseenter={handleTokenHover}
										onmouseleave={handleTokenLeave}
									/>
								{/each}
								{#if si < translationV1.sentences.length - 1}
									<span class="w-full"></span>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			</div>
			<!-- Right pane: VN tokens -->
			<div class="flex-1">
				<div class="mb-2 text-sm font-semibold opacity-70">Tiếng Việt</div>
				<div class="card min-h-[200px] bg-base-200">
					<div class="card-body p-4">
						<div class="flex flex-wrap gap-1 text-lg leading-relaxed">
							{#each translationV1.sentences as sentence, si}
								{#each getVnTokens(sentence) as token (`vn-${si}-${token.id}`)}
									{@const key = `${si}-${token.id}`}
									{@const adapted = { ...token, text: token.vn || token.jp }}
									<TokenDisplay
										token={adapted}
										tokenKey={key}
										color={v1ColorMap.get(key) ?? TOKEN_COLORS[0]}
										isHighlighted={hoveredTokenId === key}
										isDimmed={hoveredTokenId !== null && hoveredTokenId !== key}
										onmouseenter={handleTokenHover}
										onmouseleave={handleTokenLeave}
									/>
								{/each}
								{#if si < translationV1.sentences.length - 1}
									<span class="w-full"></span>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Token popover -->
	{#if hoveredAnchorEl}
		{#if translationV2}
			<TokenPopover
				jpToken={hoveredJpToken}
				targetText={hoveredTargetText}
				anchorElement={hoveredAnchorEl}
			/>
		{:else if translationV1 && v1HoveredToken}
			<TokenPopover
				jpToken={{ ...v1HoveredToken, text: v1HoveredToken.jp || v1HoveredToken.vn }}
				targetText={v1HoveredToken.vn}
				anchorElement={hoveredAnchorEl}
			/>
		{/if}
	{/if}
</div>

<style>
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
