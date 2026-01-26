<script lang="ts">
	/**
	 * Kanji Practice Modal
	 *
	 * Modal for practicing kanji writing with stroke order reference
	 * and handwriting recognition to check the user's drawing.
	 */

	import KanjiCanvas from './kanji-canvas.svelte';
	import { recognizeKanji, isCorrect, type Stroke } from '$lib/handwriting';

	// Props
	let {
		open = $bindable(false),
		kanji,
		meaning
	}: {
		open: boolean;
		kanji: string;
		meaning: string;
	} = $props();

	// State
	type ResultState = 'idle' | 'loading' | 'correct' | 'wrong';
	let resultState = $state<ResultState>('idle');
	let predictions = $state<string[]>([]);
	let canvasRef: { clear: () => void } | undefined = $state();

	const CANVAS_SIZE = 250;
	const strokeOrderUrl = $derived(
		`https://jotoba.de/resource/kanji/animation/${encodeURIComponent(kanji)}`
	);

	// Reset state when modal closes
	$effect(() => {
		if (!open) {
			resultState = 'idle';
			predictions = [];
		}
	});

	async function handleSubmit(strokes: Stroke[]) {
		resultState = 'loading';

		const result = await recognizeKanji(strokes, CANVAS_SIZE, CANVAS_SIZE);

		if (isCorrect(result, kanji, 3)) {
			resultState = 'correct';
			// Auto-clear canvas after short delay for retry
			setTimeout(() => {
				canvasRef?.clear();
				resultState = 'idle';
			}, 1500);
		} else {
			resultState = 'wrong';
			predictions = result.predictions.slice(0, 5);
		}
	}

	function handleClose() {
		open = false;
	}

	function handleRetry() {
		canvasRef?.clear();
		resultState = 'idle';
		predictions = [];
	}
</script>

{#if open}
	<div class="modal modal-open">
		<div class="modal-box max-w-3xl">
			<!-- Header -->
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-4">
					<span class="text-5xl font-bold text-primary">{kanji}</span>
					<span class="text-2xl font-medium">{meaning}</span>
				</div>
				<button type="button" class="btn btn-ghost btn-sm btn-circle" aria-label="Đóng" onclick={handleClose}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="h-5 w-5"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content: Stroke order + Canvas -->
			<div class="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
				<!-- Stroke Order Reference -->
				<div class="flex flex-col items-center gap-2">
					<span class="text-sm font-medium text-base-content/70">Thứ tự nét</span>
					<div
						class="flex h-[250px] w-[250px] items-center justify-center rounded-lg border-2 border-base-content/20 bg-base-200"
					>
						<img
							src={strokeOrderUrl}
							alt="Stroke order for {kanji}"
							class="h-full w-full object-contain p-2"
							onerror={(e) => {
								const target = e.currentTarget as HTMLImageElement;
								target.style.display = 'none';
								target.parentElement!.innerHTML =
									'<span class="text-base-content/50 text-sm">Không có hình</span>';
							}}
						/>
					</div>
				</div>

				<!-- Drawing Canvas -->
				<div class="flex flex-col items-center gap-2">
					<span class="text-sm font-medium text-base-content/70">Viết kanji</span>
					<KanjiCanvas
						bind:this={canvasRef}
						width={CANVAS_SIZE}
						height={CANVAS_SIZE}
						onSubmit={handleSubmit}
					/>
				</div>
			</div>

			<!-- Result Feedback -->
			<div class="mt-4 min-h-[60px]">
				{#if resultState === 'loading'}
					<div class="flex items-center justify-center gap-2">
						<span class="loading loading-spinner loading-md"></span>
						<span>Đang kiểm tra...</span>
					</div>
				{:else if resultState === 'correct'}
					<div class="alert alert-success">
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
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>Chính xác!</span>
					</div>
				{:else if resultState === 'wrong'}
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
						<div class="flex flex-col">
							<span>Chưa đúng, thử lại!</span>
							{#if predictions.length > 0}
								<span class="text-sm opacity-80">
									Nhận dạng: {predictions.join(', ')}
								</span>
							{/if}
						</div>
						<button type="button" class="btn btn-sm btn-ghost" onclick={handleRetry}>
							Thử lại
						</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Click outside to close -->
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={handleClose}>close</button>
		</form>
	</div>
{/if}
