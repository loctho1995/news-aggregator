// public/app.js
const grid = document.getElementById("grid");
const search = document.getElementById("search");
const sourceSelect = document.getElementById("sourceSelect");
const statusSelect = document.getElementById("statusSelect");
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

let allItems = [];
let activeSource = "all";
let activeStatus = "all";
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
  sourceSelect.innerHTML =
    `<option value="all" selected>Tất cả nguồn</option>` +
    data.sources.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
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

/* ===== Popup summary: smarter for short articles ===== */
function normalizeBullets(arr, { minLen = 20, limit = 5 } = {}) {
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
    if (out.length >= limit) break;
  }
  return out;
}
function smartFallbackParagraph(text, { maxChars = 360 } = {}) {
  const sents = splitSentencesNoLookbehind(text || "");
  let paragraph = sents.slice(0, 2).join(". ");
  paragraph = paragraph.replace(/\s+/g, " ").trim();
  if (!paragraph) return "";
  if (paragraph.length > maxChars) paragraph = paragraph.slice(0, maxChars - 1) + "…";
  return paragraph;
}
function renderSummaryContent({ bullets, fallbackText }) {
  const good = normalizeBullets(bullets, { minLen: 20, limit: 5 });
  if (good.length >= 2) {
    return `
      <ul class="list-disc pl-5 space-y-2 mt-2 text-lg">
        ${good.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
      </ul>`;
  }
  if (good.length === 1) {
    return `<p class="text-lg text-slate-700 mt-2">${escapeHtml(good[0])}</p>`;
  }
  const para = smartFallbackParagraph(fallbackText || "");
  if (para) {
    return `<p class="text-lg text-slate-700 mt-2">${escapeHtml(para)}</p>`;
  }
  return `<p class="text-lg text-slate-500 mt-2">Bài rất ngắn — hãy chọn “Đọc bài gốc ↗” để xem chi tiết.</p>`;
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

/* ===== Card (no image) ===== */
function card(item, idx, read) {
  const when = item.publishedAt ? new Date(item.publishedAt) : null;
  const timeStr = when
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", hour12: false }).format(when)
    : "Không rõ thời gian";

  const statusAttrs = read
    ? `class="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600"`
    : `class="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 js-status cursor-pointer" data-link="${item.link}" title="Nhấp để đánh dấu đã đọc"`;

  const badgeHtml = `<span ${statusAttrs}>${read ? "ĐÃ ĐỌC" : "CHƯA ĐỌC"}</span>`;

  const bullets = buildPreviewBullets(item.summary || "");
  const bodyHtml = bullets.length
    ? `<ul class="list-disc pl-5 space-y-1 text-sm">${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
    : `<p class="text-sm text-slate-600 mt-2">${escapeHtml(item.summary || "Chưa có mô tả.")}</p>`;

  return `
    <article class="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col ${read ? "opacity-70 is-read" : ""}">
      <div class="p-4 flex-1 flex flex-col">
        <div class="flex items-center gap-2 mb-1">
          <div class="text-xs text-slate-500">${item.sourceName}</div>
          ${badgeHtml}
        </div>
        <a data-index="${idx}" data-link="${item.link}" class="js-open font-semibold hover:underline cursor-pointer">${item.title}</a>
        <div class="mt-2 js-text">${bodyHtml}</div>
        <div class="mt-auto pt-3 text-xs text-slate-500">${timeStr}</div>
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
    const read = isReadLink(it.link);
    const okStatus = activeStatus === "all" || (activeStatus === "unread" ? !read : read);
    return okSource && okQuery && okStatus;
  });

  if (activeStatus === "unread") {
    items.sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    });
  } else if (activeStatus === "read") {
    items.sort((a, b) => {
      const ra = getReadAt(a.link);
      const rb = getReadAt(b.link);
      if (ra !== rb) return rb - ra;
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    });
  } else {
    items.sort((a, b) => {
      const aRead = isReadLink(a.link);
      const bRead = isReadLink(b.link);
      if (aRead !== bRead) return aRead - bRead;
      if (!aRead && !bRead) {
        const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return tb - ta;
      } else {
        const ra = getReadAt(a.link);
        const rb = getReadAt(b.link);
        if (ra !== rb) return ra - rb;
        const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return tb - ta;
      }
    });
  }

  renderedItems = items;
  grid.innerHTML = items.map((it, i) => card(it, i, isReadLink(it.link))).join("");
  empty.classList.toggle("hidden", items.length > 0);
  badge.textContent = `${items.length} bài`;
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

async function loadNews() {
  badge.textContent = "Đang tải…";
  const hours = hoursSelect.value;
  const res = await fetch(`/api/news?hours=${hours}`);
  const data = await res.json();
  allItems = data.items || [];
  render();
}

/* ===== Modal Summary ===== */
function openSummaryModal(item, link) {
  modalTitle.textContent = item?.title || "Tóm tắt";
  modalSource.textContent = item?.sourceName ? `Nguồn: ${item.sourceName}` : "";
  modalOpenLink.href = link;

  summaryList.innerHTML = "";
  summaryLoading.textContent = "Đang tóm tắt…";
  summaryLoading.classList.remove("hidden");

  markRead(link);

  // Hiện modal, đưa cả khung & vùng tóm tắt về đầu để tránh đẩy UI
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
      const html = renderSummaryContent({
        bullets: j.bullets || [],
        fallbackText: item.summary || "",
      });
      summaryList.innerHTML = html;
      summaryLoading.classList.add("hidden");
      if (summaryArea) summaryArea.scrollTop = 0; // đảm bảo bắt đầu từ đầu phần tóm tắt
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
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
modalOverlay.addEventListener("click", closeModal);

/* ===== Utils ===== */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}

/* ===== Init ===== */
sourceSelect.addEventListener("change", (e) => { activeSource = e.target.value; render(); });
statusSelect.addEventListener("change", (e) => { activeStatus = e.target.value; render(); });
search.addEventListener("input", render);
hoursSelect.addEventListener("change", loadNews);
refreshBtn.addEventListener("click", loadNews);

await loadSources();
await loadNews();