// server/services/summary.js
// OPTIMIZED VERSION - Keep requested percent for all devices

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
    const encoded = encodeURIComponent(text.slice(0, 500)); // Limit text length
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=auto|${targetLang}`;
    const resp = await fetch(url, { 
      signal: AbortSignal.timeout(5000) // Shorter timeout
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

// OPTIMIZED fetch with mobile detection
async function fetchWithMobileOptimization(url, isMobile = false) {
  const timeout = isMobile ? 6000 : 10000; // 6s for mobile, 10s for desktop
  
  // Try direct fetch first
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': isMobile ? 
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1' :
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9',
        'Accept-Encoding': 'gzip, deflate'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeout)
    });
    
    if (response.ok) {
      const html = await response.text();
      if (html && html.length > 500) {
        return html;
      }
    }
  } catch (e) {
    console.log('Direct fetch failed, trying proxy...');
  }
  
  // Single proxy fallback (fastest one)
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, {
      signal: AbortSignal.timeout(timeout)
    });
    
    if (response.ok) {
      return await response.text();
    }
  } catch (e) {
    console.log('Proxy fetch failed');
  }
  
  throw new Error('Failed to fetch content');
}

// MAIN OPTIMIZED summarizeUrl
export async function summarizeUrl({ url, percent = 70, fallbackSummary = "", req = null }) {
  const raw = String(url || "").trim();
  if (!raw) throw new Error("Missing url");
  
  // Check if mobile from headers
  const isMobile = req && req.headers && 
    (/mobile|android|iphone/i.test(req.headers['user-agent'] || '') ||
     req.headers['x-mobile'] === 'true');
  
  // KHÔNG TỰ ĐỘNG GIẢM PERCENT CHO MOBILE - giữ nguyên percent request
  // Removed: if (isMobile && percent > 50) percent = 50;
  
  // Cache key includes mobile flag
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
    throw new Error("Invalid URL");
  }

  try {
    // Mobile-optimized fetch
    const html = await fetchWithMobileOptimization(raw, isMobile);
    const $ = cheerio.load(html);
    
    // Quick extraction for mobile
    const title = $("meta[property='og:title']").attr("content") || 
                 $("title").text() || 
                 $("h1").first().text() || 
                 "Bài viết";
    
    let result;
    
    // Mobile mode - but still respect requested percent
    if (isMobile && percent <= 40) {
      // ULTRA-LIGHT mode only for very low percent on mobile
      const metaDesc = $("meta[property='og:description']").attr("content") || 
                      $("meta[name='description']").attr("content") || "";
      
      // Get first few paragraphs quickly
      const paragraphs = [];
      $("article p, .content p, .detail p, p").slice(0, 5).each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 30 && text.length < 500) {
          paragraphs.push(text);
        }
      });
      
      // Combine meta + paragraphs
      const quickContent = metaDesc + " " + paragraphs.join(" ");
      const contentToUse = quickContent.substring(0, 1000); // Limit to 1000 chars
      
      // Create simple bullets
      const bullets = [];
      const sentences = contentToUse.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      for (let i = 0; i < Math.min(3, sentences.length); i++) {
        bullets.push(`• ${sentences[i].trim()}`);
      }
      
      // If no bullets, use meta description
      if (bullets.length === 0 && metaDesc) {
        bullets.push(`• ${metaDesc.substring(0, 200)}`);
      }
      
      result = {
        url: raw,
        title: title.trim().substring(0, 200),
        site: parsedUrl.hostname,
        bullets: bullets,
        paragraphs: bullets.map(b => b.replace('• ', '')),
        fullSummary: contentToUse,
        percentage: percent,
        requestedPercent: percent,
        originalLength: contentToUse.length,
        summaryLength: contentToUse.length,
        mobile: true,
        quickMode: true
      };
      
    } else {
      // NORMAL MODE: Full extraction with requested percent
      const extracted = extractAndSummarizeContent($, percent);
      
      // Check if international site
      const isInternational = /(wsj|ft|bloomberg|economist|reuters|cnbc|marketwatch)/i.test(parsedUrl.hostname);
      let needsTranslation = isInternational && detectLanguage(extracted.summary) !== "vi";
      
      result = {
        url: raw,
        title: title.trim(),
        site: parsedUrl.hostname,
        bullets: extracted.bullets,
        paragraphs: extracted.summarizedParagraphs,
        fullSummary: extracted.summary,
        percentage: extracted.stats.compressionRatio,
        requestedPercent: percent,
        originalLength: extracted.stats.originalLength,
        summaryLength: extracted.stats.summaryLength,
        originalParagraphCount: extracted.stats.originalParagraphCount,
        summarizedParagraphCount: extracted.stats.summarizedParagraphCount,
        translated: needsTranslation,
        mobile: isMobile
      };
      
      // Translate if needed (both mobile and desktop)
      if (needsTranslation) {
        try {
          const translatedTitle = await translateText(title);
          if (translatedTitle !== title) {
            result.title = translatedTitle;
          }
          
          // Translate first 3 bullets only
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
    }
    
    // Cache result
    summaryCache.set(cacheKey, result);
    console.log(`Cached ${isMobile ? 'mobile' : 'desktop'} summary for: ${raw} at ${percent}%`);
    
    return result;
    
  } catch (error) {
    console.error(`Summary error for ${raw}:`, error.message);
    
    // Quick fallback
    if (fallbackSummary) {
      return {
        url: raw,
        title: "Tóm tắt nhanh",
        site: parsedUrl.hostname,
        bullets: [`• ${fallbackSummary.substring(0, 200)}`],
        paragraphs: [fallbackSummary],
        fullSummary: fallbackSummary,
        percentage: 100,
        requestedPercent: percent,
        fallback: true,
        mobile: isMobile,
        error: error.message
      };
    }
    
    throw error;
  }
}

// AI endpoint (simplified)
export async function aiSummarizeUrl({ url, language = "vi", targetLength = null, percent = 70, req = null }) {
  const data = await summarizeUrl({ url, percent, req });
  return { ...data, ai: false };
}