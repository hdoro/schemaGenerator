<script>
  import { schema } from "./store.js";

  $: key = $schema.selectedType;
  $: type = key && $schema.types[key];
  $: typeLabel = type.type === "document" ? "Document" : "Object";

  function updateProp(name, value) {
    const { key, isDoc } = type;
    schema.createEntry({ key, isDoc, [name]: value });
  }

  // When updating a key, we need to create a new entry as well as delete the previous one and finally select the new one
  function updateKey(oldKey, newKey) {
    schema.createEntry({ isDoc: type.isDoc, key: newKey, ...expandedType });
    schema.deleteEntry(type);
  }
</script>

<style>
  section {
    position: sticky;
    top: 0;
    align-self: flex-start;
    flex: 1;
    max-width: 40rem;
  }
  .fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    grid-gap: 1rem;
  }
  .fields p {
    margin: 0 0 .5em;
  }
  .fields > div {
    background: white;
    padding: .75em;
    box-shadow: 1px 1px 3px rgba(0,0,0,.16);
    text-align: center;
  }
</style>

<section>
  <h2>{type.title} - typeLabel - {type.fields.length} fields</h2>

  <form action="">
    <div>
      <label for="key">{typeLabel}'s key</label>
      <input
        id="key"
        name="key"
        value={key}
        on:input={e => schema.updateKey(key, e.target.value)} />
    </div>
    <div>
      <label for="title">{key}'s title</label>
      <input
        id="title"
        name="title"
        value={type.title}
        on:input={e => schema.createEntry({
            ...type,
            key,
            title: e.target.value,
          })} />
    </div>
  </form>
    <h3>{type.title}'s fields</h3>
  <div class="fields">
  {#each type.fields as field}
    <div>
      <h4>{field.title}</h4>
      <p><strong>Name</strong>: {field.name}</p>
      <p><strong>Type</strong>: {field.type}</p>
    </div>
  {/each}
  </div>
</section>
