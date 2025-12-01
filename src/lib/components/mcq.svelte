<script lang="ts">
	import type { WordDefinition, Dictionary } from '$lib/types/vocab';
	import Furigana from './furigana.svelte';
	import { fit } from 'furigana';
	import { fly, fade } from 'svelte/transition';
	import { quintOut, linear } from 'svelte/easing';
	import { onMount } from 'svelte';

	const {
		kotobas
	}: {
		kotobas: Dictionary;
	} = $props();

	let targetIndex = $state(randomIndex());
	let question = $derived(generateOptions(targetIndex));
	let emojiAnim = $state([] as string[]);

	function randomIndex() {
		return Math.floor(Math.random() * kotobas.length);
	}

	function generateOptions(index: number) {
		const type = Math.random() < 0.5 ? 'kotoba-to-meaning' : 'meaning-to-kotoba';
		const indices = [index];
		while (indices.length < 4) {
			const rand = randomIndex();
			if (indices.includes(rand)) continue;
			// no one word multiple meaning or one meaning multiple word
			// to avoid confusion
			if (indices.map((i) => kotobas[i].word).includes(kotobas[rand].word)) continue;
			if (indices.map((i) => kotobas[i].meaning).includes(kotobas[rand].meaning)) continue;
			indices.push(rand);
		}
		return {
			answer: kotobas[index],
			type,
			options: indices.map((i) => kotobas[i]).sort(() => Math.random() - 0.5)
		};
	}

	function nextQuestion() {
		let nextIndex = randomIndex();
		while (nextIndex == targetIndex) nextIndex = randomIndex();
		targetIndex = nextIndex;
	}

	function handleChoice(e: MouseEvent, choice: WordDefinition) {
		const node = e.target as HTMLButtonElement;
		if (choice.word === question.answer.word || choice.meaning === question.answer.meaning) {
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
		{#if question.type === 'kotoba-to-meaning'}
			Nghĩa của <Furigana text={question.answer.word} reading={question.answer.reading} /> là:
		{:else}
			"{question.answer.meaning}" trong tiếng Nhật là:
		{/if}
	</p>
	<section class="grid w-[60%] grid-cols-2 gap-4">
		{#each question.options as opt, i}
			<button class="{getBtnClass(i)} text-xl btn-lg" onclick={(e) => handleChoice(e, opt)}>
				{#if question.type === 'kotoba-to-meaning'}
					{opt.meaning}
				{:else}
					<Furigana text={opt.word} reading={opt.reading} />
				{/if}
			</button>
		{/each}
	</section>
</main>
