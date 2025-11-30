<script lang="ts">
	/**
	 * Flashcard Card Component
	 *
	 * A flip card with 3D animation for flashcard review.
	 * Click or press space to flip the card.
	 */

	const {
		front,
		back,
		frontReading,
		backReading,
		flipped = false,
		onFlip
	}: {
		front: string;
		back: string;
		frontReading?: string;
		backReading?: string;
		flipped?: boolean;
		onFlip?: () => void;
	} = $props();

	function handleClick() {
		onFlip?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			onFlip?.();
		}
	}

	// Split multiline content
	function splitLines(text: string): string[] {
		return text.split('\n').filter((line) => line.trim());
	}
</script>

<div
	class="flashcard-container mx-auto w-full max-w-md cursor-pointer select-none"
	onclick={handleClick}
	onkeydown={handleKeydown}
	role="button"
	tabindex="0"
>
	<div class="flashcard {flipped ? 'flipped' : ''}">
		<!-- Front Face -->
		<div class="flashcard-face flashcard-front card bg-base-200 shadow-xl">
			<div class="card-body flex h-full items-center justify-center text-center">
				{#if frontReading}
					<div class="text-base-content/60 mb-2 text-sm">
						{frontReading}
					</div>
				{/if}
				<div class="text-3xl font-bold">
					{front}
				</div>
				<div class="text-base-content/50 mt-4 text-sm">
					Nhấn để lật thẻ
				</div>
			</div>
		</div>

		<!-- Back Face -->
		<div class="flashcard-face flashcard-back card bg-primary text-primary-content shadow-xl">
			<div class="card-body flex h-full items-center justify-center text-center">
				{#if backReading}
					<div class="mb-2 text-sm opacity-70">
						{backReading}
					</div>
				{/if}
				<div class="space-y-2">
					{#each splitLines(back) as line, i}
						<div class={i === 0 ? 'text-2xl font-bold' : 'text-lg opacity-90'}>
							{line}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.flashcard-container {
		perspective: 1000px;
		height: 300px;
	}

	.flashcard {
		position: relative;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.flashcard.flipped {
		transform: rotateY(180deg);
	}

	.flashcard-face {
		position: absolute;
		width: 100%;
		height: 100%;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}

	.flashcard-back {
		transform: rotateY(180deg);
	}
</style>
