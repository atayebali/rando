<script>
  import { onMount } from "svelte";
  export let showForm;
  export let isFormOpen;
  export let hideForm;

  onMount(() => {
    document.addEventListener("DOMContentLoaded", function () {
      var elems = document.querySelectorAll(".sidenav");
      var instances = M.Sidenav.init(elems, {});
    });
  });
</script>

<nav>
  <div class="nav-wrapper">
    <!-- svelte-ignore a11y-missing-attribute -->
    <a class="brand-logo">Rando App</a>
    <!-- svelte-ignore a11y-missing-attribute -->
    <a data-target="mobile-demo" class="sidenav-trigger"
      ><i class="material-icons">menu</i>
    </a>
    <ul class="right hide-on-med-and-down">
      <li>
        {#if !isFormOpen}
          <!-- svelte-ignore a11y-missing-attribute -->
          <a class="session" on:click={() => showForm()}>Start a Rando</a>
        {:else}
          <!-- svelte-ignore a11y-missing-attribute -->
          <a class="session" on:click={() => hideForm()}>Close Rando</a>{/if}
      </li>
    </ul>
  </div>
</nav>

<ul class="sidenav" id="mobile-demo">
  <li>
    {#if !isFormOpen}
      <!-- svelte-ignore a11y-missing-attribute -->
      <a class="session" on:click={() => showForm()}>Start a Rando</a>
    {:else}
      <!-- svelte-ignore a11y-missing-attribute -->
      <a class="session" on:click={() => hideForm()}>Close Rando</a>{/if}
  </li>
</ul>
