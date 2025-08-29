// public/app.js (dark theme) - FIXED WEBVIEW
const grid = document.getElementById("grid");
const search = document.getElementById("search");
const sourceSelect = document.getElementById("sourceSelect");
const groupSelect = document.getElementById("groupSelect");
const hoursSelect = document.getElementById("hours");
const refreshBtn = document.getElementById("refreshBtn");
const badge = document.getElementById("badge");
const empty = document.getElementById("empty");

// Regular summary modal elements
const modal = document.getElementById("modal");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalSource = document.getElementById("modalSource");
const modalClose = document.getElementById("modalClose");
const modalOpenLink = document.getElementById("modalOpenLink");
const summaryArea = document.getElementById("summaryArea");
const summaryLoading = document.getElementById("summaryLoading");
const summaryList = document.getElementById("summaryList");
const modalPanel = document.getElementById("modalPanel");

// AI Summary modal elements
const aiSummaryModal = document.getElementById("aiSummaryModal");
const aiSummaryOverlay = document.getElementById("aiSummaryOverlay");
const aiSummaryTitle = document.getElementById("aiSummaryTitle");
const aiSummarySource = document.getElementById("aiSummarySource");
const aiSummaryClose = document.getElementById("aiSummaryClose");
const aiSummaryArea = document.getElementById("aiSummaryArea");
const aiSummaryLoading = document.getElementById("aiSummaryLoading");
const aiSummaryContent = document.getElementById("aiSummaryContent");
const aiSummaryError = document.getElementById("aiSummaryError");
const aiSummaryText = document.getElementById("aiSummaryText");
const aiSummaryStats = document.getElementById("aiSummaryStats");
const aiSummaryOpenLink = document.getElementById("aiSummaryOpenLink");
const aiSummaryRetry = document.getElementById("aiSummaryRetry");
const aiSummaryCompare = document.getElementById("aiSummaryCompare");
const aiSummaryErrorMsg = document.getElementById("aiSummaryErrorMsg");
const aiAccuracy = document.getElementById("aiAccuracy");
const aiCompression = document.getElementById("aiCompression");
const aiTranslatedBadge = document.getElementById("aiTranslatedBadge");

// Webview modal elements
const webviewModal = document.getElementById("webviewModal");
const webviewOverlay = document.getElementById("webviewOverlay");
const webviewTitle = document.getElementById("webviewTitle");
const webviewUrl = document.getElementById("webviewUrl");
const webviewClose = document.getElementById("webviewClose");
const webviewReload = document.getElementById("webviewReload");
const webviewFrame = document.getElementById("webviewFrame");
const webviewLoading = document.getElementById("webviewLoading");
const webviewError = document.getElementById("webviewError");
const webviewErrorLink = document.getElementById("webviewErrorLink");
const webviewOpenExternal = document.getElementById("webviewOpenExternal");

// TTS controls
const btnSpeak = document.getElementById("btnSpeak");
const btnStopSpeak = document.getElementById("btnStopSpeak");
const rateRange = document.getElementById("rateRange");
const rateLabel = document.getElementById("rateLabel");
const ttsRateBox = document.getElementById("ttsRateBox");

// AI TTS controls
const aiSpeakBtn = document.getElementById("aiSpeakBtn");
const aiStopSpeakBtn = document.getElementById("aiStopSpeakBtn");

let ttsState = "idle"; // idle | playing | paused
let aiTTSState = "idle";
let ttsVoice = null;
const RATE_KEY = "tts_rate_v1";
let ttsRate = parseFloat(localStorage.getItem(RATE_KEY) || "1.0") || 1.0;

function setRateUI(val) {
  if (rateRange) rateRange.value = String(val);
  if (rateLabel) rateLabel.textContent = `${Number(val).toFixed(1)}x`;
}
setRateUI(ttsRate);

let allItems = [];
let activeSource = "all";
let activeGroup = "vietnam";
let currentItem = null;
let currentAIItem = null;
let renderedItems = [];

/* ===== Read/Unread tracking ===== */
const READ_KEY = "news_read_links_v2";
function loadReadMap() {
  try {
    const v2 = localStorage.getItem(READ_KEY);
    if (v2) return new Map(Object.entries(JSON.parse(v2)));
    const v1 = localStorage.getItem("news_read_links_v1");
    if (v1) {
      const arr = JSON.parse(v1);
      const m = new Map(arr.map((link) => [link, 0]));
      localStorage.setItem(READ_KEY, JSON.stringify(Object.fromEntries(m)));
      return m;
    }
  } catch {}
  return new Map();
}
let readMap = loadReadMap();
const isReadLink = (link) => readMap.has(link);
const getReadAt  = (link) => readMap.get(link) || 0;
const persistRead = () => localStorage.setItem(READ_KEY, JSON.stringify(Object.fromEntries(readMap)));
const markRead = (link) => { if (!link) return; readMap.set(link, Date.now()); persistRead(); render(); };
const markUnread = (link) => { if (!link) return; readMap.delete(link); persistRead(); render(); };

/* ===== Sources ===== */
async function loadSources() {
  const res = await fetch("/api/sources");
  const data = await res.json();
  updateSourceSelect(data.sources);
}

function updateSourceSelect(sources) {
  const filteredSources = activeGroup === "all" 
    ? sources 
    : sources.filter(s => s.group === activeGroup);
  
  sourceSelect.innerHTML =
    `<option value="all" selected>Tất cả nguồn</option>` +
    filteredSources.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
}

/* ===== Helpers: sentences & preview bullets for cards ===== */
function splitSentencesNoLookbehind(text) {
  const parts = text.match(/[^.!?…]+(?:[.!?…]+|$)/g) || [];
  return parts.map((s) => s.trim()).filter(Boolean);
}

function buildPreviewBullets(text, maxBullets = 3) {
  if (!text) return [];
  const sentences = splitSentencesNoLookbehind(text);
  const bullets = sentences.slice(0, maxBullets).map((s) => {
    const trimmed = s.replace(/\s+/g, " ").trim();
    return trimmed.length > 180 ? trimmed.slice(0, 179) + "…" : trimmed;
  });
  return bullets.filter(Boolean).length >= 2 ? bullets : [];
}

/* ===== Popup summary: BỎ GIỚI HẠN ===== */
function normalizeBullets(arr, { minLen = 20 } = {}) {
  const seen = new Set();
  const out = [];
  for (const raw of arr || []) {
    if (!raw) continue;
    const s = String(raw).replace(/\s+/g, " ").trim();
    if (s.length < minLen) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function smartFallbackParagraph(text, { maxChars = 500 } = {}) {
  const sents = splitSentencesNoLookbehind(text || "");
  let paragraph = sents.slice(0, 4).join(". ");
  paragraph = paragraph.replace(/\s+/g, " ").trim();
  if (!paragraph) return "";
  if (paragraph.length > maxChars) paragraph = paragraph.slice(0, maxChars - 1) + "…";
  return paragraph;
}

function renderSummaryContent({ bullets, fallbackText }) {
  const good = normalizeBullets(bullets, { minLen: 20 });
  
  if (good.length >= 2) {
    return `
      <ul class="list-disc pl-5 space-y-2 mt-2 text-lg text-gray-800">
        ${good.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
      </ul>`;
  }
  
  if (good.length === 1) {
    return `<p class="text-lg text-gray-800 mt-2">${escapeHtml(good[0])}</p>`;
  }
  
  const para = smartFallbackParagraph(fallbackText || "");
  if (para) {
    return `<p class="text-lg text-gray-800 mt-2">${escapeHtml(para)}</p>`;
  }
  
  return `<p class="text-lg text-gray-600 mt-2">Bài rất ngắn — hãy chọn "Đọc bài gốc ↗" để xem chi tiết.</p>`;
}

/* ===== Read style in cards ===== */
function ensureReadStyles() {
  if (document.getElementById("readStyles")) return;
  const style = document.createElement("style");
  style.id = "readStyles";
  style.textContent = `.is-read .js-text{font-size:1.2em;line-height:1.31;transition:all 150ms ease}`;
  document.head.appendChild(style);
}
ensureReadStyles();

/* ===== Card (nền #ecf0f1) ===== */
function card(item, idx, read) {
  const when = item.publishedAt ? new Date(item.publishedAt) : null;
  const timeStr = when
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", hour12: false }).format(when)
    : "Không rõ thời gian";

  const statusAttrs = read
    ? `class="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-gray-400 text-white"`
    : `class="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white js-status cursor-pointer" data-link="${item.link}" title="Nhấp để đánh dấu đã đọc"`;

  const badgeHtml = `<span ${statusAttrs}>${read ? "ĐÃ ĐỌC" : "CHƯA ĐỌC"}</span>`;

  const bullets = buildPreviewBullets(item.summary || "");
  const bodyHtml = bullets.length
    ? `<ul class="list-disc pl-5 space-y-1 text-sm text-gray-700">${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
    : `<p class="text-sm text-gray-600 mt-2">${escapeHtml(item.summary || "Chưa có mô tả.")}</p>`;

  return `
    <article class="bg-[#ecf0f1] border border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col ${read ? "opacity-80 is-read" : ""}">
      <div class="p-4 flex-1 flex flex-col">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <div class="text-xs text-gray-600 font-medium">${item.sourceName}</div>
          ${badgeHtml}
        </div>
        <div class="flex items-center gap-2 mb-2">
          <button class="js-ai-summary text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 cursor-pointer flex items-center gap-1" 
                  data-link="${item.link}" data-title="${escapeHtml(item.title)}" data-index="${idx}">
            <span>🤖</span>
            <span>AI Tóm tắt</span>
          </button>
          <button class="js-webview text-[10px] px-2 py-0.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 cursor-pointer" 
                  data-link="${item.link}" data-title="${escapeHtml(item.title)}">
            Xem chi tiết
          </button>
        </div>
        <a data-index="${idx}" data-link="${item.link}" class="js-open font-semibold hover:underline cursor-pointer text-gray-900">${item.title}</a>
        <div class="mt-2 js-text">${bodyHtml}</div>
        <div class="mt-auto pt-3 text-xs text-gray-600">${timeStr}</div>
      </div>
    </article>
  `;
}

/* ===== Render & sort ===== */
function render() {
  const q = search.value.trim().toLowerCase();

  let items = allItems.filter((it) => {
    const okSource = activeSource === "all" || it.sourceId === activeSource;
    const okQuery =
      !q || it.title?.toLowerCase().includes(q) || it.summary?.toLowerCase().includes(q);
    const okGroup = activeGroup === "all" || it.group === activeGroup;
    return okSource && okQuery && okGroup;
  });

  items.sort((a, b) => {
    const aRead = isReadLink(a.link);
    const bRead = isReadLink(b.link);
    if (aRead !== bRead) return aRead - bRead;
    
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });

  renderedItems = items;
  grid.innerHTML = items.map((it, i) => card(it, i, isReadLink(it.link))).join("");
  empty.classList.toggle("hidden", items.length > 0);
  badge.textContent = `${items.length} bài`;
}

/* ===== TTS (Web Speech API) ===== */
function ttsSupported() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}
function pickViVoice() {
  const vs = window.speechSynthesis.getVoices() || [];
  let vi = vs.find(v => v.lang && v.lang.toLowerCase().startsWith("vi"));
  if (!vi) vi = vs.find(v => /(en-|en_)/i.test(v.lang)) || vs[0] || null;
  return vi;
}
function showTTSControls() {
  btnSpeak.classList.remove("hidden");
  btnStopSpeak.classList.remove("hidden");
  if (ttsRateBox) ttsRateBox.classList.remove("hidden");
}

if (ttsSupported()) {
  window.speechSynthesis.onvoiceschanged = () => {
    ttsVoice = pickViVoice();
    showTTSControls();
  };
  ttsVoice = pickViVoice();
  if (ttsVoice) showTTSControls();
}

function getSummaryText() {
  const text = (summaryList.innerText || "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
  return text;
}

function chunkTextForTTS(text, maxLen = 300) {
  const sents = splitSentencesNoLookbehind(text);
  const out = [];
  let buff = "";
  for (const s of sents) {
    if ((buff + " " + s).trim().length <= maxLen) {
      buff = (buff ? buff + " " : "") + s;
    } else {
      if (buff) out.push(buff);
      if (s.length <= maxLen) {
        buff = s;
      } else {
        let cur = s;
        while (cur.length > maxLen) {
          const cut = cur.lastIndexOf(" ", maxLen);
          const idx = cut > 100 ? cut : maxLen;
          out.push(cur.slice(0, idx));
          cur = cur.slice(idx).trim();
        }
        buff = cur;
      }
    }
  }
  if (buff) out.push(buff);
  return out;
}

function startSpeak(text) {
  if (!ttsSupported() || !text) return;
  window.speechSynthesis.cancel();
  ttsState = "playing";
  btnSpeak.textContent = "⏸ Tạm dừng";

  const chunks = chunkTextForTTS(text);
  chunks.forEach((chunk, i) => {
    const u = new SpeechSynthesisUtterance(chunk);
    if (ttsVoice) u.voice = ttsVoice;
    u.lang = (ttsVoice && ttsVoice.lang) || "vi-VN";
    u.rate = Math.min(3.0, Math.max(0.6, ttsRate));
    u.pitch = 1.0;
    if (i === chunks.length - 1) {
      u.onend = () => { ttsState = "idle"; btnSpeak.textContent = "🔊 Đọc to"; };
    }
    window.speechSynthesis.speak(u);
  });
}

btnSpeak?.addEventListener("click", () => {
  if (!ttsSupported()) return;
  if (ttsState === "idle") {
    const text = getSummaryText();
    if (text.length < 5) return;
    startSpeak(text);
  } else if (ttsState === "playing") {
    window.speechSynthesis.pause();
    ttsState = "paused";
    btnSpeak.textContent = "▶️ Tiếp tục";
  } else if (ttsState === "paused") {
    window.speechSynthesis.resume();
    ttsState = "playing";
    btnSpeak.textContent = "⏸ Tạm dừng";
  }
});
btnStopSpeak?.addEventListener("click", () => {
  if (!ttsSupported()) return;
  window.speechSynthesis.cancel();
  ttsState = "idle";
  btnSpeak.textContent = "🔊 Đọc to";
});

rateRange?.addEventListener("input", (e) => {
  ttsRate = parseFloat(e.target.value || "1.0") || 1.0;
  localStorage.setItem(RATE_KEY, String(ttsRate));
  setRateUI(ttsRate);
});
rateRange?.addEventListener("change", () => {
  if (!ttsSupported()) return;
  if (ttsState === "playing" || ttsState === "paused") {
    const text = getSummaryText();
    window.speechSynthesis.cancel();
    ttsState = "idle";
    btnSpeak.textContent = "🔊 Đọc to";
    if (text.length > 4) startSpeak(text);
  }
});

/* ===== AI Summary Functions ===== */
// Trong file app.js, tìm function openAISummaryModal và sửa như sau:

function openAISummaryModal(item, link) {
  currentAIItem = item;
  
  // THAY ĐỔI: Sử dụng title của bài báo thay vì "AI Tóm tắt thông minh"
  aiSummaryTitle.textContent = item?.title || "AI Tóm tắt thông minh";
  aiSummarySource.textContent = item?.sourceName ? `Nguồn: ${item.sourceName}` : "";
  aiSummaryOpenLink.href = link;

  // Reset modal state
  aiSummaryLoading.classList.remove("hidden");
  aiSummaryContent.classList.add("hidden");
  aiSummaryError.classList.add("hidden");
  aiSummaryText.innerHTML = "";
  
  // Hide TTS controls initially
  aiSpeakBtn.classList.add("hidden");
  aiStopSpeakBtn.classList.add("hidden");
  aiSummaryCompare.classList.add("hidden");

  // Stop any ongoing TTS
  if (aiTTSState !== "idle") {
    window.speechSynthesis.cancel();
    aiTTSState = "idle";
  }

  // Mark as read
  markRead(link);

  // Show modal
  aiSummaryModal.classList.remove("hidden");
  aiSummaryModal.classList.add("flex");
  aiSummaryModal.scrollTop = 0;

  // Fetch AI summary
  fetchAISummary(link);
}

async function fetchAISummary(url) {
  try {
    const response = await fetch(`/api/ai-summary?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'AI Summary failed');
    }

    // Display success state
    aiSummaryLoading.classList.add("hidden");
    aiSummaryContent.classList.remove("hidden");
    
    // Update content
    aiSummaryText.innerHTML = formatAISummary(data.aiSummary);
    
    // Update stats
    if (data.originalLength && data.summaryLength) {
      const compressionRatio = Math.round((1 - data.summaryLength / data.originalLength) * 100);
      aiCompression.textContent = `${compressionRatio}%`;
    }
    
    // Show translation badge if applicable
    if (data.translated) {
      aiTranslatedBadge.style.display = 'flex';
    }
    
    // Update source with additional info
    let sourceText = `Nguồn: ${currentAIItem?.sourceName || ""}`;
    if (data.translated) {
      sourceText += ` • 🌐 Đã dịch từ tiếng Anh`;
    }
    if (data.cached) {
      sourceText += ` • ⚡ Từ cache`;
    }
    aiSummarySource.textContent = sourceText;

    // Show TTS controls if supported
    if (ttsSupported()) {
      aiSpeakBtn.classList.remove("hidden");
      aiStopSpeakBtn.classList.remove("hidden");
    }
    
    // Show compare button
    aiSummaryCompare.classList.remove("hidden");

  } catch (error) {
    console.error('AI Summary error:', error);
    
    // Show error state
    aiSummaryLoading.classList.add("hidden");
    aiSummaryError.classList.remove("hidden");
    aiSummaryErrorMsg.textContent = error.message || "Không thể tạo AI summary cho bài viết này.";
  }
}

function formatAISummary(summary) {
  if (!summary) return "<p class='text-gray-500'>Không có nội dung tóm tắt.</p>";
  
  // Convert summary to HTML with proper formatting
  let formatted = summary.trim();
  
  // Handle bullet points
  if (formatted.includes('•') || formatted.includes('*') || formatted.includes('-')) {
    const lines = formatted.split('\n').filter(line => line.trim());
    const bullets = lines.map(line => {
      const cleaned = line.replace(/^[•\-\*]\s*/, '').trim();
      return cleaned ? `<li class="mb-2">${escapeHtml(cleaned)}</li>` : '';
    }).filter(Boolean);
    
    if (bullets.length > 0) {
      return `<ul class="list-disc list-inside space-y-2 text-gray-800">${bullets.join('')}</ul>`;
    }
  }
  
  // Handle numbered lists
  if (/^\d+\./.test(formatted)) {
    const lines = formatted.split('\n').filter(line => line.trim());
    const items = lines.map(line => {
      const cleaned = line.replace(/^\d+\.\s*/, '').trim();
      return cleaned ? `<li class="mb-2">${escapeHtml(cleaned)}</li>` : '';
    }).filter(Boolean);
    
    if (items.length > 0) {
      return `<ol class="list-decimal list-inside space-y-2 text-gray-800">${items.join('')}</ol>`;
    }
  }
  
  // Handle paragraph format
  const paragraphs = formatted.split('\n\n').filter(p => p.trim());
  const htmlParagraphs = paragraphs.map(p => 
    `<p class="mb-3 text-gray-800 leading-relaxed">${escapeHtml(p.trim())}</p>`
  );
  
  return htmlParagraphs.join('');
}

function closeAISummaryModal() {
  // Stop TTS if running
  if (aiTTSState !== "idle") {
    window.speechSynthesis.cancel();
    aiTTSState = "idle";
  }
  
  aiSummaryModal.classList.add("hidden");
  aiSummaryModal.classList.remove("flex");
  currentAIItem = null;
}

/* ===== Events ===== */
grid.addEventListener("click", (e) => {
  const badgeEl = e.target.closest(".js-status");
  if (!badgeEl) return;
  const link = badgeEl.getAttribute("data-link");
  if (link && !isReadLink(link)) markRead(link);
});

grid.addEventListener("click", (e) => {
  const el = e.target.closest(".js-open");
  if (!el) return;
  e.preventDefault();
  const idx = Number(el.getAttribute("data-index"));
  const link = el.getAttribute("data-link");
  currentItem = renderedItems[idx];
  openSummaryModal(currentItem, link);
});

// AI Summary button click handler
grid.addEventListener("click", (e) => {
  const aiBtn = e.target.closest(".js-ai-summary");
  if (!aiBtn) return;
  e.preventDefault();
  
  const idx = Number(aiBtn.getAttribute("data-index"));
  const link = aiBtn.getAttribute("data-link");
  const item = renderedItems[idx];
  
  openAISummaryModal(item, link);
});

// FIXED: Webview button click handler - Mở trực tiếp tab mới thay vì iframe
grid.addEventListener("click", (e) => {
  const webviewBtn = e.target.closest(".js-webview");
  if (!webviewBtn) return;
  e.preventDefault();
  
  const link = webviewBtn.getAttribute("data-link");
  
  // Đánh dấu đã đọc
  markRead(link);
  
  // Mở link trong tab mới
  window.open(link, '_blank', 'noopener,noreferrer');
});

async function loadNews() {
  badge.textContent = "Đang tải…";
  allItems = [];
  renderedItems = [];
  grid.innerHTML = "";
  empty.classList.add("hidden");
  
  const hours = hoursSelect.value;
  const group = activeGroup === "all" ? "" : activeGroup;
  
  const response = await fetch(`/api/news?hours=${hours}&group=${group}&stream=true`);
  
  if (response.headers.get('content-type')?.includes('application/x-ndjson')) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, {stream: true});
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const item = JSON.parse(line);
            if (item.error) continue;
            
            if (!item.group) {
              item.group = determineGroupFromSource(item.sourceId);
            }
            
            allItems.push(item);
            
            if (shouldDisplayItem(item)) {
              renderNewItem(item);
            }
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }
      
      badge.textContent = `${allItems.length} bài`;
    }
  } else {
    const data = await response.json();
    allItems = data.items || [];
    
    allItems.forEach(item => {
      if (!item.group) {
        item.group = determineGroupFromSource(item.sourceId);
      }
    });
    
    render();
  }
  
  badge.textContent = `${allItems.length} bài`;
}

function shouldDisplayItem(item) {
  const q = search.value.trim().toLowerCase();
  const okSource = activeSource === "all" || item.sourceId === activeSource;
  const okQuery = !q || item.title?.toLowerCase().includes(q) || item.summary?.toLowerCase().includes(q);
  const okGroup = activeGroup === "all" || item.group === activeGroup;
  return okSource && okQuery && okGroup;
}

function renderNewItem(item) {
  const isRead = isReadLink(item.link);
  const idx = renderedItems.length;
  renderedItems.push(item);
  
  const cardHtml = card(item, idx, isRead);
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = cardHtml;
  const newCard = tempDiv.firstElementChild;
  
  const cards = Array.from(grid.children);
  let insertBefore = null;
  
  for (const existingCard of cards) {
    const existingIdx = parseInt(existingCard.querySelector('[data-index]').dataset.index);
    const existingItem = renderedItems[existingIdx];
    
    const existingRead = isReadLink(existingItem.link);
    const newRead = isRead;
    
    if (newRead && !existingRead) continue;
    if (!newRead && existingRead) {
      insertBefore = existingCard;
      break;
    }
    
    const newTime = item.publishedAt ? new Date(item.publishedAt).getTime() : 0;
    const existingTime = existingItem.publishedAt ? new Date(existingItem.publishedAt).getTime() : 0;
    
    if (newTime > existingTime) {
      insertBefore = existingCard;
      break;
    }
  }
  
  if (insertBefore) {
    grid.insertBefore(newCard, insertBefore);
  } else {
    grid.appendChild(newCard);
  }
  
  empty.classList.add("hidden");
}

function determineGroupFromSource(sourceId) {
  const internationalEconomicsSources = ['wsj', 'ft', 'bloomberg', 'economist', 'reuters', 'cnbc', 'marketwatch'];
  return internationalEconomicsSources.includes(sourceId) ? 'internationaleconomics' : 'vietnam';
}

async function initializeWithVietnamNews() {
  const res = await fetch("/api/sources");
  const data = await res.json();
  
  const vietnamSources = data.sources.filter(s => s.group === 'vietnam' || !s.group);
  updateSourceSelect(vietnamSources);
}

/* ===== Modal Summary ===== */
function openSummaryModal(item, link) {
  modalTitle.textContent = item?.title || "Tóm tắt";
  modalSource.textContent = item?.sourceName ? `Nguồn: ${item.sourceName}` : "";
  modalOpenLink.href = link;

  summaryList.innerHTML = "";
  summaryLoading.textContent = "Đang tóm tắt…";
  summaryLoading.classList.remove("hidden");

  if (ttsSupported()) {
    window.speechSynthesis.cancel();
    ttsState = "idle";
    btnSpeak.textContent = "🔊 Đọc to";
    setRateUI(ttsRate);
  }

  markRead(link);

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  modal.scrollTop = 0;
  if (modalPanel) modalPanel.scrollTop = 0;
  if (summaryArea) summaryArea.scrollTop = 0;

  (async () => {
    try {
      const r = await fetch(`/api/summary?url=${encodeURIComponent(link)}`);
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      
      if (j.percentage !== undefined) {
        const percentColor = j.percentage > 70 ? "text-orange-600" : 
                           j.percentage > 40 ? "text-yellow-600" : "text-emerald-600";
        const sizeInfo = j.originalLength ? ` (${j.summaryLength}/${j.originalLength} ký tự)` : "";
        const translatedBadge = j.translated ? 
          `<span class="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">🌐 Đã dịch</span>` : "";
        
        modalSource.innerHTML = `
          <span>Nguồn: ${item.sourceName || ""}</span>
          <span class="mx-2">•</span>
          <span class="${percentColor}">Đã tóm tắt ${j.percentage}%${sizeInfo}</span>
          ${translatedBadge}
        `;
      }
      
      const html = renderSummaryContent({
        bullets: j.bullets || [],
        fallbackText: item.summary || "",
      });
      summaryList.innerHTML = html;
      summaryLoading.classList.add("hidden");
      if (summaryArea) summaryArea.scrollTop = 0;
    } catch (err) {
      const html = renderSummaryContent({
        bullets: [],
        fallbackText: item.summary || "",
      });
      summaryList.innerHTML = html;
      summaryLoading.classList.add("hidden");
      if (summaryArea) summaryArea.scrollTop = 0;
    }
  })();
}

function closeModal() {
  if (ttsSupported()) {
    window.speechSynthesis.cancel();
    ttsState = "idle";
    btnSpeak.textContent = "🔊 Đọc to";
  }
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

/* ===== REMOVED: Webview Modal (không cần nữa) ===== */
// Webview modal đã bị xóa - mở trực tiếp trong tab mới

// Event handlers for AI Summary modal
aiSummaryClose.addEventListener("click", closeAISummaryModal);
aiSummaryModal.addEventListener("click", (e) => {
  if (e.target === aiSummaryModal || e.target === aiSummaryOverlay) {
    closeAISummaryModal();
  }
});

aiSummaryRetry.addEventListener("click", () => {
  if (currentAIItem) {
    fetchAISummary(currentAIItem.link);
  }
});

// AI TTS controls
aiSpeakBtn?.addEventListener("click", () => {
  if (!ttsSupported()) return;
  
  if (aiTTSState === "idle") {
    const text = aiSummaryText.innerText || aiSummaryText.textContent || "";
    if (text.trim().length < 5) return;
    
    window.speechSynthesis.cancel();
    aiTTSState = "playing";
    aiSpeakBtn.innerHTML = '<span>⏸</span><span>Tạm dừng</span>';
    
    const chunks = chunkTextForTTS(text);
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      if (ttsVoice) u.voice = ttsVoice;
      u.lang = (ttsVoice && ttsVoice.lang) || "vi-VN";
      u.rate = Math.min(3.0, Math.max(0.6, ttsRate));
      u.pitch = 1.0;
      
      if (i === chunks.length - 1) {
        u.onend = () => {
          aiTTSState = "idle";
          aiSpeakBtn.innerHTML = '<span>🔊</span><span>Đọc AI summary</span>';
        };
      }
      
      window.speechSynthesis.speak(u);
    });
    
  } else if (aiTTSState === "playing") {
    window.speechSynthesis.pause();
    aiTTSState = "paused";
    aiSpeakBtn.innerHTML = '<span>▶️</span><span>Tiếp tục</span>';
    
  } else if (aiTTSState === "paused") {
    window.speechSynthesis.resume();
    aiTTSState = "playing";
    aiSpeakBtn.innerHTML = '<span>⏸</span><span>Tạm dừng</span>';
  }
});

aiStopSpeakBtn?.addEventListener("click", () => {
  if (!ttsSupported()) return;
  
  window.speechSynthesis.cancel();
  aiTTSState = "idle";
  aiSpeakBtn.innerHTML = '<span>🔊</span><span>Đọc AI summary</span>';
});

// Compare with regular summary
aiSummaryCompare?.addEventListener("click", () => {
  if (currentAIItem) {
    closeAISummaryModal();
    openSummaryModal(currentAIItem, currentAIItem.link);
  }
});

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
modalOverlay.addEventListener("click", closeModal);

// REMOVED: Webview modal event handlers (không cần nữa)

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!aiSummaryModal.classList.contains("hidden")) {
      closeAISummaryModal();
    } else if (!modal.classList.contains("hidden")) {
      closeModal();
    }
  }
});

/* ===== Utils ===== */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[c]));
}

/* ===== Init ===== */
sourceSelect.addEventListener("change", (e) => { activeSource = e.target.value; render(); });
groupSelect.addEventListener("change", async (e) => { 
  activeGroup = e.target.value; 
  activeSource = "all";
  
  const res = await fetch("/api/sources");
  const data = await res.json();
  updateSourceSelect(data.sources);
  
  await loadNews();
});
search.addEventListener("input", render);
hoursSelect.addEventListener("change", loadNews);
refreshBtn.addEventListener("click", loadNews);

await initializeWithVietnamNews();
await loadNews();