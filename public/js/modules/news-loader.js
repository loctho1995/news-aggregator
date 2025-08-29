// News loading logic

import { elements } from './elements.js';
import { state, updateState } from './state.js';
import { addItemToGrid, renderItems } from './grid-manager.js';
import { populateSourceSelect } from './filters.js';

export async function loadNews() {
  if (state.loadingInProgress) return;
  
  try {
    updateState({ 
      loadingInProgress: true,
      items: []
    });
    
    elements.grid.innerHTML = "";
    elements.empty.classList.add("hidden");
    
    elements.badge.textContent = "Đang tải…";
    elements.badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-yellow-600 text-white border border-yellow-500";
    
    const selectedGroup = elements.groupSelect.value === 'all' ? '' : `&group=${elements.groupSelect.value}`;
    const hoursValue = elements.hours.value || "24";
    
    const response = await fetch(`/api/news?hours=${hoursValue}${selectedGroup}&stream=true`);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    await processStreamResponse(response);
    
  } catch (error) {
    handleLoadError(error);
  } finally {
    updateState({ loadingInProgress: false });
  }
}

async function processStreamResponse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let itemCount = 0;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const item = JSON.parse(line);
        
        if (item.error) {
          console.warn(`Source ${item.sourceId} failed: ${item.message}`);
          continue;
        }
        
        state.items.push(item);
        itemCount++;
        
        addItemToGrid(item);
        
        elements.badge.textContent = `${itemCount} bài`;
        
      } catch (e) {
        continue;
      }
    }
  }
  
  elements.badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-emerald-600 text-white border border-emerald-500";
  
  populateSourceSelect();
  
  if (itemCount === 0) {
    elements.empty.classList.remove("hidden");
  }
}

function handleLoadError(error) {
  console.error("Error loading news:", error);
  elements.badge.textContent = "Lỗi tải";
  elements.badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-red-600 text-white border border-red-500";
  
  elements.grid.innerHTML = `
    <div class="col-span-full text-center py-8">
      <p class="text-slate-400">Không thể tải tin tức. Vui lòng thử lại.</p>
      <button onclick="loadNews()" class="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
        Thử lại
      </button>
    </div>
  `;
}