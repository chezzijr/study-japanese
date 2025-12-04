<script lang="ts">
	import KanjiCanvas from '$lib/components/kanji-canvas.svelte';
	import { recognizeKanji, isCorrect, type Stroke } from '$lib/handwriting';

	interface KanjiItem {
		word: string;
		meaning: string;
		meaning_resolution?: string;
	}

	let { data } = $props();

	// Deduplicate by word
	const kanjis: KanjiItem[] = [...new Map(data.kanjis.map((k: KanjiItem) => [k.word, k])).values()];

	let currentIndex = $state(Math.floor(Math.random() * kanjis.length));
	let result = $state<'idle' | 'correct' | 'wrong' | 'loading'>('idle');
	let canvasRef: KanjiCanvas;

	const current = $derived(kanjis[currentIndex]);
	const prompt = $derived(current.meaning_resolution || current.meaning);

	async function handleSubmit(strokes: Stroke[]) {
		result = 'loading';
		const recognition = await recognizeKanji(strokes, 300, 300);
		if (isCorrect(recognition, current.word)) {
			result = 'correct';
			// Auto-advance after 1 second
			setTimeout(() => {
				next();
			}, 1000);
		} else {
			result = 'wrong';
		}
	}

	function next() {
		let nextIndex = Math.floor(Math.random() * kanjis.length);
		while (nextIndex === currentIndex && kanjis.length > 1) {
			nextIndex = Math.floor(Math.random() * kanjis.length);
		}
		currentIndex = nextIndex;
		result = 'idle';
		canvasRef?.clear();
	}
</script>

<svelte:head>
	<title>Kanji Draw - {data.level.toUpperCase()}</title>
</svelte:head>

<main class="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
	<h2 class="text-center text-2xl">
		Viết chữ Hán có nghĩa:
		<span class="block text-3xl font-bold text-primary">{prompt}</span>
	</h2>

	<KanjiCanvas bind:this={canvasRef} onSubmit={handleSubmit} />

	{#if result === 'loading'}
		<div class="flex items-center gap-2">
			<span class="loading loading-spinner"></span>
			<span>Đang nhận dạng...</span>
		</div>
	{:else if result === 'correct'}
		<div class="alert alert-success w-auto">
			<span>Chính xác! ✓</span>
		</div>
		<p class="text-sm text-base-content/70">Tự động chuyển câu tiếp...</p>
	{:else if result === 'wrong'}
		<div class="alert alert-error w-auto">
			<span>
				Sai rồi! Đáp án:
				<span class="text-2xl font-bold">{current.word}</span>
			</span>
		</div>
		<button class="btn btn-primary" onclick={next}>Tiếp theo</button>
	{/if}
</main>
