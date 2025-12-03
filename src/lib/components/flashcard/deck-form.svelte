<script lang="ts">
	/**
	 * Deck Form Component
	 *
	 * Form for creating or editing a deck.
	 */

	import type { Deck, DeckSettings, CardDirection } from '$lib/flashcard';
	import { DEFAULT_DECK_SETTINGS } from '$lib/flashcard';

	const {
		deck,
		onSave,
		onCancel
	}: {
		deck?: Deck;
		onSave: (data: { name: string; description?: string; settings: DeckSettings }) => void;
		onCancel: () => void;
	} = $props();

	// Form state
	let name = $state(deck?.name ?? '');
	let description = $state(deck?.description ?? '');
	let newCardsPerDay = $state(
		deck?.settings.newCardsPerDay ?? DEFAULT_DECK_SETTINGS.newCardsPerDay
	);
	let reviewsPerDay = $state(deck?.settings.reviewsPerDay ?? DEFAULT_DECK_SETTINGS.reviewsPerDay);
	let defaultDirection = $state<CardDirection>(
		deck?.settings.defaultDirection ?? DEFAULT_DECK_SETTINGS.defaultDirection
	);

	let isValid = $derived(name.trim().length > 0);

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!isValid) return;

		onSave({
			name: name.trim(),
			description: description.trim() || undefined,
			settings: {
				newCardsPerDay,
				reviewsPerDay,
				defaultDirection
			}
		});
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<!-- Name -->
	<div class="form-control">
		<label class="label" for="deck-name">
			<span class="label-text">Tên bộ thẻ *</span>
		</label>
		<input
			id="deck-name"
			type="text"
			class="input input-bordered w-full"
			bind:value={name}
			placeholder="VD: N5 Từ vựng"
			required
		/>
	</div>

	<!-- Description -->
	<div class="form-control">
		<label class="label" for="deck-description">
			<span class="label-text">Mô tả</span>
		</label>
		<textarea
			id="deck-description"
			class="textarea textarea-bordered w-full"
			bind:value={description}
			placeholder="Mô tả ngắn về bộ thẻ (không bắt buộc)"
			rows="2"
		></textarea>
	</div>

	<!-- Settings -->
	<div class="collapse collapse-arrow bg-base-200">
		<input type="checkbox" />
		<div class="collapse-title font-medium">Cài đặt nâng cao</div>
		<div class="collapse-content space-y-4">
			<!-- New cards per day -->
			<div class="form-control">
				<label class="label" for="new-cards">
					<span class="label-text">Thẻ mới mỗi ngày</span>
					<span class="label-text-alt">{newCardsPerDay}</span>
				</label>
				<input
					id="new-cards"
					type="range"
					min="0"
					max="100"
					class="range range-sm"
					bind:value={newCardsPerDay}
				/>
			</div>

			<!-- Reviews per day -->
			<div class="form-control">
				<label class="label" for="reviews">
					<span class="label-text">Ôn tập tối đa mỗi ngày</span>
					<span class="label-text-alt"
						>{reviewsPerDay === 0 ? 'Không giới hạn' : reviewsPerDay}</span
					>
				</label>
				<input
					id="reviews"
					type="range"
					min="0"
					max="500"
					step="10"
					class="range range-sm"
					bind:value={reviewsPerDay}
				/>
			</div>

			<!-- Default direction -->
			<div class="form-control">
				<label class="label">
					<span class="label-text">Hướng ôn tập mặc định</span>
				</label>
				<select class="select select-bordered w-full" bind:value={defaultDirection}>
					<option value="viet-to-jp">Việt → Nhật (nhớ từ)</option>
					<option value="jp-to-viet">Nhật → Việt (nhận biết)</option>
					<option value="random">Ngẫu nhiên</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex justify-end gap-2 pt-4">
		<button type="button" class="btn btn-ghost" onclick={onCancel}> Hủy </button>
		<button type="submit" class="btn btn-primary" disabled={!isValid}>
			{deck ? 'Lưu' : 'Tạo bộ thẻ'}
		</button>
	</div>
</form>
