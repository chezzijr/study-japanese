<script lang="ts">
	let { word, ans } = $props();
	let input = $state('');

	function randomInputColor() {
		const colors = [
			'input-primary',
			'input-secondary',
			'input-accent',
			'input-info',
			'input-success',
			'input-warning',
			'input-error'
		];
		return colors[Math.floor(Math.random() * colors.length)];
	}

	function handleCheck() {
		if (input === ans) {
			alert('Chính xác');
		} else {
			alert('Sai rồi');
		}
	}

	let inputColor = $state(randomInputColor());
</script>

<h1>Từ này là gì: {word}</h1>
<input
	type="text"
	placeholder="Type here"
	class={`input input-bordered ${inputColor} w-full max-w-xs`}
/>
<button class="btn btn-primary" onclick={handleCheck}>Chốt</button>
