<script lang="ts">
	/**
	 * Flashcard Import Page
	 *
	 * Import decks from JSON files or paste JSON directly.
	 */

	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		getAllDecks,
		getCardsByDeck,
		createDeck,
		createCards,
		updateDeck,
		deleteCards,
		parseImportJSON,
		validateImportData,
		prepareImportDeck,
		prepareImportCards,
		readFileAsText,
		type Deck,
		type ExportData,
		type ImportOptions,
		type ValidationResult
	} from '$lib/flashcard';

	// State
	let loading = $state(false);
	let error = $state<string | null>(null);
	let existingDecks = $state<Deck[]>([]);

	// Import input
	let jsonInput = $state('');
	let fileInput = $state<HTMLInputElement | null>(null);
	let inputMethod = $state<'file' | 'text'>('file');

	// Validation and preview
	let validation = $state<ValidationResult | null>(null);
	let importData = $state<ExportData | null>(null);

	// Import options
	let deckNameConflict = $state<ImportOptions['deckNameConflict']>('rename');
	let cardDuplicateStrategy = $state<ImportOptions['cardDuplicateStrategy']>('skip');
	let includeReviews = $state(false);

	// Import result
	let importResult = $state<{
		success: boolean;
		deckId?: string;
		deckName?: string;
		cardsImported: number;
		cardsSkipped: number;
		message: string;
	} | null>(null);

	onMount(async () => {
		await loadExistingDecks();
	});

	async function loadExistingDecks() {
		try {
			existingDecks = await getAllDecks();
		} catch (e) {
			console.error('Failed to load existing decks:', e);
		}
	}

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			loading = true;
			error = null;
			validation = null;
			importData = null;
			importResult = null;

			const text = await readFileAsText(file);
			await processJsonInput(text);
		} catch (e) {
			console.error('Failed to read file:', e);
			error = 'Không thể đọc file.';
		} finally {
			loading = false;
		}
	}

	async function handleTextInput() {
		if (!jsonInput.trim()) {
			error = 'Vui lòng nhập JSON.';
			return;
		}

		try {
			loading = true;
			error = null;
			validation = null;
			importData = null;
			importResult = null;

			await processJsonInput(jsonInput);
		} catch (e) {
			console.error('Failed to process JSON:', e);
			error = 'Không thể xử lý JSON.';
		} finally {
			loading = false;
		}
	}

	async function processJsonInput(text: string) {
		const result = parseImportJSON(text);

		if (result.error) {
			error = result.error;
			return;
		}

		validation = validateImportData(result.data);

		if (!validation.valid) {
			error = validation.errors.join('; ');
			return;
		}

		importData = result.data!;
	}

	async function handleImport() {
		if (!importData) return;

		try {
			loading = true;
			error = null;

			const options: ImportOptions = {
				deckNameConflict,
				cardDuplicateStrategy,
				includeReviews
			};

			// Prepare deck
			const deckResult = prepareImportDeck(importData, existingDecks, options);

			if (!deckResult.deck && deckResult.action === 'skip') {
				importResult = {
					success: false,
					cardsImported: 0,
					cardsSkipped: 0,
					message: 'Bộ thẻ đã tồn tại và bạn chọn bỏ qua.'
				};
				return;
			}

			let targetDeck: Deck;

			if (deckResult.action === 'replace') {
				// Update existing deck
				targetDeck = await updateDeck(deckResult.deck!.id, deckResult.deck!) as Deck;
			} else {
				// Create new deck
				targetDeck = await createDeck(
					deckResult.deck!.name,
					deckResult.deck!.description,
					deckResult.deck!.settings
				);
			}

			// Get existing cards in target deck
			const existingCards = await getCardsByDeck(targetDeck.id);

			// Prepare cards
			const cardResult = prepareImportCards(importData, targetDeck.id, existingCards, options);

			// If replacing, delete existing cards first
			if (deckResult.action === 'replace' && cardDuplicateStrategy === 'replace') {
				const toDelete = existingCards
					.filter((ec) => cardResult.cards.some((nc) => nc.id === ec.id))
					.map((c) => c.id);
				if (toDelete.length > 0) {
					await deleteCards(toDelete);
				}
			}

			// Create new cards
			if (cardResult.cards.length > 0) {
				await createCards(cardResult.cards);
			}

			importResult = {
				success: true,
				deckId: targetDeck.id,
				deckName: targetDeck.name,
				cardsImported: cardResult.cards.length,
				cardsSkipped: cardResult.skipped,
				message: `Đã import thành công ${cardResult.cards.length} thẻ vào "${targetDeck.name}".`
			};

			// Reload existing decks
			await loadExistingDecks();
		} catch (e) {
			console.error('Failed to import:', e);
			error = 'Không thể import dữ liệu.';
		} finally {
			loading = false;
		}
	}

	function resetForm() {
		jsonInput = '';
		validation = null;
		importData = null;
		importResult = null;
		error = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function goToDeck() {
		if (importResult?.deckId) {
			goto(`${base}/flashcard/deck/${importResult.deckId}`);
		}
	}
</script>

<svelte:head>
	<title>Import Flashcard</title>
</svelte:head>

<main class="min-h-screen p-4 md:p-6">
	<!-- Header -->
	<header class="mb-6">
		<div class="flex items-center gap-2 text-sm text-base-content/60 mb-2">
			<a href="{base}/flashcard" class="hover:text-base-content">Flashcard</a>
			<span>/</span>
			<span>Import</span>
		</div>
		<h1 class="text-2xl md:text-3xl font-bold">Import Flashcard</h1>
		<p class="text-base-content/60 mt-1">Import bộ thẻ từ file JSON hoặc dán trực tiếp.</p>
	</header>

	<!-- Import Success -->
	{#if importResult?.success}
		<div class="card bg-base-200 max-w-2xl mx-auto">
			<div class="card-body text-center">
				<div class="text-6xl mb-4">✅</div>
				<h2 class="card-title justify-center text-xl">Import thành công!</h2>
				<p class="text-base-content/60">{importResult.message}</p>

				<div class="stats shadow mt-4">
					<div class="stat">
						<div class="stat-title">Đã import</div>
						<div class="stat-value text-success text-lg">{importResult.cardsImported}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Bỏ qua</div>
						<div class="stat-value text-warning text-lg">{importResult.cardsSkipped}</div>
					</div>
				</div>

				<div class="card-actions justify-center mt-6">
					<button class="btn btn-ghost" onclick={resetForm}>Import thêm</button>
					<button class="btn btn-primary" onclick={goToDeck}>Xem bộ thẻ</button>
				</div>
			</div>
		</div>
	{:else}
		<div class="max-w-2xl mx-auto space-y-6">
			<!-- Input Method Tabs -->
			<div class="tabs tabs-boxed">
				<button
					class="tab {inputMethod === 'file' ? 'tab-active' : ''}"
					onclick={() => { inputMethod = 'file'; resetForm(); }}
				>
					📁 File
				</button>
				<button
					class="tab {inputMethod === 'text' ? 'tab-active' : ''}"
					onclick={() => { inputMethod = 'text'; resetForm(); }}
				>
					📝 Dán JSON
				</button>
			</div>

			<!-- File Input -->
			{#if inputMethod === 'file'}
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-base">Chọn file JSON</h3>
						<input
							type="file"
							accept=".json,application/json"
							class="file-input file-input-bordered w-full"
							bind:this={fileInput}
							onchange={handleFileSelect}
						/>
						<p class="text-sm text-base-content/50">
							Chấp nhận file JSON được export từ ứng dụng này.
						</p>
					</div>
				</div>
			{:else}
				<!-- Text Input -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-base">Dán JSON</h3>
						<textarea
							class="textarea textarea-bordered w-full h-48 font-mono text-sm"
							placeholder="Dán JSON vào đây..."
							bind:value={jsonInput}
						></textarea>
						<div class="card-actions justify-end">
							<button
								class="btn btn-primary"
								onclick={handleTextInput}
								disabled={loading || !jsonInput.trim()}
							>
								{#if loading}
									<span class="loading loading-spinner loading-sm"></span>
								{/if}
								Xác nhận
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Error Message -->
			{#if error}
				<div class="alert alert-error">
					<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span>{error}</span>
				</div>
			{/if}

			<!-- Validation Warnings -->
			{#if validation?.warnings && validation.warnings.length > 0}
				<div class="alert alert-warning">
					<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
					<div>
						{#each validation.warnings as warning}
							<p>{warning}</p>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Preview & Import Options -->
			{#if importData}
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-base">Xem trước</h3>

						<!-- Deck Info -->
						<div class="bg-base-100 rounded-lg p-4">
							<div class="font-medium text-lg">{importData.deck.name}</div>
							{#if importData.deck.description}
								<div class="text-sm text-base-content/60">{importData.deck.description}</div>
							{/if}
							<div class="mt-2 flex gap-2">
								<span class="badge badge-primary">{importData.cards.length} thẻ</span>
								{#if importData.reviews}
									<span class="badge badge-secondary">{importData.reviews.length} lịch sử</span>
								{/if}
							</div>
						</div>

						<!-- Import Options -->
						<div class="divider">Tùy chọn import</div>

						<!-- Deck Name Conflict -->
						<div class="form-control">
							<label class="label">
								<span class="label-text">Nếu tên bộ thẻ đã tồn tại:</span>
							</label>
							<select class="select select-bordered" bind:value={deckNameConflict}>
								<option value="rename">Đổi tên (thêm số)</option>
								<option value="replace">Thay thế bộ thẻ cũ</option>
								<option value="skip">Bỏ qua, không import</option>
							</select>
						</div>

						<!-- Card Duplicate Strategy -->
						<div class="form-control">
							<label class="label">
								<span class="label-text">Xử lý thẻ trùng lặp:</span>
							</label>
							<select class="select select-bordered" bind:value={cardDuplicateStrategy}>
								<option value="skip">Bỏ qua thẻ trùng</option>
								<option value="replace">Thay thế thẻ cũ</option>
								<option value="keep-both">Giữ cả hai</option>
							</select>
						</div>

						<!-- Include Reviews -->
						{#if importData.reviews && importData.reviews.length > 0}
							<div class="form-control">
								<label class="label cursor-pointer">
									<span class="label-text">Import lịch sử ôn tập</span>
									<input type="checkbox" class="checkbox" bind:checked={includeReviews} />
								</label>
							</div>
						{/if}

						<!-- Import Button -->
						<div class="card-actions justify-end mt-4">
							<button class="btn btn-ghost" onclick={resetForm}>Hủy</button>
							<button
								class="btn btn-primary"
								onclick={handleImport}
								disabled={loading}
							>
								{#if loading}
									<span class="loading loading-spinner loading-sm"></span>
								{/if}
								Import {importData.cards.length} thẻ
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Sample Format -->
			{#if !importData}
				<div class="collapse collapse-arrow bg-base-200">
					<input type="checkbox" />
					<div class="collapse-title font-medium">Định dạng JSON mẫu</div>
					<div class="collapse-content">
						<pre class="bg-base-300 p-4 rounded-lg overflow-x-auto text-sm"><code>{`{
  "version": "1.0.0",
  "exportedAt": 1700000000000,
  "deck": {
    "name": "N5 Vocabulary",
    "description": "Basic Japanese vocabulary"
  },
  "cards": [
    {
      "front": "学校",
      "back": "Trường học",
      "frontReading": "がっこう",
      "notes": "School"
    }
  ]
}`}</code></pre>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Back Link -->
	<div class="flex justify-center mt-8">
		<a href="{base}/flashcard" class="btn btn-ghost">
			&larr; Quay lại Flashcard
		</a>
	</div>
</main>
