<script lang="ts">
	interface Props {
		level: string;
		unitNumbers: string[];
		base: string;
		type: 'vocab' | 'practice';
	}

	const { level, unitNumbers, base, type }: Props = $props();

	// State for dual-handle range slider (using array indices)
	let minIdx = $state(0);
	let maxIdx = $state(unitNumbers.length - 1);

	// Ensure minIdx <= maxIdx
	function handleMinInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = parseInt(target.value);
		if (val > maxIdx) {
			minIdx = maxIdx;
			maxIdx = val;
		} else {
			minIdx = val;
		}
	}

	function handleMaxInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = parseInt(target.value);
		if (val < minIdx) {
			maxIdx = minIdx;
			minIdx = val;
		} else {
			maxIdx = val;
		}
	}

	// Check if unit at index is in selected range
	function isInRange(index: number): boolean {
		return index >= minIdx && index <= maxIdx;
	}

	// Generate range string for URL
	const rangeStr = $derived(() => {
		const minUnit = unitNumbers[minIdx];
		const maxUnit = unitNumbers[maxIdx];
		if (minIdx === maxIdx) {
			return minUnit;
		}
		return `${minUnit}-${maxUnit}`;
	});

	const rangeUrl = $derived(`${base}/${type}/${level}/${rangeStr()}`);

	// Highlight class based on type
	const highlightClass = type === 'vocab' ? 'btn-primary' : 'btn-secondary';

	// Calculate slider fill position
	const fillLeft = $derived((minIdx / (unitNumbers.length - 1)) * 100);
	const fillWidth = $derived(((maxIdx - minIdx) / (unitNumbers.length - 1)) * 100);
</script>

<div class="mb-4">
	<!-- Horizontally scrollable container -->
	<div class="overflow-x-auto pb-1">
		<div class="inline-flex flex-col" style="min-width: max-content;">
			<!-- Row of unit buttons -->
			<div class="flex gap-1">
				{#each unitNumbers as unit, i}
					<a
						href="{base}/{type}/{level}/{unit}"
						class="btn btn-xs w-10 {isInRange(i) ? highlightClass : 'btn-outline'}"
					>
						{unit}
					</a>
				{/each}
				<a
					href="{base}/{type}/{level}/all"
					class="btn btn-xs w-10 {type === 'vocab' ? 'btn-primary' : 'btn-secondary'}"
				>
					all
				</a>
			</div>

			<!-- Range slider below (hidden on small screens) -->
			<div class="slider-wrapper hidden" style="width: calc({unitNumbers.length} * 2.5rem + ({unitNumbers.length} - 1) * 0.25rem);">
				<div class="range-slider-container relative mt-2 h-6">
					<!-- Track background -->
					<div class="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-base-300"></div>

					<!-- Fill between thumbs -->
					<div
						class="absolute top-1/2 h-2 -translate-y-1/2 rounded-full {type === 'vocab' ? 'bg-primary' : 'bg-secondary'}"
						style="left: {fillLeft}%; width: {fillWidth}%;"
					></div>

					<!-- Min slider -->
					<input
						type="range"
						min="0"
						max={unitNumbers.length - 1}
						value={minIdx}
						oninput={handleMinInput}
						class="range-thumb absolute w-full"
					/>

					<!-- Max slider -->
					<input
						type="range"
						min="0"
						max={unitNumbers.length - 1}
						value={maxIdx}
						oninput={handleMaxInput}
						class="range-thumb absolute w-full"
					/>
				</div>
			</div>
		</div>
	</div>

	<!-- Range action button (hidden on small screens) -->
	<a href={rangeUrl} class="range-btn btn btn-sm mt-2 hidden {highlightClass}">
		Range ({rangeStr()})
	</a>
</div>

<style>
	/* Overlay both range inputs */
	.range-thumb {
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		pointer-events: none;
		height: 1.5rem;
	}

	/* Style the thumb - Webkit (Chrome, Safari, Edge) */
	.range-thumb::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		pointer-events: auto;
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		background: oklch(var(--bc));
		border: 2px solid oklch(var(--b1));
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: transform 0.1s ease;
	}

	.range-thumb::-webkit-slider-thumb:hover {
		transform: scale(1.15);
	}

	/* Style the thumb - Firefox */
	.range-thumb::-moz-range-thumb {
		pointer-events: auto;
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		background: oklch(var(--bc));
		border: 2px solid oklch(var(--b1));
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: transform 0.1s ease;
	}

	.range-thumb::-moz-range-thumb:hover {
		transform: scale(1.15);
	}

	/* Remove track styling */
	.range-thumb::-webkit-slider-runnable-track {
		background: transparent;
	}

	.range-thumb::-moz-range-track {
		background: transparent;
	}

	/* Focus state for accessibility */
	.range-thumb:focus {
		outline: none;
	}

	.range-thumb:focus::-webkit-slider-thumb {
		box-shadow: 0 0 0 3px oklch(var(--p) / 0.3);
	}

	.range-thumb:focus::-moz-range-thumb {
		box-shadow: 0 0 0 3px oklch(var(--p) / 0.3);
	}

	/* Show slider and range button only on screens >= 1250px */
	@media (min-width: 1250px) {
		:global(.slider-wrapper),
		:global(.range-btn) {
			display: block !important;
		}
	}
</style>
