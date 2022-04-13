<script>
	import EntryForm from "./EntryForm.svelte";
	import NavBar from "./NavBar.svelte";
	import TileFeed from "./TileFeed.svelte";

	//vars
	let isFormOpen = false;

	//funcs
	function showForm() {
		isFormOpen = true;
	}

	function hideForm() {
		isFormOpen = false;
	}
</script>

<div class="container">
	<NavBar {showForm} {isFormOpen} {hideForm} />
	{#if isFormOpen}
		<EntryForm />
	{/if}
	<TileFeed />
</div>
