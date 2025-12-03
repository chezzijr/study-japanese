<script lang="ts">
	/**
	 * Card Form Component
	 *
	 * Form for creating or editing a flashcard.
	 */

	import type { Flashcard } from '$lib/flashcard';

	const {
		card,
		onSave,
		onCancel
	}: {
		card?: Flashcard;
		onSave: (data: {
			front: string;
			back: string;
			frontReading?: string;
			notes?: string;
			tags?: string[];
		}) => void;
		onCancel: () => void;
	} = $props();

	// Form state
	let front = $state(card?.front ?? '');
	let back = $state(card?.back ?? '');
	let frontReading = $state(card?.frontReading ?? '');
	let notes = $state(card?.notes ?? '');
	let tagsInput = $state(card?.tags?.join(', ') ?? '');

	let isValid = $derived(front.trim().length > 0 && back.trim().length > 0);

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!isValid) return;

		const tags = tagsInput
			.split(',')
			.map((t) => t.trim())
			.filter((t) => t.length > 0);

		onSave({
			front: front.trim(),
			back: back.trim(),
			frontReading: frontReading.trim() || undefined,
			notes: notes.trim() || undefined,
			tags: tags.length > 0 ? tags : undefined
		});
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<!-- Front (Japanese) -->
	<div class="form-control">
		<label class="label" for="card-front">
			<span class="label-text">Mặt trước (tiếng Nhật) *</span>
		</label>
		<textarea
			id="card-front"
			class="textarea textarea-bordered w-full text-lg"
			bind:value={front}
			placeholder="VD: 食べる"
			rows="2"
			required
		></textarea>
	</div>

	<!-- Front Reading -->
	<div class="form-control">
		<label class="label" for="card-reading">
			<span class="label-text">Cách đọc (hiragana)</span>
		</label>
		<input
			id="card-reading"
			type="text"
			class="input input-bordered w-full"
			bind:value={frontReading}
			placeholder="VD: たべる"
		/>
	</div>

	<!-- Back (Vietnamese) -->
	<div class="form-control">
		<label class="label" for="card-back">
			<span class="label-text">Mặt sau (nghĩa) *</span>
		</label>
		<textarea
			id="card-back"
			class="textarea textarea-bordered w-full"
			bind:value={back}
			placeholder="VD: ăn"
			rows="2"
			required
		></textarea>
	</div>

	<!-- Notes -->
	<div class="form-control">
		<label class="label" for="card-notes">
			<span class="label-text">Ghi chú</span>
		</label>
		<textarea
			id="card-notes"
			class="textarea textarea-bordered w-full"
			bind:value={notes}
			placeholder="Ghi chú thêm, ví dụ câu, ngữ pháp..."
			rows="2"
		></textarea>
	</div>

	<!-- Tags -->
	<div class="form-control">
		<label class="label" for="card-tags">
			<span class="label-text">Nhãn (tags)</span>
		</label>
		<input
			id="card-tags"
			type="text"
			class="input input-bordered w-full"
			bind:value={tagsInput}
			placeholder="VD: n5, unit1, động từ (phân cách bằng dấu phẩy)"
		/>
	</div>

	<!-- Preview -->
	{#if front || back}
		<div class="rounded-lg bg-base-200 p-4">
			<div class="mb-2 text-sm text-base-content/60">Xem trước:</div>
			<div class="flex gap-4">
				<div class="flex-1 rounded bg-base-100 p-3 text-center">
					<div class="mb-1 text-xs text-base-content/50">Trước</div>
					{#if frontReading}
						<div class="text-sm text-base-content/60">{frontReading}</div>
					{/if}
					<div class="text-lg font-medium">{front || '...'}</div>
				</div>
				<div class="flex-1 rounded bg-primary p-3 text-center text-primary-content">
					<div class="mb-1 text-xs opacity-60">Sau</div>
					<div class="text-lg font-medium">{back || '...'}</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Actions -->
	<div class="flex justify-end gap-2 pt-4">
		<button type="button" class="btn btn-ghost" onclick={onCancel}> Hủy </button>
		<button type="submit" class="btn btn-primary" disabled={!isValid}>
			{card ? 'Lưu thay đổi' : 'Thêm thẻ'}
		</button>
	</div>
</form>
