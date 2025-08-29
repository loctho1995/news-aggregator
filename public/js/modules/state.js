// Application state management

export const state = {
  loadingInProgress: false,
  currentFilters: {
    query: "",
    sources: [],
    group: null
  },
  currentItem: null,
  currentModalLink: null,
  ttsState: "idle", // "idle", "speaking", "paused"
  ttsRate: 1.0,
  items: [],
  readItems: new Set()
};

export function updateState(updates) {
  Object.assign(state, updates);
}

export function updateFilters(filters) {
  Object.assign(state.currentFilters, filters);
}