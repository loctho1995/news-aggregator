// server/services/summary.js
// FIXED VERSION - Better error handling and retry logic

import * as cheerio from "cheerio";
import { summaryCache, translationCache } from "../utils/cache.js";
import { extractAndSummarizeContent } from "./aggregator/content-extractor/index.js";

// Language detection
const vietnamesePattern = /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
function detectLanguage(text = "") {
  return vietnamesePattern.test(text) ? "vi" : "en";
}

// Translation function (simplified for speed)
async function translateText(text, targetLang = "vi") {
  if (!text || detectLanguage(text) === targetLang) return text;
  const cacheKey = `tl:${targetLang}:${text.slice(0,100)}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  try {
    const encoded = encodeURIComponent(text.slice(0, 500));
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=auto|${targetLang}`;
    const resp = await fetch(url, { 
      signal: AbortSignal.timeout(5000)
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
  
  return text;
}

// ENHANCED fetch with multiple strategies and better error handling
async function fetchWithRetryStrategies(url, isMobile = false) {
  const strategies = [
    // Strategy 1: Direct fetch with standard headers
    {
      name: 'Direct Standard',
      timeout: isMobile ? 8000 : 12000,
      fetch: async () => {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(isMobile ? 8000 : 12000)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.text();
      }
    },
    
    // Strategy 2: Mobile User-Agent
    {
      name: 'Mobile UA',
      timeout: isMobile ? 7000 : 10000,
      fetch: async () => {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9',
            'Accept-Encoding': 'gzip, deflate'
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(isMobile ? 7000 : 10000)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.text();
      }
    },
    
    // Strategy 3: AllOrigins Proxy
    {
      name: 'AllOrigins Proxy',
      timeout: isMobile ? 10000 : 15000,
      fetch: async () => {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl, {
          signal: AbortSignal.timeout(isMobile ? 10000 : 15000)
        });
        
        if (!response.ok) {
          throw new Error(`Proxy HTTP ${response.status}`);
        }
        
        return await response.text();
      }
    },
    
    // Strategy 4: CorsProxy.io
    {
      name: 'CorsProxy',
      timeout: isMobile ? 10000 : 15000,
      fetch: async () => {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; News Aggregator/1.0)'
          },
          signal: AbortSignal.timeout(isMobile ? 10000 : 15000)
        });
        
        if (!response.ok) {
          throw new Error(`CorsProxy HTTP ${response.status}`);
        }
        
        return await response.text();
      }
    },
    
    // Strategy 5: Googlebot UA (some sites allow)
    {
      name: 'Googlebot',
      timeout: 8000,
      fetch: async () => {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'vi,en;q=0.8'
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(8000)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.text();
      }
    }
  ];

  // Try each strategy with delay between attempts
  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i];
    
    try {
      console.log(`Trying strategy ${i + 1}/${strategies.length}: ${strategy.name}`);
      
      const html = await strategy.fetch();
      
      // Validate we got real content
      if (html && html.length > 500) {
        // Check for blocking patterns
        if (html.includes('cloudflare') || 
            html.includes('cf-browser-verification') ||
            html.includes('Just a moment') ||
            html.includes('Access denied') ||
            html.includes('403 Forbidden')) {
          console.log(`Strategy ${strategy.name} was blocked`);
          continue;
        }
        
        console.log(`✓ Strategy ${strategy.name} successful`);
        return html;
      } else {
        console.log(`Strategy ${strategy.name} returned insufficient content`);
        continue;
      }
      
    } catch (error) {
      console.log(`✗ Strategy ${strategy.name} failed: ${error.message}`);
      
      // Add delay between retries to avoid rate limiting
      if (i < strategies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw new Error('All fetch strategies failed');
}

// MAIN summarizeUrl with better error handling
export async function summarizeUrl({ url, percent = 70, fallbackSummary = "", req = null }) {
  const raw = String(url || "").trim();
  if (!raw) throw new Error("Missing url");
  
  // Check if mobile from headers
  const isMobile = req && req.headers && 
    (/mobile|android|iphone/i.test(req.headers['user-agent'] || '') ||
     req.headers['x-mobile'] === 'true');
  
  // Cache key includes mobile flag and percent
  const cacheKey = `${raw}_${percent}_${isMobile ? 'm' : 'd'}`;
  const cached = summaryCache.get(cacheKey);
  if (cached) {
    console.log(`Cache hit for ${isMobile ? 'mobile' : 'desktop'}: ${raw}`);
    return { cached: true, ...cached };
  }
  
  // Validate URL
  let parsedUrl;
  try {
    parsedUrl = new URL(raw);
    if (!/^https?:$/.test(parsedUrl.protocol)) throw new Error("Only http/https allowed");
  } catch (e) {
    throw new Error("Invalid URL format");
  }

  try {
    // Fetch with enhanced retry strategies
    console.log(`Fetching content from: ${raw}`);
    const html = await fetchWithRetryStrategies(raw, isMobile);
    
    if (!html || html.length < 100) {
      throw new Error("Could not fetch meaningful content");
    }
    
    const $ = cheerio.load(html);
    
    // Extract title with multiple fallbacks
    const title = $("meta[property='og:title']").attr("content") || 
                 $("meta[name='title']").attr("content") ||
                 $("title").text() || 
                 $("h1.title-detail").text() || // VnExpress specific
                 $("h1.article-title").text() || 
                 $("h1").first().text() || 
                 "Bài viết";
    
    // Extract meta description as fallback
    const metaDesc = $("meta[property='og:description']").attr("content") || 
                    $("meta[name='description']").attr("content") || "";
    
    let result;
    
    // Try to extract and summarize content
    try {
      const extracted = extractAndSummarizeContent($, percent);
      
      // Check if we got meaningful extraction
      if (!extracted.summary || extracted.summary.length < 50) {
        throw new Error("Extraction failed");
      }
      
      // Check if international site
      const isInternational = /(wsj|ft|bloomberg|economist|reuters|cnbc|marketwatch)/i.test(parsedUrl.hostname);
      let needsTranslation = isInternational && detectLanguage(extracted.summary) !== "vi";
      
      result = {
        url: raw,
        title: title.trim(),
        site: parsedUrl.hostname,
        bullets: extracted.bullets && extracted.bullets.length > 0 ? 
                extracted.bullets : 
                [metaDesc ? `• ${metaDesc}` : `• ${title}`],
        paragraphs: extracted.summarizedParagraphs && extracted.summarizedParagraphs.length > 0 ?
                   extracted.summarizedParagraphs :
                   [metaDesc || title],
        fullSummary: extracted.summary || metaDesc || title,
        percentage: extracted.stats?.compressionRatio || percent,
        requestedPercent: percent,
        originalLength: extracted.stats?.originalLength || html.length,
        summaryLength: extracted.stats?.summaryLength || (extracted.summary || metaDesc).length,
        originalParagraphCount: extracted.stats?.originalParagraphCount || 1,
        summarizedParagraphCount: extracted.stats?.summarizedParagraphCount || 1,
        translated: needsTranslation,
        mobile: isMobile
      };
      
      // Translate if needed
      if (needsTranslation) {
        try {
          const translatedTitle = await translateText(title);
          if (translatedTitle !== title) {
            result.title = translatedTitle;
          }
          
          // Translate first 3 bullets
          const translatedBullets = [];
          for (let i = 0; i < Math.min(3, result.bullets.length); i++) {
            const translated = await translateText(result.bullets[i].replace('• ', ''));
            translatedBullets.push(`• ${translated}`);
          }
          if (translatedBullets.length > 0) {
            result.bullets = translatedBullets;
            result.paragraphs = translatedBullets.map(b => b.replace('• ', ''));
            result.fullSummary = translatedBullets.join(' ');
          }
        } catch (e) {
          console.log('Translation failed, using original');
        }
      }
      
    } catch (extractError) {
      console.log('Extraction failed, using fallback mode:', extractError.message);
      
      // FALLBACK MODE: Use meta description and basic content
      const paragraphs = [];
      $("p").slice(0, 5).each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 50 && text.length < 500) {
          paragraphs.push(text);
        }
      });
      
      const fallbackContent = metaDesc + " " + paragraphs.join(" ");
      const contentToUse = fallbackContent.substring(0, 1500);
      
      // Create bullets from content
      const sentences = contentToUse.split(/[.!?]+/).filter(s => s.trim().length > 30);
      const bullets = [];
      
      for (let i = 0; i < Math.min(5, sentences.length); i++) {
        bullets.push(`• ${sentences[i].trim()}`);
      }
      
      // If still no bullets, use meta or title
      if (bullets.length === 0) {
        bullets.push(metaDesc ? `• ${metaDesc}` : `• ${title}`);
      }
      
      result = {
        url: raw,
        title: title.trim(),
        site: parsedUrl.hostname,
        bullets: bullets,
        paragraphs: bullets.map(b => b.replace('• ', '')),
        fullSummary: contentToUse || metaDesc || title,
        percentage: percent,
        requestedPercent: percent,
        originalLength: html.length,
        summaryLength: contentToUse.length,
        mobile: isMobile,
        fallbackMode: true
      };
    }
    
    // Cache successful result
    summaryCache.set(cacheKey, result);
    console.log(`✓ Cached summary for: ${raw} at ${percent}%`);
    
    return result;
    
  } catch (error) {
    console.error(`Summary error for ${raw}:`, error.message);
    
    // Return a more helpful fallback
    if (fallbackSummary || req?.query?.fallback) {
      const fallback = fallbackSummary || req.query.fallback || "Không thể tải nội dung";
      
      return {
        url: raw,
        title: "Tóm tắt từ bản lưu",
        site: parsedUrl.hostname,
        bullets: [`• ${fallback.substring(0, 300)}`],
        paragraphs: [fallback],
        fullSummary: fallback,
        percentage: 100,
        requestedPercent: percent,
        fallback: true,
        mobile: isMobile,
        error: error.message,
        errorDetails: "Không thể kết nối đến trang web. Có thể do trang web chặn bot hoặc lỗi mạng."
      };
    }
    
    // Return minimal fallback even without fallbackSummary
    return {
      url: raw,
      title: "Không thể tải nội dung",
      site: parsedUrl.hostname,
      bullets: [
        `• Không thể kết nối đến ${parsedUrl.hostname}`,
        `• Vui lòng thử lại sau hoặc truy cập trực tiếp`,
        `• Lỗi: ${error.message}`
      ],
      paragraphs: [`Không thể tải nội dung từ ${parsedUrl.hostname}. ${error.message}`],
      fullSummary: `Lỗi tải nội dung: ${error.message}`,
      percentage: 0,
      requestedPercent: percent,
      fallback: true,
      mobile: isMobile,
      error: error.message
    };
  }
}

// AI endpoint
export async function aiSummarizeUrl({ url, language = "vi", targetLength = null, percent = 70, req = null }) {
  const data = await summarizeUrl({ url, percent, req });
  return { ...data, ai: false };
}