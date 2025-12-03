<script lang="ts">
	/**
	 * Deck Card Component
	 *
	 * Displays a deck preview with stats and action buttons.
	 */

	import { base } from '$app/paths';
	import type { Deck } from '$lib/flashcard';

	const {
		deck,
		dueCount = 0,
		newCount = 0,
		totalCount = 0,
		onEdit,
		onDelete
	}: {
		deck: Deck;
		dueCount?: number;
		newCount?: number;
		totalCount?: number;
		onEdit?: (deck: Deck) => void;
		onDelete?: (deck: Deck) => void;
	} = $props();

	function handleEdit(e: MouseEvent) {
		e.stopPropagation();
		onEdit?.(deck);
	}

	function handleDelete(e: MouseEvent) {
		e.stopPropagation();
		onDelete?.(deck);
	}
</script>

<div class="card bg-base-200 shadow-md transition-shadow hover:shadow-lg">
	<div class="card-body">
		<div class="flex items-start justify-between">
			<div>
				<h3 class="card-title text-lg">{deck.name}</h3>
				{#if deck.description}
					<p class="mt-1 text-sm text-base-content/60">{deck.description}</p>
				{/if}
			</div>
			<div class="dropdown dropdown-end">
				<button
					tabindex="0"
					class="btn btn-square btn-ghost btn-sm"
					onclick={(e) => e.stopPropagation()}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="h-5 w-5 stroke-current"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
						/>
					</svg>
				</button>
				<ul tabindex="0" class="menu dropdown-content z-10 w-40 rounded-box bg-base-100 p-2 shadow">
					<li><button onclick={handleEdit}>Chỉnh sửa</button></li>
					<li><button onclick={handleDelete} class="text-error">Xóa</button></li>
				</ul>
			</div>
		</div>

		<!-- Stats -->
		<div class="mt-4 flex gap-4 text-sm">
			<div class="flex items-center gap-1">
				<span class="badge badge-primary badge-sm">{newCount}</span>
				<span class="text-base-content/60">Mới</span>
			</div>
			<div class="flex items-center gap-1">
				<span class="badge badge-secondary badge-sm">{dueCount}</span>
				<span class="text-base-content/60">Đến hạn</span>
			</div>
			<div class="flex items-center gap-1">
				<span class="badge badge-ghost badge-sm">{totalCount}</span>
				<span class="text-base-content/60">Tổng</span>
			</div>
		</div>

		<!-- Actions -->
		<div class="card-actions mt-4 justify-end">
			<a href="{base}/flashcard/deck/{deck.id}" class="btn btn-ghost btn-sm"> Xem thẻ </a>
			{#if dueCount > 0 || newCount > 0}
				<a href="{base}/flashcard/deck/{deck.id}/review" class="btn btn-primary btn-sm"> Ôn tập </a>
			{:else}
				<button class="btn btn-primary btn-sm" disabled> Hoàn thành </button>
			{/if}
		</div>
	</div>
</div>
