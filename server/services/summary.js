// server/services/summary.js
// ENHANCED VERSION - Better mobile support and VnExpress handling

import * as cheerio from "cheerio";
import { summaryCache, translationCache, mobileSummaryCache } from "../utils/cache.js";
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

// Check if VnExpress URL
function isVnExpress(url) {
  return url.includes('vnexpress.net');
}

// ENHANCED fetch with better VnExpress support
async function fetchWithRetryStrategies(url, isMobile = false) {
  const isVnEx = isVnExpress(url);
  
  // Longer timeouts for mobile and VnExpress
  const baseTimeout = isMobile ? 12000 : 15000;
  const vnexpressTimeout = isMobile ? 15000 : 20000;
  const timeout = isVnEx ? vnexpressTimeout : baseTimeout;
  
  const strategies = [
    // Strategy 1: Direct fetch with VnExpress-friendly headers
    {
      name: 'Direct VnExpress',
      timeout: timeout,
      fetch: async () => {
        const response = await fetch(url, {
          headers: {
            'User-Agent': isMobile ? 
              'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' :
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Upgrade-Insecure-Requests': '1',
            'Referer': isVnEx ? 'https://vnexpress.net/' : url
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(timeout)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        
        // Quick validation for VnExpress
        if (isVnEx && !html.includes('vnexpress')) {
          throw new Error('Invalid VnExpress response');
        }
        
        return html;
      }
    },
    
    // Strategy 2: Mobile User-Agent with simpler headers
    {
      name: 'Simple Mobile',
      timeout: timeout - 2000,
      fetch: async () => {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Accept': 'text/html,*/*',
            'Accept-Language': 'vi-VN,vi;q=0.9'
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(timeout - 2000)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.text();
      }
    },
    
    // Strategy 3: AllOrigins Proxy (better for VnExpress)
    {
      name: 'AllOrigins Proxy',
      timeout: timeout + 3000,
      fetch: async () => {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          signal: AbortSignal.timeout(timeout + 3000)
        });
        
        if (!response.ok) {
          throw new Error(`Proxy HTTP ${response.status}`);
        }
        
        const html = await response.text();
        
        // Validate content
        if (html.length < 1000) {
          throw new Error('Response too short');
        }
        
        return html;
      }
    },
    
    // Strategy 4: Alternative proxy
    {
      name: 'Proxy Alternative',
      timeout: timeout + 2000,
      fetch: async () => {
        // Try cors-anywhere alternative
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl, {
          signal: AbortSignal.timeout(timeout + 2000)
        });
        
        if (!response.ok) {
          throw new Error(`Alternative proxy HTTP ${response.status}`);
        }
        
        return await response.text();
      }
    },
{
  name: 'Jina Reader',
  timeout: timeout + 5000,
  fetch: async () => {
    const proxyUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
    const response = await fetch(proxyUrl, {
      headers: { 'Accept': 'text/plain,text/markdown,*/*' },
      signal: AbortSignal.timeout(timeout + 5000)
    });
    if (!response.ok) throw new Error(`Jina HTTP ${response.status}`);
    const text = await response.text();
    if (text.length < 500) throw new Error('Jina content too short');
    const html = `<html><body><article>${
      text.split(/\n{2,}/).map(p => `<p>${p.replace(/[<>]/g, '')}</p>`).join('')
    }</article></body></html>`;
    return html;
  }
}
];

  // Try each strategy with delay between attempts
  let lastError = null;
  
  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i];
    
    try {
      console.log(`[${isMobile ? 'Mobile' : 'Desktop'}] Trying strategy ${i + 1}/${strategies.length}: ${strategy.name} for ${isVnEx ? 'VnExpress' : 'site'}`);
      
      const html = await strategy.fetch();
      
      // Validate we got real content
      if (html && html.length > 1000) {
        // Check for blocking patterns
        if (html.includes('cf-browser-verification') ||
            html.includes('Just a moment') ||
            (html.includes('403') && html.includes('Forbidden')) ||
            html.includes('Access Denied')) {
          console.log(`Strategy ${strategy.name} was blocked`);
          lastError = new Error('Blocked by security');
          continue;
        }
        
        // For VnExpress, check for article content
        if (isVnEx) {
          const hasContent = html.includes('fck_detail') || 
                           html.includes('Normal') || 
                           html.includes('article-content') ||
                           html.includes('description');
          
          if (!hasContent) {
            console.log(`Strategy ${strategy.name} - No VnExpress content found`);
            lastError = new Error('No article content');
            continue;
          }
        }
        
        console.log(`✓ Strategy ${strategy.name} successful`);
        return html;
      } else {
        console.log(`Strategy ${strategy.name} returned insufficient content`);
        lastError = new Error('Insufficient content');
        continue;
      }
      
    } catch (error) {
      console.log(`✗ Strategy ${strategy.name} failed: ${error.message}`);
      lastError = error;
      
      // Add delay between retries to avoid rate limiting
      if (i < strategies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, isMobile ? 500 : 1000));
      }
    }
  }
  
  throw lastError || new Error('All fetch strategies failed');
}

// Special extractor for VnExpress
function extractVnExpressContent($) {
  const paragraphs = [];
  
  // Try lead/description first
  const lead = $('.sidebar-1 .description, h2.description, .description').first().text().trim();
  if (lead && lead.length > 30) {
    paragraphs.push(lead);
  }
  
  // Main content paragraphs
  $('.fck_detail p.Normal, article.fck p.Normal, .content-detail p').each((i, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 20 && !text.includes('Xem thêm:')) {
      paragraphs.push(text);
    }
  });
  
  // Fallback to any p tags in article
  if (paragraphs.length < 3) {
    $('article p, .article-content p').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 30 && !paragraphs.includes(text)) {
        paragraphs.push(text);
      }
    });
  }
  
  return paragraphs.join('\n\n');
}

// MAIN summarizeUrl with better error handling
export async function summarizeUrl({ url, percent = 70, fallbackSummary = "", req = null }) {
  const raw = String(url || "").trim();
  if (!raw) throw new Error("Missing url");
  
  // Check if mobile from headers
  const isMobile = req && req.headers && 
    (/mobile|android|iphone/i.test(req.headers['user-agent'] || '') ||
     req.headers['x-mobile'] === 'true' ||
     req.headers['x-client-type'] === 'mobile');
  
  const isVnEx = isVnExpress(raw);
  
  // Use mobile cache for mobile requests
  const cache = isMobile ? mobileSummaryCache : summaryCache;
  const cacheKey = `${raw}_${percent}_${isMobile ? 'm' : 'd'}${isVnEx ? '_vn' : ''}`;
  const cached = cache.get(cacheKey);
  
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
    console.log(`Fetching content from: ${raw} (${isMobile ? 'Mobile' : 'Desktop'})`);
    const html = await fetchWithRetryStrategies(raw, isMobile);
    
    if (!html || html.length < 100) {
      throw new Error("Could not fetch meaningful content");
    }
    
    const $ = cheerio.load(html, {
      decodeEntities: true,
      normalizeWhitespace: true
    });
    
    // Remove unwanted elements
    $('script, style, noscript, iframe, .advertisement, .ads, .social-share').remove();
    
    // Extract title with multiple fallbacks
    const title = $("meta[property='og:title']").attr("content") || 
                 $("meta[name='title']").attr("content") ||
                 $("title").text() || 
                 $("h1.title-detail, h1.title-page").first().text() || // VnExpress specific
                 $("h1.article-title").text() || 
                 $("h1").first().text() || 
                 "Bài viết";
    
    // Extract meta description as fallback
    const metaDesc = $("meta[property='og:description']").attr("content") || 
                    $("meta[name='description']").attr("content") || 
                    $('.sidebar-1 .description').text() || // VnExpress
                    "";
    
    let result;
    
    // Special handling for VnExpress
    if (isVnEx) {
      try {
        console.log('Using VnExpress special extractor');
        const vnContent = extractVnExpressContent($);
        
        if (vnContent && vnContent.length > 100) {
          // Create summary from VnExpress content
          const paragraphs = vnContent.split('\n\n').filter(p => p.trim().length > 20);
          const targetParagraphs = Math.ceil(paragraphs.length * (percent / 100));
          const selectedParagraphs = paragraphs.slice(0, Math.max(1, targetParagraphs));
          
          // Create bullets
          const bullets = selectedParagraphs.slice(0, 5).map(p => {
            const trimmed = p.length > 200 ? p.substring(0, 197) + '...' : p;
            return `• ${trimmed}`;
          });
          
          result = {
            url: raw,
            title: title.trim(),
            site: parsedUrl.hostname,
            bullets: bullets.length > 0 ? bullets : [`• ${metaDesc || title}`],
            paragraphs: selectedParagraphs,
            fullSummary: selectedParagraphs.join(' '),
            percentage: percent,
            requestedPercent: percent,
            originalLength: vnContent.length,
            summaryLength: selectedParagraphs.join(' ').length,
            mobile: isMobile,
            vnexpress: true
          };
        } else {
          throw new Error('VnExpress extraction failed');
        }
      } catch (vnError) {
        console.log('VnExpress extraction failed, using standard method:', vnError.message);
        // Fall through to standard extraction
      }
    }
    
    // Standard extraction if not VnExpress or VnExpress failed
    if (!result) {
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
        if (needsTranslation && !isMobile) { // Skip translation on mobile for speed
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
        console.log('Standard extraction failed, using fallback mode:', extractError.message);
        
        // FALLBACK MODE: Use meta description and basic content
        const paragraphs = [];
        
        // Try to get any paragraphs
        $("p").slice(0, 10).each((i, el) => {
          const text = $(el).text().trim();
          if (text.length > 50 && text.length < 1000 && !text.includes('Xem thêm')) {
            paragraphs.push(text);
          }
        });
        
        // If still no content, try divs with text
        if (paragraphs.length < 3) {
          $("div").slice(0, 20).each((i, el) => {
            const $el = $(el);
            // Only get divs with direct text content
            const text = $el.clone().children().remove().end().text().trim();
            if (text.length > 100 && text.length < 1000 && !paragraphs.some(p => p.includes(text))) {
              paragraphs.push(text);
            }
          });
        }
        
        const fallbackContent = (metaDesc ? metaDesc + " " : "") + paragraphs.join(" ");
        const contentToUse = fallbackContent.substring(0, 2000);
        
        // Create bullets from content
        const sentences = contentToUse.split(/[.!?]+/).filter(s => s.trim().length > 30);
        const bullets = [];
        
        for (let i = 0; i < Math.min(5, sentences.length); i++) {
          const sentence = sentences[i].trim();
          if (sentence.length > 250) {
            bullets.push(`• ${sentence.substring(0, 247)}...`);
          } else {
            bullets.push(`• ${sentence}`);
          }
        }
        
        // If still no bullets, use meta or title
        if (bullets.length === 0) {
          if (metaDesc) {
            bullets.push(`• ${metaDesc.substring(0, 300)}`);
          } else {
            bullets.push(`• ${title}`);
          }
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
    }
    
    // Cache successful result with appropriate TTL
    const cacheTTL = isMobile ? 60 * 60 * 1000 : 30 * 60 * 1000; // 1h for mobile, 30m for desktop
    cache.setWithTTL(cacheKey, result, cacheTTL);
    console.log(`✓ Cached summary for: ${raw} at ${percent}% (${isMobile ? 'mobile' : 'desktop'})`);
    
    return result;
    
  } catch (error) {
    console.error(`Summary error for ${raw}:`, error.message);
    
    // Return a more helpful fallback
    const fallback = fallbackSummary || req?.query?.fallback || "";
    
    if (fallback) {
      // Use fallback content if available
      const fallbackBullets = [];
      const fallbackSentences = fallback.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      for (let i = 0; i < Math.min(3, fallbackSentences.length); i++) {
        fallbackBullets.push(`• ${fallbackSentences[i].trim()}`);
      }
      
      if (fallbackBullets.length === 0) {
        fallbackBullets.push(`• ${fallback.substring(0, 300)}`);
      }
      
      return {
        url: raw,
        title: title || "Tóm tắt từ bản lưu",
        site: parsedUrl.hostname,
        bullets: fallbackBullets,
        paragraphs: fallbackBullets.map(b => b.replace('• ', '')),
        fullSummary: fallback,
        percentage: 100,
        requestedPercent: percent,
        fallback: true,
        mobile: isMobile,
        error: error.message,
        errorDetails: isVnEx ? 
          "VnExpress có thể đang bảo trì hoặc chặn truy cập. Đang hiển thị nội dung có sẵn." :
          "Không thể kết nối đến trang web. Đang hiển thị nội dung có sẵn."
      };
    }
    
    // Return minimal fallback even without fallbackSummary
    return {
      url: raw,
      title: "Không thể tải nội dung",
      site: parsedUrl.hostname,
      bullets: [
        `• Không thể kết nối đến ${parsedUrl.hostname}`,
        `• ${isVnEx ? 'VnExpress có thể đang bảo trì hoặc cập nhật hệ thống' : 'Vui lòng thử lại sau'}`,
        `• Bạn có thể truy cập trực tiếp vào link bài báo`
      ],
      paragraphs: [`Lỗi tải nội dung từ ${parsedUrl.hostname}. ${error.message}`],
      fullSummary: `Lỗi: ${error.message}`,
      percentage: 0,
      requestedPercent: percent,
      fallback: true,
      mobile: isMobile,
      error: error.message,
      errorCode: isVnEx ? 'VNEXPRESS_ERROR' : 'FETCH_ERROR'
    };
  }
}

// AI endpoint
export async function aiSummarizeUrl({ url, language = "vi", targetLength = null, percent = 70, req = null }) {
  const data = await summarizeUrl({ url, percent, req });
  return { ...data, ai: false };
}

export async function summarizeUrlWithProgress({ 
  url, 
  percent = 70, 
  fallbackSummary = "", 
  req = null,
  onProgress = null 
}) {
  const raw = String(url || "").trim();
  if (!raw) throw new Error("Missing url");
  
  // Check cache first
  const isMobile = req && req.headers && 
    (/mobile|android|iphone/i.test(req.headers['user-agent'] || '') ||
     req.headers['x-mobile'] === 'true');
  
  const cache = isMobile ? mobileSummaryCache : summaryCache;
  const cacheKey = `${raw}_${percent}_${isMobile ? 'm' : 'd'}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    if (onProgress) {
      onProgress({ stage: 'cache', percent: 100, message: 'Loaded from cache' });
    }
    return cached;
  }
  
  // Progress stages
  const stages = [
    { name: 'connecting', weight: 10, message: 'Đang kết nối...' },
    { name: 'fetching', weight: 30, message: 'Đang tải nội dung...' },
    { name: 'parsing', weight: 20, message: 'Đang phân tích HTML...' },
    { name: 'extracting', weight: 20, message: 'Đang trích xuất nội dung...' },
    { name: 'summarizing', weight: 15, message: 'Đang tóm tắt...' },
    { name: 'finalizing', weight: 5, message: 'Hoàn tất...' }
  ];
  
  let currentProgress = 0;
  const updateProgress = (stageName, stageProgress = 0) => {
    const stageIndex = stages.findIndex(s => s.name === stageName);
    if (stageIndex === -1) return;
    
    // Calculate cumulative progress
    let totalProgress = 0;
    for (let i = 0; i < stageIndex; i++) {
      totalProgress += stages[i].weight;
    }
    totalProgress += stages[stageIndex].weight * stageProgress;
    
    currentProgress = Math.min(95, totalProgress);
    
    if (onProgress) {
      onProgress({
        stage: stageName,
        percent: currentProgress,
        message: stages[stageIndex].message
      });
    }
  };
  
  try {
    let parsedUrl = new URL(raw);
    
    // Stage 1: Connecting
    updateProgress('connecting', 0.5);
    
    // Stage 2: Fetching
    updateProgress('fetching', 0);
    
    // Fetch with progress simulation
    const html = await fetchWithProgressTracking(raw, isMobile, (fetchProgress) => {
      updateProgress('fetching', fetchProgress / 100);
    });
    
    if (!html || html.length < 100) {
      throw new Error("Could not fetch meaningful content");
    }
    
    // Stage 3: Parsing
    updateProgress('parsing', 0);
    const $ = cheerio.load(html);
    updateProgress('parsing', 1);
    
    // Stage 4: Extracting
    updateProgress('extracting', 0);
    
    const title = $("meta[property='og:title']").attr("content") || 
                 $("title").text() || "Bài viết";
    
    updateProgress('extracting', 0.3);
    
    const metaDesc = $("meta[property='og:description']").attr("content") || "";
    
    updateProgress('extracting', 0.5);
    
    // Extract and summarize content
    const extracted = extractAndSummarizeContent($, percent);
    
    updateProgress('extracting', 1);
    
    // Stage 5: Summarizing
    updateProgress('summarizing', 0);
    
    // Process content
    let result = {
      url: raw,
      title: title.trim(),
      site: parsedUrl.hostname,
      bullets: extracted.bullets || [`• ${metaDesc || title}`],
      paragraphs: extracted.summarizedParagraphs || [metaDesc || title],
      fullSummary: extracted.summary || metaDesc || title,
      percentage: extracted.stats?.compressionRatio || percent,
      requestedPercent: percent,
      originalLength: extracted.stats?.originalLength || html.length,
      summaryLength: extracted.stats?.summaryLength || (extracted.summary || metaDesc).length,
      mobile: isMobile
    };
    
    updateProgress('summarizing', 1);
    
    // Stage 6: Finalizing
    updateProgress('finalizing', 0.5);
    
    // Cache result
    cache.set(cacheKey, result);
    
    updateProgress('finalizing', 1);
    
    if (onProgress) {
      onProgress({ stage: 'complete', percent: 100, message: 'Hoàn tất!' });
    }
    
    return result;
    
  } catch (error) {
    if (onProgress) {
      onProgress({ 
        stage: 'error', 
        percent: currentProgress, 
        message: 'Lỗi: ' + error.message,
        error: true 
      });
    }
    throw error;
  }
}

// Helper function for fetch with progress
async function fetchWithProgressTracking(url, isMobile, onProgress) {
  const timeout = isMobile ? 12000 : 15000;
  
  // Simulate progress during fetch
  const progressInterval = setInterval(() => {
    onProgress(Math.min(90, (onProgress.current || 0) + 10));
    onProgress.current = (onProgress.current || 0) + 10;
  }, 500);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(timeout)
    });
    
    clearInterval(progressInterval);
    onProgress(100);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
}