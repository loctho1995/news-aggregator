// public/app.js (dark theme)
const grid = document.getElementById("grid");
const search = document.getElementById("search");
const sourceSelect = document.getElementById("sourceSelect");
const groupSelect = document.getElementById("groupSelect");
const hoursSelect = document.getElementById("hours");
const refreshBtn = document.getElementById("refreshBtn");
const badge = document.getElementById("badge");
const empty = document.getElementById("empty");

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

// TTS controls
const btnSpeak = document.getElementById("btnSpeak");
const btnStopSpeak = document.getElementById("btnStopSpeak");
const rateRange = document.getElementById("rateRange");
const rateLabel = document.getElementById("rateLabel");
const ttsRateBox = document.getElementById("ttsRateBox");

let ttsState = "idle"; // idle | playing | paused
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
let activeGroup = "vietnam"; // Mặc định là tin Việt Nam
let currentItem = null;
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
  
  // Update source select based on active group
  updateSourceSelect(data.sources);
}

function updateSourceSelect(sources) {
  // Filter sources by active group if not "all"
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

// VẪN GIỮ PREVIEW ngắn cho cards (3 bullets)
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
  // BỎ LIMIT - hiển thị TẤT CẢ bullets
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
  // Tăng maxChars lên để hiển thị nhiều nội dung hơn khi fallback
  const sents = splitSentencesNoLookbehind(text || "");
  let paragraph = sents.slice(0, 4).join(". "); // Tăng từ 2 lên 4 câu
  paragraph = paragraph.replace(/\s+/g, " ").trim();
  if (!paragraph) return "";
  if (paragraph.length > maxChars) paragraph = paragraph.slice(0, maxChars - 1) + "…";
  return paragraph;
}

function renderSummaryContent({ bullets, fallbackText }) {
  // BỎ GIỚI HẠN - hiển thị TẤT CẢ bullets
  const good = normalizeBullets(bullets, { minLen: 20 });
  
  if (good.length >= 2) {
    // Hiển thị TẤT CẢ bullets, không giới hạn
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
  
  return `<p class="text-lg text-gray-600 mt-2">Bài rất ngắn – hãy chọn "Đọc bài gốc ↗" để xem chi tiết.</p>`;
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
        <div class="flex items-center gap-2 mb-1">
          <div class="text-xs text-gray-600 font-medium">${item.sourceName}</div>
          ${badgeHtml}
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

  // Sort by publish date (newest first) và status đã đọc/chưa đọc
  items.sort((a, b) => {
    const aRead = isReadLink(a.link);
    const bRead = isReadLink(b.link);
    if (aRead !== bRead) return aRead - bRead; // chưa đọc lên trước
    
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

// TTS: Tăng maxLen cho chunks khi đọc dài
function chunkTextForTTS(text, maxLen = 300) {  // Tăng từ 220 lên 300
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
    u.rate = Math.min(3.0, Math.max(0.6, ttsRate)); // 0.6x → 3.0x
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
// chỉnh tốc độ: lưu & (nếu đang đọc) khởi động lại
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

async function loadNews() {
  badge.textContent = "Đang tải…";
  const hours = hoursSelect.value;
  const group = activeGroup === "all" ? "" : activeGroup;
  const res = await fetch(`/api/news?hours=${hours}&group=${group}`);
  const data = await res.json();
  allItems = data.items || [];
  
  // Add group info to each item if not present
  allItems.forEach(item => {
    if (!item.group) {
      // Determine group from sourceId if needed
      item.group = determineGroupFromSource(item.sourceId);
    }
  });
  
  render();
}

// Helper function to determine group from source
function determineGroupFromSource(sourceId) {
  // This will be provided by backend, but as fallback
  const internationalEconomicsSources = ['wsj', 'ft', 'bloomberg', 'economist', 'reuters', 'cnbc', 'marketwatch'];
  return internationalEconomicsSources.includes(sourceId) ? 'internationaleconomics' : 'vietnam';
}

// Khởi tạo với filter sources cho nhóm vietnam mặc định
async function initializeWithVietnamNews() {
  const res = await fetch("/api/sources");
  const data = await res.json();
  
  // Filter sources cho nhóm vietnam
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
      
      // Hiển thị phần trăm tóm tắt với màu phù hợp theme sáng
      if (j.percentage !== undefined) {
        const percentColor = j.percentage > 70 ? "text-orange-600" : 
                           j.percentage > 40 ? "text-yellow-600" : "text-emerald-600";
        const sizeInfo = j.originalLength ? ` (${j.summaryLength}/${j.originalLength} ký tự)` : "";
        modalSource.innerHTML = `
          <span>Nguồn: ${item.sourceName || ""}</span>
          <span class="mx-2">•</span>
          <span class="${percentColor}">Đã tóm tắt ${j.percentage}%${sizeInfo}</span>
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
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
modalOverlay.addEventListener("click", closeModal);

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
  activeSource = "all"; // Reset source when changing group
  
  // Reload sources for the selected group
  const res = await fetch("/api/sources");
  const data = await res.json();
  updateSourceSelect(data.sources);
  
  // Reload news if group changed
  await loadNews();
});
search.addEventListener("input", render);
hoursSelect.addEventListener("change", loadNews);
refreshBtn.addEventListener("click", loadNews);

// Khởi tạo với tin tức Việt Nam mặc định
await initializeWithVietnamNews();
await loadNews();