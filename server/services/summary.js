// server/services/summary.js
// PHIÊN BẢN CẢI TIẾN - Tóm tắt theo từng đoạn văn

import * as cheerio from "cheerio";
import { summaryCache, translationCache } from "../utils/cache.js";
import { extractAndSummarizeContent } from "./aggregator/content-extractor/index.js";

// Language detection
const vietnamesePattern = /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
function detectLanguage(text = "") {
  return vietnamesePattern.test(text) ? "vi" : "en";
}

// Translation function
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
      const resp = await fetch(url, { 
        headers: { 'User-Agent': 'VN-News-Aggregator/1.0' }, 
        signal: AbortSignal.timeout(8000) 
      });
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
      const resp = await fetch(url, { 
        headers: { 'User-Agent': 'VN-News-Aggregator/1.0' }, 
        signal: AbortSignal.timeout(8000) 
      });
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

// Main summarization function với paragraph-based approach
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
    const resp = await fetch(target, { 
      headers, 
      redirect: "follow", 
      signal: AbortSignal.timeout(10000) 
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.text();
  }

  try {
    html = await fetchHtml(raw);
  } catch {
    // try Google cache
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(raw)}`;
    html = await fetchHtml(cacheUrl);
  }

  const $ = cheerio.load(html);
  title = ($("meta[property='og:title']").attr("content") || $("title").text() || "").trim();
  
  // Sử dụng hàm extract và summarize mới
  const {
    fullContent,
    originalParagraphs,
    summarizedParagraphs,
    summary,
    bullets,
    stats
  } = extractAndSummarizeContent($, percent);

  // Check if international source
  const isInternational = /(wsj\.com|ft\.com|bloomberg\.com|economist\.com|reuters\.com|cnbc\.com|marketwatch\.com)/i.test(site);
  
  let finalTitle = title;
  let finalSummary = summary;
  let finalBullets = bullets;
  let finalParagraphs = summarizedParagraphs;
  let translated = false;

  // Translate if needed
  if (isInternational && detectLanguage(title) !== "vi") {
    finalTitle = await translateText(title);
    translated = true;
  }
  
  if (isInternational && detectLanguage(summary) !== "vi") {
    // Dịch từng đoạn để giữ cấu trúc
    const translatedParagraphs = [];
    for (const paragraph of summarizedParagraphs) {
      const translatedPara = await translateText(paragraph);
      translatedParagraphs.push(translatedPara);
    }
    finalParagraphs = translatedParagraphs;
    finalSummary = translatedParagraphs.join('\n\n');
    
    // Tạo lại bullets từ đoạn đã dịch
    finalBullets = translatedParagraphs
      .slice(0, Math.min(7, translatedParagraphs.length))
      .map(p => `• ${p}`);
    
    translated = true;
  }

  const data = {
    url: raw,
    title: finalTitle,
    site,
    bullets: finalBullets,
    paragraphs: finalParagraphs, // Thêm mảng các đoạn đã tóm tắt
    fullSummary: finalSummary,   // Summary đầy đủ
    percentage: stats.compressionRatio,
    requestedPercent: percent,
    originalLength: stats.originalLength,
    summaryLength: stats.summaryLength,
    originalParagraphCount: stats.originalParagraphCount,
    summarizedParagraphCount: stats.summarizedParagraphCount,
    translated
  };
  
  summaryCache.set(cacheKey, data);
  return data;
}

// Hàm format bullets để hiển thị theo đoạn văn
export function formatParagraphSummary(paragraphs) {
  if (!paragraphs || paragraphs.length === 0) return "";
  
  return paragraphs.map((para, index) => {
    // Thêm số thứ tự nếu có nhiều đoạn
    if (paragraphs.length > 1) {
      return `【Đoạn ${index + 1}】\n${para}`;
    }
    return para;
  }).join('\n\n---\n\n');
}

// Optional AI endpoint (kept for compatibility)
export async function aiSummarizeUrl({ url, language = "vi", targetLength = null, percent = 70 }) {
  const data = await summarizeUrl({ url, percent });
  return { ...data, ai: false };
}