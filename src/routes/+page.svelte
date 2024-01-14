<script>
import PolyLineView from '$lib/components/polyline-view/PolyLineView.svelte';
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="G-code tool for simple lathe" />
</svelte:head>

<section>
	<PolyLineView />
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}
</style>
