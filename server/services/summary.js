// server/services/summary.js
// FIXED VERSION - Better headers và fallback handling

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

// Enhanced fetch with multiple strategies
async function fetchWithFallback(url) {
  const strategies = [
    // Strategy 1: Direct fetch with desktop headers
    async () => {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    },
    
    // Strategy 2: Mobile user agent (sometimes less restricted)
    async () => {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(8000)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    },
    
    // Strategy 3: Use web archive (archive.org)
    async () => {
      const archiveUrl = `https://web.archive.org/web/2/${url}`;
      const response = await fetch(archiveUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VN-News-Bot/1.0)'
        },
        signal: AbortSignal.timeout(12000)
      });
      
      if (!response.ok) throw new Error('Archive fetch failed');
      return await response.text();
    },
    
    // Strategy 4: Use Google Cache (as last resort)
    async () => {
      const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
      const response = await fetch(cacheUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) throw new Error('Cache fetch failed');
      return await response.text();
    }
  ];

  // Try each strategy
  for (let i = 0; i < strategies.length; i++) {
    try {
      console.log(`Trying fetch strategy ${i + 1} for ${url}`);
      const html = await strategies[i]();
      
      // Check if we got blocked content
      if (html.includes('unusual traffic') || 
          html.includes('Captcha') || 
          html.includes('Access Denied') ||
          html.length < 500) {
        console.log(`Strategy ${i + 1} got blocked/captcha, trying next...`);
        continue;
      }
      
      console.log(`Strategy ${i + 1} successful`);
      return html;
    } catch (error) {
      console.log(`Strategy ${i + 1} failed: ${error.message}`);
      continue;
    }
  }
  
  throw new Error('All fetch strategies failed');
}

// Main summarization function với better error handling
export async function summarizeUrl({ url, percent = 70, fallbackSummary = "" }) {
  const raw = String(url || "").trim();
  if (!raw) throw new Error("Missing url");
  
  // Validate URL
  try {
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol)) throw new Error("Only http/https allowed");
  } catch (e) {
    throw new Error("Invalid URL");
  }

  const cacheKey = `${raw}_${percent}`;
  const cached = summaryCache.get(cacheKey);
  if (cached) return { cached: true, ...cached };

  let html = "";
  let title = "";
  
  try {
    // Use enhanced fetch with fallback strategies
    html = await fetchWithFallback(raw);
    
    const $ = cheerio.load(html);
    
    // Remove Google-specific elements if present
    $('.g-recaptcha, #captcha, .captcha-container').remove();
    $('script').remove();
    
    title = ($("meta[property='og:title']").attr("content") || 
             $("title").text() || 
             $("h1").first().text() || 
             "").trim();
    
    // Clean title from error messages
    if (title.includes('Access Denied') || title.includes('Error')) {
      title = "Bài viết không có tiêu đề";
    }
    
    // Extract and summarize content
    const {
      fullContent,
      originalParagraphs,
      summarizedParagraphs,
      summary,
      bullets,
      stats
    } = extractAndSummarizeContent($, percent);

    // Check if we got meaningful content
    if (!fullContent || fullContent.length < 100) {
      // Return fallback content if provided
      if (fallbackSummary) {
        return {
          url: raw,
          title: title || "Không thể tải nội dung",
          site: new URL(raw).hostname,
          bullets: ["• " + fallbackSummary],
          paragraphs: [fallbackSummary],
          fullSummary: fallbackSummary,
          percentage: 100,
          requestedPercent: percent,
          originalLength: fallbackSummary.length,
          summaryLength: fallbackSummary.length,
          error: "partial",
          message: "Sử dụng nội dung dự phòng"
        };
      }
      
      throw new Error("Không thể trích xuất nội dung từ trang web");
    }

    // Check if international source
    const site = new URL(raw).hostname;
    const isInternational = /(wsj\.com|ft\.com|bloomberg\.com|economist\.com|reuters\.com|cnbc\.com|marketwatch\.com)/i.test(site);
    
    let finalTitle = title;
    let finalSummary = summary;
    let finalBullets = bullets;
    let finalParagraphs = summarizedParagraphs;
    let translated = false;

    // Translate if needed
    if (isInternational) {
      if (detectLanguage(title) !== "vi") {
        finalTitle = await translateText(title);
        translated = true;
      }
      
      if (detectLanguage(summary) !== "vi") {
        const translatedParagraphs = [];
        for (const paragraph of summarizedParagraphs.slice(0, 5)) { // Limit translation
          const translatedPara = await translateText(paragraph);
          translatedParagraphs.push(translatedPara);
        }
        finalParagraphs = translatedParagraphs;
        finalSummary = translatedParagraphs.join('\n\n');
        finalBullets = translatedParagraphs.map(p => `• ${p}`);
        translated = true;
      }
    }

    const data = {
      url: raw,
      title: finalTitle,
      site,
      bullets: finalBullets,
      paragraphs: finalParagraphs,
      fullSummary: finalSummary,
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
    
  } catch (error) {
    console.error(`Summary error for ${raw}: ${error.message}`);
    
    // Return graceful fallback
    return {
      url: raw,
      title: title || "Không thể tải nội dung",
      site: new URL(raw).hostname,
      bullets: fallbackSummary ? 
        ["• " + fallbackSummary] : 
        ["• Không thể tải nội dung từ trang web", 
         "• Trang web có thể đang bảo trì hoặc yêu cầu xác thực",
         "• Vui lòng click 'Đọc bài gốc' để xem trực tiếp"],
      paragraphs: ["Không thể trích xuất nội dung. Vui lòng truy cập trực tiếp bài viết."],
      fullSummary: fallbackSummary || "Không thể tóm tắt nội dung",
      percentage: 0,
      requestedPercent: percent,
      error: true,
      message: error.message
    };
  }
}

// Optional AI endpoint (kept for compatibility)
export async function aiSummarizeUrl({ url, language = "vi", targetLength = null, percent = 70 }) {
  const data = await summarizeUrl({ url, percent });
  return { ...data, ai: false };
}