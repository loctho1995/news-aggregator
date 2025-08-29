// server/services/summary.js
import * as cheerio from "cheerio";
import { summaryCache, translationCache, aiSummaryCache } from "../utils/cache.js";

// --- Language detection (simple Vietnamese diacritics check) ---
const vietnamesePattern = /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
function detectLanguage(text = "") {
  return vietnamesePattern.test(text) ? "vi" : "en";
}

// --- Translation (two free-ish fallbacks) ---
async function translateText(text, targetLang = "vi") {
  if (!text || detectLanguage(text) === targetLang) return text;
  const cacheKey = `tl:${targetLang}:${text.slice(0,512)}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  const translationMethods = [
    // MyMemory (free, rate-limited)
    async () => {
      const encoded = encodeURIComponent(text);
      const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=auto|${targetLang}`;
      const resp = await fetch(url, { headers: { 'User-Agent': 'VN-News-Aggregator/1.0' }, signal: AbortSignal.timeout(8000) });
      if (resp.ok) {
        const data = await resp.json();
        const out = data?.responseData?.translatedText;
        if (out && !String(out).includes("MYMEMORY WARNING")) return out;
      }
      return null;
    },
    // Google translate (unofficial gtx)
    async () => {
      const encoded = encodeURIComponent(text);
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encoded}`;
      const resp = await fetch(url, { headers: { 'User-Agent': 'VN-News-Aggregator/1.0' }, signal: AbortSignal.timeout(8000) });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data?.[0])) {
          return data[0].map((chunk) => chunk?.[0] || "").join("");
        }
      }
      return null;
    }
  ];

  for (const method of translationMethods) {
    try {
      const out = await method();
      if (out) {
        translationCache.set(cacheKey, out);
        return out;
      }
    } catch (_) { /* ignore */ }
  }
  return text; // fallback to original
}

// --- HTML -> main content extraction (robust but compact) ---
function extractMainContent($) {
  // Remove obvious noise
  $("script,style,noscript,iframe,header,footer,aside,nav,.ads,.advertisement,.banner,.sidebar,.widget,.related,.social-share,.comment,.comments").remove();

  const og = $("meta[property='og:description']").attr("content") || "";
  const meta = $("meta[name='description']").attr("content") || "";
  const lead = $(".sapo, .lead, .description, .chapeau, .article-summary").text().trim();

  // site-specific content blocks (order matters)
  const blocks = [
    ".fck_detail", ".article-content", ".content-detail",            // VnExpress
    ".content-detail", ".detail-content", ".detail__content",        // TuoiTre
    ".singular-content", ".detail__content", ".detail-content",      // DanTri
    ".article__body", ".article-body", ".content__detail",           // Thanhnien
    ".news-content", ".main-content", ".article", ".article-content"
  ];

  for (const sel of blocks) {
    const t = $(sel).text().trim();
    if (t && t.length > 120) {
      return cleanContentText(t);
    }
  }

  // fallback: gather paragraph-like content
  const chunks = [];
  $("p, .paragraph").each((_, el) => {
    const txt = $(el).text().replace(/\s+/g, " ").trim();
    if (txt && txt.length > 40) chunks.push(txt);
  });
  const text = chunks.join("\n").trim();
  if (text.length > 120) return cleanContentText(text);

  // final fallback: og/meta/lead
  const combo = [lead, og, meta].filter(Boolean).join("\n");
  return cleanContentText(combo);
}

function cleanContentText(s = "") {
  return s
    .replace(/\(Ảnh:.*?\)|\(Video:.*?\)/gi, "")
    .replace(/Xem thêm:.*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// --- Summarization to bullet points (percent-based) ---
function sentencesFrom(text) {
  const parts = text
    .replace(/([.!?])\s+/g, "$1|")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts;
}

function uniqueBullets(bullets, maxBullets) {
  const seen = new Set();
  const out = [];
  for (const b of bullets) {
    const k = b.slice(0, 60).toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(b);
      if (out.length >= maxBullets) break;
    }
  }
  return out;
}

function summarizeToBulletsWithPercentage(fullText, percent = 70) {
  const text = (fullText || "").trim();
  if (!text || text.length < 100) {
    return {
      bullets: [text || "(Bài quá ngắn để tóm tắt)"],
      originalLength: text.length,
      summaryLength: text.length,
      percentage: 100
    };
  }

  const sents = sentencesFrom(text);
  const approxBullets = Math.max(3, Math.round((percent / 100) * Math.min(10, Math.ceil(sents.length / 3))));
  const bullets = [];

  // 1) prefer sentences that contain numbers, dates, or named entities (simple heuristics)
  const important = sents.filter(s => /\d|\(|\)|–|—|:/.test(s));
  const rest = sents.filter(s => !important.includes(s));

  for (const s of important) if (bullets.length < approxBullets) bullets.push("• " + s);
  for (const s of rest) if (bullets.length < approxBullets) bullets.push("• " + s);

  const merged = uniqueBullets(bullets, approxBullets);
  const summaryText = merged.join(" ");
  const percentage = Math.max(1, Math.min(100, Math.round((summaryText.length / text.length) * 100)));
  return {
    bullets: merged,
    originalLength: text.length,
    summaryLength: summaryText.length,
    percentage
  };
}

// --- Public APIs ---
export async function summarizeUrl({ url, percent = 70, fallbackSummary = "" }) {
  const raw = String(url || "").trim();
  if (!raw) throw new Error("Missing url");
  const u = new URL(raw);
  if (!/^https?:$/.test(u.protocol)) throw new Error("Only http/https allowed");

  const cacheKey = `${raw}_${percent}`;
  const cached = summaryCache.get(cacheKey);
  if (cached) return { cached: true, ...cached };

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    "Accept-Language": "vi,vi-VN;q=0.9,en;q=0.8"
  };

  // Try direct fetch, then Google cache fallback
  let html = "";
  let site = u.hostname;
  let title = "";

  async function fetchHtml(target) {
    const resp = await fetch(target, { headers, redirect: "follow", signal: AbortSignal.timeout(10000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.text();
  }

  try {
    html = await fetchHtml(raw);
  } catch {
    // try G cache
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(raw)}`;
    html = await fetchHtml(cacheUrl);
  }

  const $ = cheerio.load(html);
  title = ($("meta[property='og:title']").attr("content") || $("title").text() || "").trim();
  const mainText = extractMainContent($);

  const isInternational = /(wsj\.com|ft\.com|bloomberg\.com|economist\.com|reuters\.com|cnbc\.com|marketwatch\.com)/i.test(site);
  let finalTitle = title;
  let contentForSummary = mainText;

  if (isInternational && detectLanguage(title) !== "vi") {
    finalTitle = await translateText(title);
  }
  let translated = false;
  if (isInternational && detectLanguage(mainText) !== "vi") {
    translated = true;
    contentForSummary = await translateText(mainText);
  }

  const { bullets, originalLength, summaryLength, percentage } = summarizeToBulletsWithPercentage(contentForSummary, percent);
  const data = {
    url: raw,
    title: finalTitle,
    site,
    bullets,
    percentage,
    requestedPercent: percent,
    originalLength,
    summaryLength,
    translated
  };
  summaryCache.set(cacheKey, data);
  return data;
}

// Optional AI endpoint stub (kept for compatibility)
export async function aiSummarizeUrl({ url, language = "vi", targetLength = null, percent = 70 }) {
  // For now, we reuse the heuristic summarizer.
  const data = await summarizeUrl({ url, percent });
  return { ...data, ai: false };
}