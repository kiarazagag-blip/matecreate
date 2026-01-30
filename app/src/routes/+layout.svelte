<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Nebulica', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #d06622;
		color: rgba(255, 255, 255, 0.85);
	}
</style>
