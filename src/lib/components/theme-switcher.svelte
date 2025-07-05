<script lang="ts">
	import { onMount } from 'svelte';
	import { themeChange } from 'theme-change';

	// NOTE: the element that is using one of the theme attributes must be in the DOM on mount
	onMount(() => {
		themeChange(false);
		// 👆 false parameter is required for svelte
	});
</script>

<div class="fixed ml-4 form-control flex flex-row items-center gap-3">
	<!-- Sun icon for light mode -->
	<svg
		class="h-6 w-6 text-amber-600 transition-colors duration-200 dim:text-yellow-400"
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
		/>
	</svg>

	<!-- Toggle switch -->
	<label class="label cursor-pointer">
		<input
			type="checkbox"
			class="toggle toggle-primary"
			data-toggle-theme="dim,retro"
			data-act-class="toggle--active"
		/>
	</label>

	<!-- Moon icon for dark mode -->
	<svg
		class="h-6 w-6 text-gray-600 transition-colors duration-200 dim:text-gray-200"
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
		/>
	</svg>
</div>
