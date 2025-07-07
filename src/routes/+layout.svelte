<script lang="ts">
	import '../app.css';
	import ThemeSwitcher from '$lib/components/theme-switcher.svelte';
	let { children } = $props();
</script>

<ThemeSwitcher />
{@render children()}
