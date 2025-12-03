<script lang="ts">
	import type { Stroke } from '$lib/handwriting';
	import { onMount } from 'svelte';

	interface Props {
		width?: number;
		height?: number;
		lineWidth?: number;
		onSubmit: (strokes: Stroke[]) => void;
	}

	let { width = 300, height = 300, lineWidth = 6, onSubmit }: Props = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let isDrawing = $state(false);
	let strokes: Stroke[] = $state([]);
	let currentStroke: { x: number[]; y: number[]; t: number[] } | null = null;
	let strokeStartTime = 0;

	// Theme detection
	let isDarkTheme = $state(false);
	const bgColor = $derived(isDarkTheme ? '#1f2937' : '#ffffff');
	const penColor = $derived(isDarkTheme ? '#ffffff' : '#000000');

	onMount(() => {
		ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.lineWidth = lineWidth;
		}

		// Initial theme detection
		isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dim';
		redraw();

		// Watch for theme changes
		const observer = new MutationObserver(() => {
			isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dim';
			redraw();
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});

		// Ctrl+Z listener
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
				e.preventDefault();
				handleUndo();
			}
		};
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			observer.disconnect();
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	function getPointerPos(e: PointerEvent): { x: number; y: number } {
		const rect = canvas.getBoundingClientRect();
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
	}

	function handlePointerDown(e: PointerEvent) {
		if (!ctx) return;
		canvas.setPointerCapture(e.pointerId);
		isDrawing = true;
		strokeStartTime = Date.now();

		const { x, y } = getPointerPos(e);
		currentStroke = { x: [x], y: [y], t: [0] };

		ctx.strokeStyle = penColor;
		ctx.beginPath();
		ctx.moveTo(x, y);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDrawing || !ctx || !currentStroke) return;

		const { x, y } = getPointerPos(e);
		const t = Date.now() - strokeStartTime;

		currentStroke.x.push(x);
		currentStroke.y.push(y);
		currentStroke.t.push(t);

		ctx.lineTo(x, y);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x, y);
	}

	function handlePointerUp(e: PointerEvent) {
		if (!isDrawing || !currentStroke) return;
		canvas.releasePointerCapture(e.pointerId);
		isDrawing = false;

		// Save the stroke as [x[], y[], t[]]
		strokes = [...strokes, [currentStroke.x, currentStroke.y, currentStroke.t]];
		currentStroke = null;
	}

	function handleClear() {
		strokes = [];
		redraw();
	}

	function handleUndo() {
		if (strokes.length === 0) return;
		strokes = strokes.slice(0, -1);
		redraw();
	}

	function redraw() {
		if (!ctx) return;
		// Fill background
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, width, height);
		// Draw all strokes
		ctx.strokeStyle = penColor;
		ctx.lineWidth = lineWidth;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		for (const stroke of strokes) {
			const [xs, ys] = stroke;
			if (xs.length === 0) continue;
			ctx.beginPath();
			ctx.moveTo(xs[0], ys[0]);
			for (let i = 1; i < xs.length; i++) {
				ctx.lineTo(xs[i], ys[i]);
			}
			ctx.stroke();
		}
	}

	function handleSubmit() {
		if (strokes.length === 0) return;
		onSubmit(strokes);
	}

	export function clear() {
		handleClear();
	}
</script>

<div class="flex flex-col items-center gap-4">
	<canvas
		bind:this={canvas}
		{width}
		{height}
		class="cursor-crosshair touch-none rounded-lg border-2 border-base-content"
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointerleave={handlePointerUp}
	></canvas>
	<div class="flex gap-4">
		<button class="btn btn-outline" onclick={handleClear}>Xóa</button>
		<button class="btn btn-outline" onclick={handleUndo} disabled={strokes.length === 0}>
			Hoàn tác
		</button>
		<button class="btn btn-primary" onclick={handleSubmit} disabled={strokes.length === 0}>
			Kiểm tra
		</button>
	</div>
</div>
