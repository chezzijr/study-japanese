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

<div class="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
	<div class="card-body">
		<div class="flex items-start justify-between">
			<div>
				<h3 class="card-title text-lg">{deck.name}</h3>
				{#if deck.description}
					<p class="text-base-content/60 text-sm mt-1">{deck.description}</p>
				{/if}
			</div>
			<div class="dropdown dropdown-end">
				<button tabindex="0" class="btn btn-ghost btn-sm btn-square" onclick={(e) => e.stopPropagation()}>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-5 h-5 stroke-current">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
					</svg>
				</button>
				<ul tabindex="0" class="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-40">
					<li><button onclick={handleEdit}>Chỉnh sửa</button></li>
					<li><button onclick={handleDelete} class="text-error">Xóa</button></li>
				</ul>
			</div>
		</div>

		<!-- Stats -->
		<div class="flex gap-4 mt-4 text-sm">
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
		<div class="card-actions justify-end mt-4">
			<a href="{base}/flashcard/deck/{deck.id}" class="btn btn-ghost btn-sm">
				Xem thẻ
			</a>
			{#if dueCount > 0 || newCount > 0}
				<a href="{base}/flashcard/deck/{deck.id}/review" class="btn btn-primary btn-sm">
					Ôn tập
				</a>
			{:else}
				<button class="btn btn-primary btn-sm" disabled>
					Hoàn thành
				</button>
			{/if}
		</div>
	</div>
</div>
