<script lang="ts">
	import KanjiCanvas from '$lib/components/kanji-canvas.svelte';
	import { recognizeKanji, isCorrect, type Stroke } from '$lib/handwriting';
	import { fly } from 'svelte/transition';
	import { quintOut, linear } from 'svelte/easing';

	interface KanjiItem {
		word: string;
		meaning: string;
	}

	let { data } = $props();

	// Deduplicate by word
	const kanjis: KanjiItem[] = [...new Map(data.kanjis.map((k: KanjiItem) => [k.word, k])).values()];

	// Session state
	type QuestionType = 'mcq-kanji-to-meaning' | 'mcq-meaning-to-kanji' | 'draw';
	type QuestionState = 'idle' | 'correct' | 'wrong' | 'loading';

	let currentIndex = $state(randomIndex());
	let questionType = $state<QuestionType>(randomQuestionType());
	let questionState = $state<QuestionState>('idle');
	let canvasRef: KanjiCanvas;
	let emojiAnim = $state([] as string[]);

	const current = $derived(kanjis[currentIndex]);
	const mcqOptions = $derived(
		questionType.startsWith('mcq-') ? generateMCQOptions(currentIndex) : []
	);

	function randomIndex() {
		return Math.floor(Math.random() * kanjis.length);
	}

	function randomQuestionType(): QuestionType {
		const rand = Math.random();
		if (rand < 1 / 3) return 'mcq-kanji-to-meaning';
		if (rand < 2 / 3) return 'mcq-meaning-to-kanji';
		return 'draw';
	}

	function generateMCQOptions(targetIndex: number): KanjiItem[] {
		const indices = [targetIndex];
		const usedMeanings = new Set([kanjis[targetIndex].meaning]);

		while (indices.length < 4) {
			const rand = randomIndex();
			if (indices.includes(rand)) continue;

			const candidate = kanjis[rand];
			// Prevent any duplicate meanings in choices
			if (usedMeanings.has(candidate.meaning)) continue;

			usedMeanings.add(candidate.meaning);
			indices.push(rand);
		}
		return indices.map((i) => kanjis[i]).sort(() => Math.random() - 0.5);
	}

	function nextQuestion() {
		let nextIndex = randomIndex();
		while (nextIndex === currentIndex && kanjis.length > 1) {
			nextIndex = randomIndex();
		}
		currentIndex = nextIndex;
		questionType = randomQuestionType();
		questionState = 'idle';

		// Clear canvas if we're moving to a draw question
		if (questionType === 'draw') {
			setTimeout(() => canvasRef?.clear(), 0);
		}
	}

	// MCQ handlers
	function handleMCQChoice(e: MouseEvent, choice: KanjiItem) {
		if (questionState !== 'idle') return;

		const node = e.target as HTMLButtonElement;
		const isCorrectAnswer =
			questionType === 'mcq-kanji-to-meaning'
				? choice.meaning === current.meaning
				: choice.word === current.word;

		if (isCorrectAnswer) {
			questionState = 'correct';
			node.animate(
				[{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }],
				{ duration: 750, easing: 'ease' }
			);
			setTimeout(() => {
				nextQuestion();
			}, 750);
		} else {
			questionState = 'wrong';
			node.animate(
				[
					{ transform: 'translateX(10px)' },
					{ transform: 'translateX(-10px)' },
					{ transform: 'translateX(0)' },
					{ transform: 'translateX(10px)' },
					{ transform: 'translateX(-10px)' },
					{ transform: 'translateX(0)' }
				],
				{ duration: 500, easing: 'ease' }
			);

			const newId = Date.now().toString();
			emojiAnim = [...emojiAnim, newId];
			setTimeout(() => {
				emojiAnim = emojiAnim.filter((id) => id !== newId);
			}, 2000);

			// Reset state after animation
			setTimeout(() => {
				questionState = 'idle';
			}, 500);
		}
	}

	// Draw handlers
	async function handleDrawSubmit(strokes: Stroke[]) {
		questionState = 'loading';
		const recognition = await recognizeKanji(strokes, 300, 300);

		if (isCorrect(recognition, current.word)) {
			questionState = 'correct';
			setTimeout(() => {
				nextQuestion();
			}, 750);
		} else {
			questionState = 'wrong';
		}
	}

	function handleDrawNext() {
		nextQuestion();
	}

	function getBtnClass(index: number) {
		return [
			'btn btn-outline btn-info',
			'btn btn-outline btn-success',
			'btn btn-outline btn-warning',
			'btn btn-outline btn-error'
		][index];
	}

	function randomWrongEmoji() {
		const emojis = ['😭', '😂', '🫣', '🤨', '😞', '😨', '😢', '😳', '😬', '😰', '😩', '😅', '😔'];
		return emojis[Math.floor(Math.random() * emojis.length)];
	}
</script>

<svelte:head>
	<title>Kanji Practice - {data.level.toUpperCase()}</title>
</svelte:head>

{#each emojiAnim as id (id)}
	<div
		class="fixed left-[calc(50vw-15px)] top-1/4 z-50 text-3xl"
		in:fly={{ y: 300, duration: 1000, easing: quintOut, opacity: 0 }}
		out:fly={{ y: -200, duration: 1000, easing: linear, opacity: 0 }}
	>
		{randomWrongEmoji()}
	</div>
{/each}

<main class="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
	{#if questionType === 'mcq-kanji-to-meaning'}
		<!-- MCQ: Kanji → Meaning -->
		<p class="text-center text-2xl">
			Âm Hán Việt của
			<span class="text-4xl font-bold text-primary">{current.word}</span>
			là:
		</p>
		<section class="grid w-[60%] grid-cols-2 gap-4">
			{#each mcqOptions as opt, i}
				<button
					class="{getBtnClass(i)} btn-lg text-xl"
					onclick={(e) => handleMCQChoice(e, opt)}
					disabled={questionState !== 'idle'}
				>
					{opt.meaning}
				</button>
			{/each}
		</section>
	{:else if questionType === 'mcq-meaning-to-kanji'}
		<!-- MCQ: Meaning → Kanji -->
		<p class="text-center text-2xl">
			Kanji nào có âm Hán Việt
			<span class="text-4xl font-bold text-primary">{current.meaning}</span>
			?
		</p>
		<section class="grid w-[60%] grid-cols-2 gap-4">
			{#each mcqOptions as opt, i}
				<button
					class="{getBtnClass(i)} btn-lg text-4xl"
					onclick={(e) => handleMCQChoice(e, opt)}
					disabled={questionState !== 'idle'}
				>
					{opt.word}
				</button>
			{/each}
		</section>
	{:else}
		<!-- Draw Mode -->
		<h2 class="text-center text-2xl">
			Viết chữ Hán có nghĩa:
			<span class="block text-3xl font-bold text-primary">
				{current.meaning}
			</span>
		</h2>

		<KanjiCanvas bind:this={canvasRef} onSubmit={handleDrawSubmit} />

		{#if questionState === 'loading'}
			<div class="flex items-center gap-2">
				<span class="loading loading-spinner"></span>
				<span>Đang nhận dạng...</span>
			</div>
		{:else if questionState === 'correct'}
			<div class="alert alert-success w-auto">
				<span>Chính xác! ✓</span>
			</div>
			<p class="text-sm text-base-content/70">Tự động chuyển câu tiếp...</p>
		{:else if questionState === 'wrong'}
			<div class="alert alert-error w-auto">
				<span>
					Sai rồi! Đáp án:
					<span class="text-2xl font-bold">{current.word}</span>
				</span>
			</div>
			<button class="btn btn-primary" onclick={handleDrawNext}>Tiếp theo</button>
		{/if}
	{/if}
</main>
