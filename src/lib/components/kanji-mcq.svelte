<script lang="ts">
	import { fly } from 'svelte/transition';
	import { quintOut, linear } from 'svelte/easing';

	interface KanjiItem {
		word: string;
		meaning: string;
		meaning_resolution?: string;
	}

	const {
		kanjis
	}: {
		kanjis: KanjiItem[];
	} = $props();

	// Deduplicate by word to avoid same-answer options
	const uniqueKanjis = [...new Map(kanjis.map((k) => [k.word, k])).values()];

	let targetIndex = $state(randomIndex());
	let question = $derived(generateOptions(targetIndex));
	let emojiAnim = $state([] as string[]);

	function randomIndex() {
		return Math.floor(Math.random() * uniqueKanjis.length);
	}

	function generateOptions(index: number) {
		const indices = [index];
		while (indices.length < 4) {
			const rand = randomIndex();
			if (indices.includes(rand)) continue;
			// Avoid same meaning (Sino-Vietnamese reading)
			if (uniqueKanjis[rand].meaning === uniqueKanjis[index].meaning) continue;
			indices.push(rand);
		}
		return {
			answer: uniqueKanjis[index],
			options: indices.map((i) => uniqueKanjis[i]).sort(() => Math.random() - 0.5)
		};
	}

	function nextQuestion() {
		let nextIndex = randomIndex();
		while (nextIndex === targetIndex) nextIndex = randomIndex();
		targetIndex = nextIndex;
	}

	function handleChoice(e: MouseEvent, choice: KanjiItem) {
		const node = e.target as HTMLButtonElement;
		if (choice.meaning === question.answer.meaning) {
			node.animate(
				[{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }],
				{
					duration: 500,
					easing: 'ease'
				}
			);
			setTimeout(() => {
				nextQuestion();
			}, 500);
		} else {
			node.animate(
				[
					{ transform: 'translateX(10px)' },
					{ transform: 'translateX(-10px)' },
					{ transform: 'translateX(0)' },
					{ transform: 'translateX(10px)' },
					{ transform: 'translateX(-10px)' },
					{ transform: 'translateX(0)' }
				],
				{
					duration: 500,
					easing: 'ease'
				}
			);
			const newId = Date.now().toString();
			emojiAnim = [...emojiAnim, newId];
			setTimeout(() => {
				emojiAnim = emojiAnim.filter((id) => id !== newId);
			}, 2000);
		}
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

{#each emojiAnim as id (id)}
	<div
		class="fixed left-[calc(50vw-15px)] top-1/4 text-3xl"
		in:fly={{ y: 300, duration: 1000, easing: quintOut, opacity: 0 }}
		out:fly={{ y: -200, duration: 1000, easing: linear, opacity: 0 }}
	>
		{randomWrongEmoji()}
	</div>
{/each}
<main class="flex h-[95vh] w-screen flex-col items-center justify-center gap-10">
	<p class="text-2xl">
		Âm Hán Việt của
		<span class="text-4xl font-bold text-primary">{question.answer.word}</span>
		là:
	</p>
	<section class="grid w-[60%] grid-cols-2 gap-4">
		{#each question.options as opt, i}
			<button class="{getBtnClass(i)} btn-lg text-xl" onclick={(e) => handleChoice(e, opt)}>
				{opt.meaning}
			</button>
		{/each}
	</section>
</main>
