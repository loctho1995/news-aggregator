// public/js/modules/news-loader.js
import { elements } from './elements.js';
import { state, updateState } from './state.js';
import { addItemToGrid, renderItems } from './grid-manager.js';
import { populateSourceSelect } from './filters.js';
import { batchTranslateItems } from './translator.js';

let currentAbortController = null;
let currentLoadToken = 0;

// External cancel for other modules
export function cancelCurrentLoad() {
  try { currentAbortController?.abort(); } catch {}
  currentAbortController = null;
  currentLoadToken++; // invalidate any in-flight stream
}

// Main loader với BATCH TRANSLATE
export async function loadNews(options = {}) {
  if (state.loadingInProgress) {
    // if a load is in progress, cancel first
    cancelCurrentLoad();
  }

  const shouldClear = options.clear !== false; // default true
  const hoursValue = elements.hours?.value || "24";
  const groupValue = elements.groupSelect?.value || "all";
  const sourceValue = elements.sourceSelect?.value || "";

  // Clear UI if requested
  if (shouldClear) {
    updateState({ items: [] });
    if (elements.grid) elements.grid.innerHTML = "";
    elements.empty?.classList.add("hidden");
  }

  // Badge feedback (reset count to 0)
  const groupText = groupValue === "all"
    ? ""
    : (elements.groupSelect?.options[elements.groupSelect.selectedIndex]?.text || groupValue);
  let liveCount = 0;
  if (elements.badge) {
    elements.badge.textContent = `Đang tải… ${groupText}`.trim();
    elements.badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-yellow-600 text-white border border-yellow-500";
  }

  // Build URL
  const groupParam = groupValue === 'all' ? '' : `&group=${encodeURIComponent(groupValue)}`;
  const sourceParam = sourceValue ? `&sources=${encodeURIComponent(sourceValue)}` : '';
  const url = `/api/news?hours=${encodeURIComponent(hoursValue)}${groupParam}${sourceParam}&stream=true`;

  // Prepare new stream
  cancelCurrentLoad();
  currentAbortController = new AbortController();
  const myToken = ++currentLoadToken;

  try {
    updateState({ loadingInProgress: true });

    const response = await fetch(url, { signal: currentAbortController.signal });
    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`);
    }

    // COLLECT ITEMS FOR BATCH TRANSLATION
    const itemsToTranslate = [];
    const itemsBuffer = [];
    
    // Process stream and collect items that need translation
    const total = await processStreamResponse(response, myToken, async (rawItem) => {
      // Debug: Log received items
      console.log(`Received item from group: ${rawItem.group}, source: ${rawItem.sourceId}`);
      
      // Check if needs translation
      if (['internationaleconomics', 'internationaltech'].includes(rawItem.group)) {
        itemsToTranslate.push(rawItem);
        itemsBuffer.push(rawItem);
        
        // Batch translate every 10 items
        if (itemsToTranslate.length >= 10) {
          console.log(`Translating batch of ${itemsToTranslate.length} items`);
          const translatedBatch = await batchTranslateItems(itemsToTranslate);
          
          // Add translated items to state and render
          for (const translatedItem of translatedBatch) {
            state.items.push(translatedItem);
            addItemToGrid(translatedItem);
            liveCount++;
            
            if (elements.badge && myToken === currentLoadToken) {
              elements.badge.textContent = `Đang tải… ${groupText}${liveCount ? ` • ${liveCount} tin` : ""}`.trim();
            }
          }
          
          // Clear the batch
          itemsToTranslate.length = 0;
        }
      } else {
        // Vietnamese items - add directly
        state.items.push(rawItem);
        addItemToGrid(rawItem);
        liveCount++;
        
        if (elements.badge && myToken === currentLoadToken) {
          elements.badge.textContent = `Đang tải… ${groupText}${liveCount ? ` • ${liveCount} tin` : ""}`.trim();
        }
      }
    });
    
    // Translate remaining items in buffer
    if (itemsToTranslate.length > 0) {
      console.log(`Translating final batch of ${itemsToTranslate.length} items`);
      const translatedBatch = await batchTranslateItems(itemsToTranslate);
      
      for (const translatedItem of translatedBatch) {
        state.items.push(translatedItem);
        addItemToGrid(translatedItem);
        liveCount++;
      }
    }

    // If nothing received, show empty
    if (state.items.length === 0 && elements.empty) {
      elements.empty.classList.remove("hidden");
    }

    // Rebuild source filter options
    populateSourceSelect();

    // Success badge
    if (elements.badge && myToken === currentLoadToken) {
      const finalTotal = state.items.length;
      elements.badge.textContent = `Đã tải xong • ${finalTotal} tin`;
      elements.badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-emerald-600 text-white border border-emerald-500";
    }
  } catch (error) {
    if (error?.name === "AbortError") return; // canceled is expected
    handleLoadError(error);
  } finally {
    if (myToken === currentLoadToken) {
      updateState({ loadingInProgress: false });
      currentAbortController = null;
    }
  }
}

// Stream processor with token guards
async function processStreamResponse(response, token, onItem) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let itemCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (token !== currentLoadToken) { try { reader.cancel(); } catch {} return itemCount; }
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n');
    buffer = parts.pop(); // keep last partial

    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (token !== currentLoadToken) { try { reader.cancel(); } catch {} return itemCount; }

      try {
        const item = JSON.parse(trimmed);
        if (item.error) {
          console.warn("Source failed:", item.sourceId, item.message);
          continue;
        }
        await onItem(item);
        itemCount++;
      } catch (e) {
        console.warn("Bad line:", trimmed.slice(0, 160));
      }
    }
  }

  // Flush remaining buffer
  const last = buffer.trim();
  if (last && token === currentLoadToken) {
    try {
      const item = JSON.parse(last);
      if (!item.error) {
        await onItem(item);
        itemCount++;
      }
    } catch {}
  }

  // After stream complete, render filtered list once
  if (token === currentLoadToken) {
    renderItems(state.items);
  }
  return itemCount;
}

function handleLoadError(error) {
  console.error("Error loading news:", error);
  if (elements.badge) {
    elements.badge.textContent = "Lỗi tải";
    elements.badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-red-600 text-white border border-red-500";
  }
  if (elements.grid) {
    elements.grid.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-slate-400">Không thể tải tin tức. Vui lòng thử lại.</p>
        <button id="retryLoadBtn" class="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
          Thử lại
        </button>
      </div>
    `;
    setTimeout(() => {
      document.getElementById("retryLoadBtn")?.addEventListener("click", () => {
        loadNews({ clear: true });
      });
    }, 0);
  }
}