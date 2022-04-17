<script>
  export let sessions;
  import Tile from "./Tile.svelte";
</script>

<div class="feed">
  {#each sessions as session}
    <Tile {...session} />
  {/each}
</div>

<style>
  .feed {
    padding-top: 40px;
  }
</style>
