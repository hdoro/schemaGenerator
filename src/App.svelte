<script>
  import Editor from './Editor.svelte'
  import { schema } from "./store.js";
  import {
    IGNORED_TYPES,
    INTERNAL_PROPERTIES,
    STANDARD_OBJ_TYPES,
    getFields,
    saveFile,
    zipAll
  } from "./utils.js";

  const setData = e => {
    schema.setData(e.target.value);
  };

  const generate = () => {
    let dataset = $schema.dataset;
    try {
      dataset = JSON.parse($schema.dataset);
    } catch (err) {
      console.error("Invalid data type!");
      return;
    }
    if (!dataset || !Array.isArray(dataset)) {
      return;
    }
    for (const doc of dataset) {
      if (IGNORED_TYPES.indexOf(doc._type) > -1) {
        continue;
      }
      const fields = getFields(doc, schema.createEntry);
      schema.createEntry({ type: 'document', key: doc._type, fields });
    }
  };

  const downloadSchema = () => {
    zipAll($schema.types);
  };
</script>

<style>
  :global(body) {
    min-height: 100%;
    display: flex;
  }

  main {
    background: #f2f2f2;
    flex: 1;
    padding: 1rem;
    display: flex;
  }
  aside {
    padding: 1rem;
    position: sticky;
    top: 0;
    align-self: flex-start;
  }
  textarea {
    display: block;
    width: 100%;
    min-width: 300px;
  }
</style>

<aside>

  <div>
    <label for="dataset">Your dataset</label>
    <textarea
      id="dataset"
      name="dataset"
      on:input={setData}
      value={$schema.dataset}
      rows={20} />

    <button on:click={generate}>✨ Generate schema!</button>
  </div>

  <p>
    <button on:click={schema.reset}>↩ Reset schema</button>
  </p>
  <p>
    <button on:click={downloadSchema}>💾 Download schema</button>
  </p>
</aside>

<main>
  <section>
    <h1>Generated types</h1>
    {#each Object.keys($schema.types) as key (key)}
      <p>
        <strong>{key}</strong>
        : {$schema.types[key].fields.length} fields.
        <button
          on:click={() => schema.selectType(key)}>
          Edit
        </button>
        <!-- <button
          on:click={() => saveFile(`export default ${JSON.stringify($schema.documents[key], null, 2)}`, `${key}.js`)}>
          Download
        </button> -->
      </p>
    {:else}
      <p>No types added!</p>
    {/each}
  </section>
  {#if $schema.selectedType}
    <Editor />
  {/if}
</main>
