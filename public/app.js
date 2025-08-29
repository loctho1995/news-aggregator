// VN NEWS AGGREGATOR - APP.JS - COMPLETE VERSION WITH PARAGRAPH SUMMARY

// ===== UI ELEMENTS =====
// Modal elements
const modal = document.getElementById("modal");
const modalOverlay = document.getElementById("modalOverlay");
const modalPanel = document.getElementById("modalPanel");
const modalClose = document.getElementById("modalClose");
const modalTitle = document.getElementById("modalTitle");
const modalSource = document.getElementById("modalSource");
const modalOpenLink = document.getElementById("modalOpenLink");

// Summary controls
const summaryPercent = document.getElementById("summaryPercent");
const regenerateBtn = document.getElementById("regenerateBtn");
const summaryArea = document.getElementById("summaryArea");
const summaryLoading = document.getElementById("summaryLoading");
const summaryList = document.getElementById("summaryList");
const summaryStats = document.getElementById("summaryStats");
const translatedBadge = document.getElementById("translatedBadge");

// TTS elements
const btnSpeak = document.getElementById("btnSpeak");
const btnStopSpeak = document.getElementById("btnStopSpeak");
const ttsRateBox = document.getElementById("ttsRateBox");
const rateRange = document.getElementById("rateRange");
const rateLabel = document.getElementById("rateLabel");

// Main app elements
const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const badge = document.getElementById("badge");
const search = document.getElementById("search");
const sourceSelect = document.getElementById("sourceSelect");
const groupSelect = document.getElementById("groupSelect");
const hours = document.getElementById("hours");
const refreshBtn = document.getElementById("refreshBtn");

// ===== STATE VARIABLES =====
let loadingInProgress = false;
let currentFilters = {
  query: "",
  sources: [],
  group: null
};

let currentItem = null;
let currentModalLink = null;
let ttsState = "idle"; // "idle", "speaking", "paused"
let ttsRate = 1.0;
let items = [];
let readItems = new Set();

// ===== LOCAL STORAGE FUNCTIONS =====
function loadReadItems() {
  try {
    const stored = localStorage.getItem('readItems');
    if (stored) {
      readItems = new Set(JSON.parse(stored));
    }
  } catch (e) {
    console.warn('Could not load read items:', e);
    readItems = new Set();
  }
}

function saveReadItems() {
  try {
    localStorage.setItem('readItems', JSON.stringify([...readItems]));
  } catch (e) {
    console.warn('Could not save read items:', e);
  }
}

// ===== MODAL FUNCTIONS =====

// Open summary modal
function openSummaryModal(item, link) {
  currentModalLink = link;
  currentItem = item;
  
  modalTitle.textContent = item?.title || "Tóm tắt";
  modalSource.textContent = item?.sourceName ? `Nguồn: ${item.sourceName}` : "";
  modalOpenLink.href = link;

  resetModalUI();
  loadSummary(item, link);
  markRead(link);

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  modal.scrollTop = 0;
  if (modalPanel) modalPanel.scrollTop = 0;
  if (summaryArea) summaryArea.scrollTop = 0;
}

// Reset modal UI
function resetModalUI() {
  summaryLoading.classList.remove("hidden");
  summaryList.classList.add("hidden");
  summaryStats.classList.add("hidden");
  summaryList.innerHTML = "";
  
  if (ttsSupported()) {
    window.speechSynthesis.cancel();
    ttsState = "idle";
    btnSpeak.textContent = "🔊 Đọc to";
    btnSpeak.classList.add("hidden");
    btnStopSpeak.classList.add("hidden");
    if (ttsRateBox) ttsRateBox.classList.add("hidden");
    setRateUI(ttsRate);
  }
}

// Render summary content - ENHANCED VERSION
function renderSummaryContent({ bullets, paragraphs, fallbackText }) {
  // Ưu tiên hiển thị theo đoạn văn nếu có
  if (paragraphs && paragraphs.length > 0) {
    return renderParagraphSummary(paragraphs);
  }
  
  // Fallback về bullets nếu có
  if (bullets && bullets.length > 0) {
    return renderBulletSummary(bullets);
  }
  
  // Fallback cuối cùng
  return fallbackText ? 
    `<p class="text-gray-700 text-lg">${fallbackText}</p>` : 
    `<p class="text-gray-500 italic text-lg">Không có nội dung tóm tắt.</p>`;
}

// Render tóm tắt theo đoạn văn
function renderParagraphSummary(paragraphs) {
  if (!paragraphs || paragraphs.length === 0) return "";
  
  return paragraphs.map((paragraph, index) => {
    return `
      <div class="mb-4 p-4 bg-white/60 rounded-lg border-l-4 border-emerald-500 hover:bg-white/80 transition-colors">
        <p class="text-gray-800 leading-relaxed text-lg">${paragraph}</p>
      </div>
    `;
  }).join('');
}

// Render tóm tắt dạng bullets (backward compatibility)
function renderBulletSummary(bullets) {
  return bullets.map(bullet => `
    <div class="mb-3 p-4 bg-white/50 rounded-lg border-l-4 border-emerald-500">
      <p class="text-gray-800 leading-relaxed text-lg">${bullet}</p>
    </div>
  `).join('');
}

// Load summary với paragraph support
function loadSummary(item, link) {
  const percent = summaryPercent.value || "70";
  
  summaryLoading.textContent = `Đang tóm tắt ${percent}% nội dung...`;
  summaryLoading.classList.remove("hidden");
  summaryList.classList.add("hidden");
  summaryStats.classList.add("hidden");
  
  const url = `/api/summary?url=${encodeURIComponent(link)}&percent=${percent}`;
  
  fetch(url)
    .then(async (r) => {
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      
      // Cập nhật thông tin tóm tắt
      if (j.percentage !== undefined) {
        const percentColor = j.percentage > 70 ? "text-orange-600" : 
                           j.percentage > 40 ? "text-yellow-600" : "text-emerald-600";
        const sizeInfo = j.originalLength ? ` (${j.summaryLength}/${j.originalLength} ký tự)` : "";
        const translatedText = j.translated ? ` • 🌐 Đã dịch` : "";
        
        modalSource.innerHTML = `
          <span>Nguồn: ${item.sourceName || ""}</span>
          <span class="mx-2">•</span>
          <span class="${percentColor}">Tóm tắt ${j.percentage}%${sizeInfo}</span>
          ${translatedText}
        `;
      }
      
      // Render nội dung với paragraph support
      const html = renderSummaryContent({
        paragraphs: j.paragraphs || null,
        bullets: j.bullets || [],
        fallbackText: j.fullSummary || item.summary || "",
      });
      
      summaryList.innerHTML = html;
      summaryLoading.classList.add("hidden");
      summaryList.classList.remove("hidden");
      
      // Hiển thị stats
      summaryStats.classList.remove("hidden");
      
      if (j.translated) {
        translatedBadge.style.display = 'flex';
      } else {
        translatedBadge.style.display = 'none';
      }
      
      // Enable TTS buttons
      if (ttsSupported()) {
        btnSpeak.classList.remove("hidden");
        btnStopSpeak.classList.remove("hidden");
        if (ttsRateBox) ttsRateBox.classList.remove("hidden");
      }
      
      if (summaryArea) summaryArea.scrollTop = 0;
    })
    .catch((err) => {
      console.error('Summary error:', err);
      const html = renderSummaryContent({
        paragraphs: null,
        bullets: [],
        fallbackText: item.summary || "Không thể tải tóm tắt.",
      });
      summaryList.innerHTML = html;
      summaryLoading.classList.add("hidden");
      summaryList.classList.remove("hidden");
      
      if (ttsSupported()) {
        btnSpeak.classList.remove("hidden");
        btnStopSpeak.classList.remove("hidden");
        if (ttsRateBox) ttsRateBox.classList.remove("hidden");
      }
      
      if (summaryArea) summaryArea.scrollTop = 0;
    });
}

// Close modal
function closeModal() {
  if (ttsSupported()) {
    window.speechSynthesis.cancel();
    ttsState = "idle";
    btnSpeak.textContent = "🔊 Đọc to";
  }
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  currentItem = null;
  currentModalLink = null;
}

// ===== TTS FUNCTIONS =====
function ttsSupported() {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function setRateUI(rate) {
  if (rateRange) rateRange.value = rate;
  if (rateLabel) rateLabel.textContent = `${rate}x`;
}

// ===== READ STATUS FUNCTIONS =====
function markRead(url) {
  if (readItems.has(url)) return;
  
  readItems.add(url);
  saveReadItems();
  
  const card = document.querySelector(`[data-url="${CSS.escape(url)}"]`);
  if (card) {
    card.classList.add("opacity-60");
    card.classList.add("read");
    
    const readStatusBtn = card.querySelector('.read-status-btn');
    if (readStatusBtn) {
      readStatusBtn.innerHTML = '✅ Đã đọc';
      readStatusBtn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
      readStatusBtn.classList.add('bg-green-600', 'hover:bg-green-500');
    }
    
    // Chuyển card xuống cuối danh sách ngay lập tức
    grid.appendChild(card);
  }
}

function toggleReadStatus(url) {
  if (readItems.has(url)) {
    // Mark as unread
    readItems.delete(url);
    saveReadItems();
    
    const card = document.querySelector(`[data-url="${CSS.escape(url)}"]`);
    if (card) {
      card.classList.remove("opacity-60");
      card.classList.remove("read");
      
      const readStatusBtn = card.querySelector('.read-status-btn');
      if (readStatusBtn) {
        readStatusBtn.innerHTML = '⚪ Chưa đọc';
        readStatusBtn.classList.remove('bg-green-600', 'hover:bg-green-500');
        readStatusBtn.classList.add('bg-blue-600', 'hover:bg-blue-500');
      }
      
      // Chuyển card lên đầu (hoặc trước card đã đọc đầu tiên)
      const firstReadCard = grid.querySelector('.read');
      if (firstReadCard && firstReadCard !== card) {
        grid.insertBefore(card, firstReadCard);
      } else {
        grid.insertBefore(card, grid.firstChild);
      }
    }
  } else {
    // Mark as read
    readItems.add(url);
    saveReadItems();
    
    const card = document.querySelector(`[data-url="${CSS.escape(url)}"]`);
    if (card) {
      card.classList.add("opacity-60");
      card.classList.add("read");
      
      const readStatusBtn = card.querySelector('.read-status-btn');
      if (readStatusBtn) {
        readStatusBtn.innerHTML = '✅ Đã đọc';
        readStatusBtn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
        readStatusBtn.classList.add('bg-green-600', 'hover:bg-green-500');
      }
      
      // Chuyển card xuống cuối danh sách ngay lập tức
      grid.appendChild(card);
    }
  }
}

function isRead(url) {
  return readItems.has(url);
}

// ===== UTILITY FUNCTIONS =====
function timeAgo(iso) {
  if (!iso) return "";
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now - then;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays} ngày trước`;
  if (diffHours > 0) return `${diffHours} giờ trước`;
  return "vừa xong";
}

function truncate(text, maxLength = 500) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}

function itemPassesFilters(item, filters) {
  if (filters.group && item.group !== filters.group) return false;
  if (filters.sources.length && !filters.sources.includes(item.sourceId)) return false;
  
  if (filters.query) {
    const query = filters.query.toLowerCase();
    const titleMatch = item.title && item.title.toLowerCase().includes(query);
    const summaryMatch = item.summary && item.summary.toLowerCase().includes(query);
    if (!titleMatch && !summaryMatch) return false;
  }
  
  return true;
}

// ===== GRID FUNCTIONS =====
function createCardElement(item) {
  const card = document.createElement('div');
  const readStatus = isRead(item.link);
  
  card.className = `news-card bg-[#ecf0f1] border border-gray-300 rounded-2xl p-4 hover:border-gray-400 transition-colors min-h-[360px] ${readStatus ? "opacity-60 read" : ""}`;
  card.setAttribute('data-url', item.link);
  card.setAttribute('data-title', item.title || '');
  card.setAttribute('data-source', item.sourceName || '');
  
  const groupBadge = item.group === 'internationaleconomics' ? 
    '<span class="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Quốc tế</span>' : '';
  
  const readStatusButton = readStatus ? 
    '<button class="read-status-btn px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors">✅ Đã đọc</button>' :
    '<button class="read-status-btn px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors">⚪ Chưa đọc</button>';
  
  card.innerHTML = `
    <h3 class="title-clickable text-xl font-semibold text-gray-900 line-clamp-2 leading-snug mb-3 cursor-pointer hover:text-emerald-600 transition-colors">
      ${item.title || "Không có tiêu đề"}
    </h3>
    
    <p class="text-base text-gray-700 mb-4 line-clamp-6 leading-relaxed">
      ${item.summary || "Không có tóm tắt."}
    </p>
    
    <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
      <div class="flex items-center gap-2">
        <span class="font-medium text-emerald-600">${item.sourceName || "N/A"}</span>
        ${groupBadge}
        ${item.translated ? '<span class="text-blue-600">Đã dịch</span>' : ''}
      </div>
      <span>${timeAgo(item.publishedAt)}</span>
    </div>
    
    <div class="flex gap-2 mt-auto">
      ${readStatusButton}
      <a href="${item.link}" target="_blank" rel="noopener" 
         class="flex-1 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-center">
        Link bài báo
      </a>
    </div>
  `;
  
  // Add event listeners
  const titleElement = card.querySelector('.title-clickable');
  titleElement.addEventListener('click', () => {
    openSummaryModal(item, item.link);
  });
  
  const readStatusBtn = card.querySelector('.read-status-btn');
  readStatusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleReadStatus(item.link);
  });
  
  return card;
}

function addItemToGrid(item) {
  if (!itemPassesFilters(item, currentFilters)) return;
  
  if (!empty.classList.contains("hidden")) {
    empty.classList.add("hidden");
  }
  
  const cardElement = createCardElement(item);
  
  if (isRead(item.link)) {
    grid.appendChild(cardElement);
  } else {
    const firstReadCard = grid.querySelector('.read');
    if (firstReadCard) {
      grid.insertBefore(cardElement, firstReadCard);
    } else {
      grid.appendChild(cardElement);
    }
  }
  
  cardElement.style.opacity = '0';
  cardElement.style.transform = 'translateY(10px)';
  
  requestAnimationFrame(() => {
    cardElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    cardElement.style.opacity = isRead(item.link) ? '0.6' : '1';
    cardElement.style.transform = 'translateY(0)';
  });
}

function renderItems(itemsToRender) {
  grid.innerHTML = "";
  
  if (!itemsToRender.length) {
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  
  const fragment = document.createDocumentFragment();
  
  const sortedItems = [...itemsToRender].sort((a, b) => {
    const aRead = isRead(a.link);
    const bRead = isRead(b.link);
    
    if (aRead && !bRead) return 1;
    if (!aRead && bRead) return -1;
    
    const aDate = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
    const bDate = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
    return bDate - aDate;
  });
  
  sortedItems.forEach(item => {
    const cardElement = createCardElement(item);
    fragment.appendChild(cardElement);
  });
  
  grid.appendChild(fragment);
}

function updateFilters() {
  currentFilters = {
    query: search.value.toLowerCase().trim(),
    sources: sourceSelect.value ? [sourceSelect.value] : [],
    group: groupSelect.value === 'all' ? null : groupSelect.value
  };
  
  const filtered = items.filter(item => itemPassesFilters(item, currentFilters));
  renderItems(filtered);
}

// ===== MAIN LOAD FUNCTION =====
async function loadNews() {
  if (loadingInProgress) return;
  
  try {
    loadingInProgress = true;
    
    items = [];
    grid.innerHTML = "";
    empty.classList.add("hidden");
    
    badge.textContent = "Đang tải…";
    badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-yellow-600 text-white border border-yellow-500";
    
    const selectedGroup = groupSelect.value === 'all' ? '' : `&group=${groupSelect.value}`;
    const hoursValue = hours.value || "24";
    
    const response = await fetch(`/api/news?hours=${hoursValue}${selectedGroup}&stream=true`);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
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
          
          items.push(item);
          itemCount++;
          
          addItemToGrid(item);
          
          badge.textContent = `${itemCount} bài`;
          
        } catch (e) {
          continue;
        }
      }
    }
    
    badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-emerald-600 text-white border border-emerald-500";
    
    populateSourceSelect();
    
    if (itemCount === 0) {
      empty.classList.remove("hidden");
    }
    
  } catch (error) {
    console.error("Error loading news:", error);
    badge.textContent = "Lỗi tải";
    badge.className = "ml-auto text-xs px-2 py-1 rounded-full bg-red-600 text-white border border-red-500";
    
    grid.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-slate-400">Không thể tải tin tức. Vui lòng thử lại.</p>
        <button onclick="loadNews()" class="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">
          Thử lại
        </button>
      </div>
    `;
  } finally {
    loadingInProgress = false;
  }
}

let populateTimeout;
function populateSourceSelect() {
  clearTimeout(populateTimeout);
  populateTimeout = setTimeout(() => {
    // Tạo Map để loại bỏ trùng lặp theo sourceId
    const uniqueSources = new Map();
    items.forEach(item => {
      if (item.sourceId && item.sourceName && !uniqueSources.has(item.sourceId)) {
        uniqueSources.set(item.sourceId, item.sourceName);
      }
    });
    
    // Chuyển Map thành array và sắp xếp
    const sources = Array.from(uniqueSources, ([id, name]) => ({ id, name }));
    sources.sort((a, b) => a.name.localeCompare(b.name));
    
    const currentValue = sourceSelect.value;
    sourceSelect.innerHTML = '<option value="">Tất cả nguồn</option>' + 
      sources.map(s => `<option value="${s.id}"${s.id === currentValue ? ' selected' : ''}>${s.name}</option>`).join('');
  }, 100);
}

// ===== EVENT HANDLERS =====

// Modal events
modalClose?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => {
  if (e.target === modal || e.target === modalOverlay) {
    closeModal();
  }
});

// Summary controls
regenerateBtn?.addEventListener("click", () => {
  if (currentItem && currentModalLink) {
    loadSummary(currentItem, currentModalLink);
  }
});

summaryPercent?.addEventListener("change", () => {
  if (currentItem && currentModalLink) {
    loadSummary(currentItem, currentModalLink);
  }
});

// TTS events
btnSpeak?.addEventListener("click", () => {
  if (!ttsSupported()) return;
  
  if (ttsState === "idle") {
    const text = summaryList.textContent || "";
    if (!text.trim()) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = ttsRate;
    utterance.lang = 'vi-VN';
    
    utterance.onstart = () => {
      ttsState = "speaking";
      btnSpeak.textContent = "⏸️ Tạm dừng";
    };
    
    utterance.onend = () => {
      ttsState = "idle";
      btnSpeak.textContent = "🔊 Đọc to";
    };
    
    utterance.onerror = () => {
      ttsState = "idle";
      btnSpeak.textContent = "🔊 Đọc to";
    };
    
    window.speechSynthesis.speak(utterance);
  } else if (ttsState === "speaking") {
    window.speechSynthesis.pause();
    ttsState = "paused";
    btnSpeak.textContent = "▶️ Tiếp tục";
  } else if (ttsState === "paused") {
    window.speechSynthesis.resume();
    ttsState = "speaking";
    btnSpeak.textContent = "⏸️ Tạm dừng";
  }
});

btnStopSpeak?.addEventListener("click", () => {
  if (!ttsSupported()) return;
  
  window.speechSynthesis.cancel();
  ttsState = "idle";
  btnSpeak.textContent = "🔊 Đọc to";
});

rateRange?.addEventListener("input", (e) => {
  ttsRate = parseFloat(e.target.value);
  setRateUI(ttsRate);
});

// Main app events
let searchTimeout;
search?.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(updateFilters, 300);
});

refreshBtn?.addEventListener("click", loadNews);
sourceSelect?.addEventListener("change", updateFilters);
groupSelect?.addEventListener("change", () => {
  sourceSelect.value = "";
  loadNews();
});
hours?.addEventListener("change", loadNews);

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

// ===== ADD CUSTOM STYLES =====
if (!document.getElementById('paragraph-styles')) {
  const style = document.createElement('style');
  style.id = 'paragraph-styles';
  style.textContent = `
    /* Animation cho paragraph summary */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    #summaryList > div {
      animation: slideIn 0.3s ease-out;
      animation-fill-mode: both;
    }
    
    #summaryList > div:nth-child(1) { animation-delay: 0.1s; }
    #summaryList > div:nth-child(2) { animation-delay: 0.2s; }
    #summaryList > div:nth-child(3) { animation-delay: 0.3s; }
    #summaryList > div:nth-child(4) { animation-delay: 0.4s; }
    #summaryList > div:nth-child(5) { animation-delay: 0.5s; }
    #summaryList > div:nth-child(6) { animation-delay: 0.6s; }
    #summaryList > div:nth-child(7) { animation-delay: 0.7s; }
    #summaryList > div:nth-child(8) { animation-delay: 0.8s; }
    #summaryList > div:nth-child(9) { animation-delay: 0.9s; }
    #summaryList > div:nth-child(10) { animation-delay: 1.0s; }
    
    /* Hover effect cho paragraph */
    #summaryList > div:hover {
      transform: translateX(5px);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
    
    /* Responsive paragraph spacing */
    @media (max-width: 640px) {
      #summaryList > div {
        padding: 12px;
        margin-bottom: 12px;
      }
    }
  `;
  document.head.appendChild(style);
}

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  loadReadItems();
  loadNews();
});