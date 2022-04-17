<script>
	import EntryForm from "./EntryForm.svelte";
	import NavBar from "./NavBar.svelte";
	import TileFeed from "./TileFeed.svelte";
	import { onMount } from "svelte";

	//vars
	let isFormOpen = false;

	let sessions = [];

	//funcs
	function showForm() {
		isFormOpen = true;
	}

	function hideForm() {
		isFormOpen = false;
	}

	//CRUD Funcs
	function addSession(title, text, image1, image2) {
		let session = {
			title,
			text,
			image1,
			image2,
		};
		sessions = [session, ...sessions];
		localStorage.setItem("sessions", JSON.stringify(sessions));
	}

	onMount(() => {
		sessions = localStorage.getItem("sessions")
			? JSON.parse(localStorage.getItem("sessions"))
			: [];
	});
</script>

<div class="container">
	<NavBar {showForm} {isFormOpen} {hideForm} />
	{#if isFormOpen}
		<EntryForm {addSession} />
	{/if}
	<TileFeed />
</div>
