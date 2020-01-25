import { writable } from "svelte/store";

const initialState = {
  dataset: [],
  types: {},
  selectedType: undefined
};

const STORAGE_KEY = "schemaGenerator";

function getInitialState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      return initialState;
    }
  }
  return initialState;
}

function createSchema() {
  const { subscribe, set, update } = writable(getInitialState());

  return {
    subscribe,
    reset: () => set(initialState),
    setData: dataset =>
      update(state => {
        return { ...state, dataset };
      }),
    selectType: key => update(state => ({ ...state, selectedType: key })),
    updateKey: (oldKey, newKey) =>
      update(state => {
        const newState = { ...state };
        newState.types[newKey] = newState.types[oldKey];
        delete newState.types[oldKey];
        newState.selectedType = newKey;
        return newState;
      }),
    deleteEntry: key =>
      update(state => {
        const types = { ...state.types };
        delete types[key];

        return { ...state, types };
      }),
    createEntry: ({ key, ...rest }) =>
      update(state => {
        const types = { ...state.types };
        types[key] = Object.assign(
          { title: key, name: key },
          types[key] || {},
          rest
        );

        return { ...state, types };
      })
  };
}

export const schema = createSchema();

schema.subscribe(val => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
});
