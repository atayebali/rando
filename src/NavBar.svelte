<script>
  import { onMount } from "svelte";

  onMount(() => {
    document.addEventListener("DOMContentLoaded", function () {
      var elems = document.querySelectorAll(".sidenav");
      var instances = M.Sidenav.init(elems, {});
    });
  });
</script>

<nav>
  <div class="nav-wrapper">
    <a href="#!" class="brand-logo">Rando App</a>
    <a href="#" data-target="mobile-demo" class="sidenav-trigger"
      ><i class="material-icons">menu</i>
    </a>
    <ul class="right hide-on-med-and-down">
      <li>
        <a href="#" class="session">Start a Rando</a>
      </li>
    </ul>
  </div>
</nav>

<ul class="sidenav" id="mobile-demo">
  <li>
    <a href="#" class="session"
      ><i class="material-icons">add</i>Start a Rando</a
    >
  </li>
</ul>
