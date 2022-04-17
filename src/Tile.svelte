<script>
  export let title;
  export let text;
  export let image1;
  export let image2;
</script>

<div class="col s12 m7">
  <h2 class="header">{title}</h2>
  <div class="card horizontal">
    <div class="card-image">
      <img src={image1} alt="object" />
      <img src={image2} alt="object" />
    </div>
    <div class="card-stacked">
      <div class="card-content">
        {text}
      </div>
      <div class="card-action">
        <!-- svelte-ignore a11y-invalid-attribute -->
        <a href="#">This is a link</a>
      </div>
    </div>
  </div>
</div>
