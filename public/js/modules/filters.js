// Filter management

import { elements } from './elements.js';
import { state, updateFilters } from './state.js';
import { itemPassesFilters } from './utils.js';
import { renderItems } from './grid-manager.js';

export function updateFiltersAndRender() {
  updateFilters({
    query: elements.search.value.toLowerCase().trim(),
    sources: elements.sourceSelect.value ? [elements.sourceSelect.value] : [],
    group: elements.groupSelect.value === 'all' ? null : elements.groupSelect.value
  });
  
  const filtered = state.items.filter(item => itemPassesFilters(item, state.currentFilters));
  renderItems(filtered);
}

let populateTimeout;
export function populateSourceSelect() {
  clearTimeout(populateTimeout);
  populateTimeout = setTimeout(() => {
    const uniqueSources = new Map();
    state.items.forEach(item => {
      if (item.sourceId && item.sourceName && !uniqueSources.has(item.sourceId)) {
        uniqueSources.set(item.sourceId, item.sourceName);
      }
    });
    
    const sources = Array.from(uniqueSources, ([id, name]) => ({ id, name }));
    sources.sort((a, b) => a.name.localeCompare(b.name));
    
    const currentValue = elements.sourceSelect.value;
    elements.sourceSelect.innerHTML = '<option value="">Tất cả nguồn</option>' + 
      sources.map(s => `<option value="${s.id}"${s.id === currentValue ? ' selected' : ''}>${s.name}</option>`).join('');
  }, 100);
}
