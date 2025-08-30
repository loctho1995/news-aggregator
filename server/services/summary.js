// server/services/summary.js
// FIXED VERSION - Specific for Vietnamese news sites

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

  try {
    const encoded = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=auto|${targetLang}`;
    const resp = await fetch(url, { 
      headers: { 'User-Agent': 'VN-News-Aggregator/1.0' }, 
      signal: AbortSignal.timeout(8000) 
    });
    if (resp.ok) {
      const data = await resp.json();
      const out = data?.responseData?.translatedText;
      if (out && !String(out).includes("MYMEMORY WARNING")) {
        translationCache.set(cacheKey, out);
        return out;
      }
    }
  } catch (_) { /* ignore */ }
  
  return text; // fallback to original
}

// Enhanced fetch with proper headers for Vietnamese sites
async function fetchWithProperHeaders(url) {
  const strategies = [
    // Strategy 1: Standard Vietnamese news site headers
    async () => {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(12000)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    },
    
    // Strategy 2: Mobile headers (often less restricted)
    async () => {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    },
    
    // Strategy 3: Googlebot (some sites allow)
    async () => {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi,en;q=0.8',
          'From': 'googlebot(at)googlebot.com'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    },
    
    // Strategy 4: CORS Proxy services
    async () => {
      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
      ];
      
      for (const proxyUrl of proxies) {
        try {
          const response = await fetch(proxyUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(15000)
          });
          
          if (response.ok) {
            const html = await response.text();
            if (html && html.length > 1000) {
              return html;
            }
          }
        } catch (e) {
          console.log(`Proxy ${proxyUrl} failed:`, e.message);
          continue;
        }
      }
      throw new Error('All proxies failed');
    },
    
    // Strategy 5: Archive services
    async () => {
      // Try archive.is
      const archiveUrl = `https://archive.is/newest/${url}`;
      const response = await fetch(archiveUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(12000)
      });
      
      if (response.ok) {
        return await response.text();
      }
      throw new Error('Archive fetch failed');
    }
  ];

  // Try each strategy
  let lastError = null;
  for (let i = 0; i < strategies.length; i++) {
    try {
      console.log(`Trying fetch strategy ${i + 1} for ${url}`);
      const html = await strategies[i]();
      
      // Validate we got real content
      if (html && html.length > 500) {
        // Check for blocking messages
        if (html.includes('unusual traffic') || 
            html.includes('Captcha') || 
            html.includes('Access Denied') ||
            html.includes('403 Forbidden') ||
            html.includes('406 Not Acceptable')) {
          console.log(`Strategy ${i + 1} got blocked, trying next...`);
          lastError = new Error('Blocked by website');
          continue;
        }
        
        console.log(`Strategy ${i + 1} successful`);
        return html;
      } else {
        console.log(`Strategy ${i + 1} returned empty/short content`);
        continue;
      }
    } catch (error) {
      console.log(`Strategy ${i + 1} failed:`, error.message);
      lastError = error;
      
      // Small delay between attempts to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw lastError || new Error('All fetch strategies failed');
}

// Main summarization function
export async function summarizeUrl({ url, percent = 70, fallbackSummary = "" }) {
  const raw = String(url || "").trim();
  if (!raw) throw new Error("Missing url");
  
  // Validate URL
  let parsedUrl;
  try {
    parsedUrl = new URL(raw);
    if (!/^https?:$/.test(parsedUrl.protocol)) throw new Error("Only http/https allowed");
  } catch (e) {
    throw new Error("Invalid URL");
  }

  const cacheKey = `${raw}_${percent}`;
  const cached = summaryCache.get(cacheKey);
  if (cached) return { cached: true, ...cached };

  let html = "";
  let title = "";
  
  try {
    // Fetch with enhanced strategies
    html = await fetchWithProperHeaders(raw);
    
    if (!html || html.length < 500) {
      throw new Error("Empty or insufficient content received");
    }
    
    const $ = cheerio.load(html);
    
    // Enhanced title extraction for Vietnamese sites
    title = $("meta[property='og:title']").attr("content") || 
            $("meta[name='title']").attr("content") ||
            $("title").text() || 
            $("h1.title-detail").text() || // VnExpress specific
            $("h1.article-title").text() || // Other VN sites
            $("h1").first().text() || 
            "";
    
    title = title.trim();
    
    // Clean title if contains error messages
    if (title.includes('Access Denied') || 
        title.includes('Error') || 
        title.includes('404') ||
        !title) {
      title = "Bài viết từ " + parsedUrl.hostname;
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

    // Validate extracted content
    if (!fullContent || fullContent.length < 100) {
      // Try to get at least meta description
      const metaDescription = $("meta[property='og:description']").attr("content") ||
                             $("meta[name='description']").attr("content") ||
                             "";
      
      if (metaDescription) {
        return {
          url: raw,
          title: title || "Không có tiêu đề",
          site: parsedUrl.hostname,
          bullets: [`• ${metaDescription}`],
          paragraphs: [metaDescription],
          fullSummary: metaDescription,
          percentage: 100,
          requestedPercent: percent,
          originalLength: metaDescription.length,
          summaryLength: metaDescription.length,
          fallback: true,
          message: "Sử dụng mô tả meta do không trích xuất được nội dung đầy đủ"
        };
      }
      
      // Use fallback if provided
      if (fallbackSummary) {
        return {
          url: raw,
          title: title || "Không có tiêu đề",
          site: parsedUrl.hostname,
          bullets: [`• ${fallbackSummary}`],
          paragraphs: [fallbackSummary],
          fullSummary: fallbackSummary,
          percentage: 100,
          requestedPercent: percent,
          originalLength: fallbackSummary.length,
          summaryLength: fallbackSummary.length,
          fallback: true
        };
      }
      
      throw new Error("Không thể trích xuất nội dung từ trang web");
    }

    // Check if international source
    const site = parsedUrl.hostname;
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
        for (const paragraph of summarizedParagraphs.slice(0, 5)) {
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
    console.error(`Summary error for ${raw}:`, error.message);
    
    // Return graceful fallback with useful info
    return {
      url: raw,
      title: title || "Không thể tải nội dung",
      site: parsedUrl.hostname,
      bullets: fallbackSummary ? 
        [`• ${fallbackSummary}`] : 
        [
          `• Không thể tải nội dung từ ${parsedUrl.hostname}`,
          `• Lỗi: ${error.message}`,
          `• Vui lòng click 'Đọc bài gốc' để xem trực tiếp trên trang web`
        ],
      paragraphs: [`Không thể trích xuất nội dung. Lỗi: ${error.message}`],
      fullSummary: fallbackSummary || `Không thể tóm tắt. Lỗi: ${error.message}`,
      percentage: 0,
      requestedPercent: percent,
      error: true,
      message: error.message
    };
  }
}

// AI endpoint for compatibility
export async function aiSummarizeUrl({ url, language = "vi", targetLength = null, percent = 70 }) {
  const data = await summarizeUrl({ url, percent });
  return { ...data, ai: false };
}