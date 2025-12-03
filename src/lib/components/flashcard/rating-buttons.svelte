<script lang="ts">
	/**
	 * Rating Buttons Component
	 *
	 * 4 buttons for SM-2 rating: Again (1), Hard (2), Good (3), Easy (4)
	 * Shows next interval preview for each rating.
	 */

	import { Rating, formatInterval, previewIntervals, type SM2State } from '$lib/flashcard';

	const {
		state,
		disabled = false,
		onRate
	}: {
		state: SM2State;
		disabled?: boolean;
		onRate: (rating: Rating) => void;
	} = $props();

	// Get preview intervals for display
	let intervals = $derived(previewIntervals(state));

	const buttons = [
		{
			rating: Rating.Again,
			label: 'Quên',
			shortLabel: '1',
			class: 'btn-error',
			description: 'Hoàn toàn không nhớ'
		},
		{
			rating: Rating.Hard,
			label: 'Khó',
			shortLabel: '2',
			class: 'btn-warning',
			description: 'Đúng nhưng khó khăn'
		},
		{
			rating: Rating.Good,
			label: 'Tốt',
			shortLabel: '3',
			class: 'btn-success',
			description: 'Đúng với chút cố gắng'
		},
		{
			rating: Rating.Easy,
			label: 'Dễ',
			shortLabel: '4',
			class: 'btn-info',
			description: 'Nhớ ngay lập tức'
		}
	];

	function handleClick(rating: Rating) {
		if (!disabled) {
			onRate(rating);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (disabled) return;

		const key = e.key;
		if (key >= '1' && key <= '4') {
			e.preventDefault();
			const rating = parseInt(key) as Rating;
			onRate(rating);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="rating-buttons w-full">
	<div class="mb-2 text-center text-sm text-base-content/60">Đánh giá (phím 1-4)</div>
	<div class="grid grid-cols-4 gap-2">
		{#each buttons as btn}
			<button
				class="btn {btn.class} btn-outline flex h-auto flex-col gap-1 py-3"
				{disabled}
				onclick={() => handleClick(btn.rating)}
				title={btn.description}
			>
				<span class="text-lg font-bold">{btn.label}</span>
				<span class="text-xs opacity-70">
					{formatInterval(intervals[btn.rating])}
				</span>
			</button>
		{/each}
	</div>
</div>
