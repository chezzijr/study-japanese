<script lang="ts">
	import '../app.css';
	import ThemeSwitcher from '$lib/components/theme-switcher.svelte';
	let { children } = $props();
</script>

<div class="flex items-center justify-between px-4">
	<a href="/" class="btn btn-ghost btn-sm" aria-label="Home">
		<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
		</svg>
	</a>
	<ThemeSwitcher />
</div>
{@render children()}
