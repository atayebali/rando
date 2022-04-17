<script>
  import { onMount } from "svelte";
  export let addSession;

  export let title;
  export let text;
  export let image1;
  export let image2;
  //Funcs

  function handleSubmit() {
    addSession(title, text, image1, image2);
    console.log("session added");
  }

  onMount(() => {
    image1 = "https://picsum.photos/200/200";
    image2 = "https://picsum.photos/200/200";
  });
</script>

<div class="row">
  <form action="" class="col s12" on:submit|preventDefault={handleSubmit}>
    <div class="divider" />
    <div class="row">
      <div class="section">
        <div class="col s12"><h5>Do it</h5></div>
        <div class="col s6">
          <img src={image1} alt="" />
          <input type="hidden" id="image1" value={image1} />
        </div>
        <div class="col s6">
          <img src={image2} alt="" />
          <input type="hidden" id="image2" value={image2} />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="input-field col s12">
        <input
          placeholder="Title"
          id="title"
          type="text"
          class="validate"
          bind:value={title}
        />
      </div>
    </div>
    <div class="row">
      <div class="input-field col s12">
        <textarea id="text" class="materialize-textarea" bind:value={text} />
        <label for="textarea1">Textarea</label>
      </div>
    </div>

    <button class="btn waves-effect waves-light" type="submit" name="action"
      >Submit
      <i class="material-icons right">send</i>
    </button>
  </form>
</div>
