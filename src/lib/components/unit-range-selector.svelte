<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		level: string;
		unitNumbers: string[];
		base: string;
		type: 'vocab' | 'practice';
	}

	const { level, unitNumbers, base, type }: Props = $props();

	// Multi-select mode state
	let isMultiSelect = $state(false);
	let selectedIndices = $state<Set<number>>(new Set());

	// Drag state
	let isDragging = $state(false);
	let dragMode = $state<'select' | 'deselect'>('select');

	// Highlight class based on type
	const highlightClass = type === 'vocab' ? 'btn-primary' : 'btn-secondary';

	// Optimize selected indices to range string (e.g., [0,1,2,4,7,8,9] -> "u1-u3,u5,u8-u10")
	function optimizeToRangeString(sortedIndices: number[]): string {
		if (sortedIndices.length === 0) return '';

		const unitNums = sortedIndices.map((i) => parseInt(unitNumbers[i].replace('u', '')));
		const segments: string[] = [];
		let rangeStart = unitNums[0];
		let rangeEnd = unitNums[0];

		for (let i = 1; i < unitNums.length; i++) {
			if (unitNums[i] === rangeEnd + 1) {
				rangeEnd = unitNums[i];
			} else {
				segments.push(rangeStart === rangeEnd ? `u${rangeStart}` : `u${rangeStart}-u${rangeEnd}`);
				rangeStart = unitNums[i];
				rangeEnd = unitNums[i];
			}
		}
		segments.push(rangeStart === rangeEnd ? `u${rangeStart}` : `u${rangeStart}-u${rangeEnd}`);

		return segments.join(',');
	}

	// Derived selection URL
	const selectionUrl = $derived(() => {
		const sorted = [...selectedIndices].sort((a, b) => a - b);
		return optimizeToRangeString(sorted);
	});

	// Toggle selection for a unit
	function toggleSelection(index: number) {
		if (selectedIndices.has(index)) {
			selectedIndices.delete(index);
		} else {
			selectedIndices.add(index);
		}
		selectedIndices = new Set(selectedIndices);
	}

	// Mouse handlers for drag-to-select
	function handleMouseDown(index: number, e: MouseEvent) {
		if (!isMultiSelect) return;
		e.preventDefault();

		isDragging = true;
		dragMode = selectedIndices.has(index) ? 'deselect' : 'select';
		toggleSelection(index);
	}

	function handleMouseEnter(index: number) {
		if (!isDragging || !isMultiSelect) return;

		if (dragMode === 'select') {
			if (!selectedIndices.has(index)) {
				selectedIndices.add(index);
				selectedIndices = new Set(selectedIndices);
			}
		} else {
			if (selectedIndices.has(index)) {
				selectedIndices.delete(index);
				selectedIndices = new Set(selectedIndices);
			}
		}
	}

	// Touch handlers for mobile drag-to-select
	function handleTouchStart(index: number, e: TouchEvent) {
		if (!isMultiSelect) return;
		e.preventDefault();

		isDragging = true;
		dragMode = selectedIndices.has(index) ? 'deselect' : 'select';
		toggleSelection(index);
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isDragging || !isMultiSelect) return;

		const touch = e.touches[0];
		const element = document.elementFromPoint(touch.clientX, touch.clientY);
		const indexAttr = element?.getAttribute('data-index');

		if (indexAttr !== null && indexAttr !== undefined) {
			const idx = parseInt(indexAttr);
			if (!isNaN(idx)) {
				if (dragMode === 'select') {
					if (!selectedIndices.has(idx)) {
						selectedIndices.add(idx);
						selectedIndices = new Set(selectedIndices);
					}
				} else {
					if (selectedIndices.has(idx)) {
						selectedIndices.delete(idx);
						selectedIndices = new Set(selectedIndices);
					}
				}
			}
		}
	}

	// Mode controls
	function enterMultiSelect() {
		isMultiSelect = true;
		selectedIndices = new Set();
	}

	function cancelMultiSelect() {
		isMultiSelect = false;
		selectedIndices = new Set();
	}

	function selectAll() {
		selectedIndices = new Set(unitNumbers.map((_, i) => i));
	}

	function selectNone() {
		selectedIndices = new Set();
	}

	// Global mouseup/touchend listener
	onMount(() => {
		const handleGlobalUp = () => {
			isDragging = false;
		};

		document.addEventListener('mouseup', handleGlobalUp);
		document.addEventListener('touchend', handleGlobalUp);

		return () => {
			document.removeEventListener('mouseup', handleGlobalUp);
			document.removeEventListener('touchend', handleGlobalUp);
		};
	});
</script>

<div class="mb-4">
	<!-- Control row -->
	<div class="mb-2 flex items-center justify-between gap-2">
		{#if isMultiSelect}
			<div class="flex gap-1">
				<button class="btn btn-ghost btn-xs" onclick={selectAll}>Select All</button>
				<button class="btn btn-ghost btn-xs" onclick={selectNone}>Select None</button>
			</div>
			<div class="flex gap-1">
				<button class="btn btn-ghost btn-xs" onclick={cancelMultiSelect}>Cancel</button>
				{#if selectedIndices.size > 0}
					<a href="{base}/{type}/{level}/{selectionUrl()}" class="btn btn-xs {highlightClass}">
						Go ({selectedIndices.size})
					</a>
				{:else}
					<button class="btn btn-xs btn-disabled" disabled>Go (0)</button>
				{/if}
			</div>
		{:else}
			<div></div>
			<button class="btn btn-ghost btn-xs" onclick={enterMultiSelect}>Multi-select</button>
		{/if}
	</div>

	<!-- Unit buttons container -->
	<div
		class="overflow-x-auto pb-1"
		class:select-none={isDragging}
		ontouchmove={handleTouchMove}
	>
		<div class="inline-flex gap-1" style="min-width: max-content;">
			{#each unitNumbers as unit, i}
				{#if isMultiSelect}
					<button
						data-index={i}
						class="btn btn-xs w-10 {selectedIndices.has(i) ? highlightClass : 'btn-outline'}"
						onmousedown={(e) => handleMouseDown(i, e)}
						onmouseenter={() => handleMouseEnter(i)}
						ontouchstart={(e) => handleTouchStart(i, e)}
					>
						{unit}
					</button>
				{:else}
					<a href="{base}/{type}/{level}/{unit}" class="btn btn-xs w-10 btn-outline">
						{unit}
					</a>
				{/if}
			{/each}

			<!-- "all" button -->
			{#if isMultiSelect}
				<button class="btn btn-xs w-10 {highlightClass}" onclick={selectAll}>all</button>
			{:else}
				<a href="{base}/{type}/{level}/all" class="btn btn-xs w-10 {highlightClass}">all</a>
			{/if}
		</div>
	</div>
</div>
