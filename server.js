import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import cors from "cors";
import pino from "pino";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";
import { fetchAll, fetchAllStreaming, listSources } from "./src/aggregator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || "info" });

app.use(cors());
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/api/healthz", (req, res) => res.json({ ok: true }));
app.get("/api/sources", (req, res) => res.json({ sources: listSources() }));

app.get("/api/news", async (req, res) => {
  const hours = Math.max(1, Math.min(parseInt(req.query.hours || "24", 10), 168));
  const include = String(req.query.sources || "").split(",").map((s) => s.trim()).filter(Boolean);
  const group = req.query.group || null;
  const limitPerSource = Math.max(1, Math.min(parseInt(req.query.limit || "30", 10), 100));
  const streaming = req.query.stream === 'true';
  
  try {
    if (streaming) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      await fetchAllStreaming({ 
        include, 
        hours, 
        limitPerSource, 
        group,
        onItem: (item) => {
          res.write(JSON.stringify(item) + '\n');
        }
      });
      
      res.end();
    } else {
      const items = await fetchAll({ include, hours, limitPerSource, group });
      res.json({ generatedAt: new Date().toISOString(), count: items.length, items });
    }
  } catch (e) {
    logger.error(e);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message || "Unknown error" });
    }
  }
});

// Caches
const SUM_CACHE = new Map();
const TRANSLATION_CACHE = new Map();
const AI_SUMMARY_CACHE = new Map();
const TTL_MS = 30 * 60 * 1000;
const TRANSLATION_TTL = 24 * 60 * 60 * 1000;
const AI_SUMMARY_TTL = 60 * 60 * 1000;

const cacheGet = k => { const v = SUM_CACHE.get(k); if (!v) return null; if (Date.now()-v.ts>TTL_MS){SUM_CACHE.delete(k); return null;} return v.data; };
const cacheSet = (k,d) => SUM_CACHE.set(k,{ts:Date.now(), data:d});

const translationCacheGet = (key) => {
  const entry = TRANSLATION_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TRANSLATION_TTL) {
    TRANSLATION_CACHE.delete(key);
    return null;
  }
  return entry.text;
};

const translationCacheSet = (key, text) => {
  TRANSLATION_CACHE.set(key, { text, timestamp: Date.now() });
};

const aiSummaryCacheGet = (key) => {
  const entry = AI_SUMMARY_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > AI_SUMMARY_TTL) {
    AI_SUMMARY_CACHE.delete(key);
    return null;
  }
  return entry.data;
};

const aiSummaryCacheSet = (key, data) => {
  AI_SUMMARY_CACHE.set(key, { data, timestamp: Date.now() });
};

function extractMainContent($) {
  const paywallIndicators = [
    "vui lòng nhập email",
    "vui lòng đăng nhập", 
    "đăng ký để đọc",
    "mã xác nhận",
    "subscription required",
    "please login",
    "member only"
  ];
  
  const bodyText = $("body").text().toLowerCase();
  const hasPaywall = paywallIndicators.some(indicator => bodyText.includes(indicator));
  
  if (hasPaywall) {
    console.log("Detected paywall/registration form, attempting bypass...");
    
    $(".modal, .popup, .overlay, .paywall, .subscription-box, .register-form").remove();
    $("[class*='modal'], [class*='popup'], [class*='overlay']").remove();
    $("[id*='modal'], [id*='popup'], [id*='overlay']").remove();
    
    $("form").each((_, form) => {
      const $form = $(form);
      const formText = $form.text().toLowerCase();
      if (formText.includes("email") || formText.includes("đăng ký") || formText.includes("xác nhận")) {
        $form.remove();
      }
    });
    
    $(".content, .article-content, [class*='content']").css({
      'display': 'block',
      'visibility': 'visible',
      'overflow': 'visible',
      'height': 'auto',
      'max-height': 'none'
    });
    
    $("*").each((_, el) => {
      const $el = $(el);
      const style = $el.attr("style") || "";
      if (style.includes("blur") || style.includes("opacity")) {
        $el.css({
          'filter': 'none',
          'opacity': '1'
        });
      }
    });
  }
  
  $(
    "script, style, noscript, iframe, " +
    ".advertisement, .ads, .banner, .sidebar, .widget, " +
    ".social-share, .related-news, .comment, .comments, " +
    ".tags, .tag, .keyword, .keywords, .topic-keywords, " +
    ".author-info, .source-info, .copyright, " +
    ".navigation, .breadcrumb, .menu, " +
    ".share-button, .reaction, .like-button, " +
    ".video-list, .photo-list, .most-viewed, " +
    ".box-tinlienquan, .box-category, .box-news-other, " +
    ".register-form, .login-form, .subscription-form"
  ).remove();
  
  $("*").each((_, el) => {
    const $el = $(el);
    const text = $el.text().toLowerCase();
    if (text.startsWith("từ khóa:") || 
        text.startsWith("tags:") || 
        text.startsWith("chủ đề:") ||
        text.startsWith("tin liên quan") ||
        text.startsWith("xem thêm")) {
      $el.remove();
    }
  });
  
  const ogDescription = $("meta[property='og:description']").attr("content") || "";
  const metaDescription = $("meta[name='description']").attr("content") || "";
  const articleLead = $(".sapo, .lead, .description, .chapeau, .article-summary").text().trim();
  
  const selectors = {
    vnexpress: [".fck_detail", ".article-content", ".content-detail"],
    tuoitre: [".content-detail", ".detail-content", ".detail__content"],
    dantri: [".singular-content", ".detail-content", ".e-magazine__body"],
    thanhnien: [".detail-content", ".content", ".article-body"],
    cafe: [".newscontent", ".detail-content", ".content-detail"],
    vietnamnet: [".ArticleContent", ".article-content", ".content__body"],
    generic: [
      "article > div:not(.tags):not(.keywords)",
      "[itemprop='articleBody']",
      ".article-body", ".entry-content", ".post-content",
      ".news-content", ".main-content", ".story-body"
    ]
  };
  
  let bestContent = "";
  let maxScore = 0;
  
  Object.values(selectors).flat().forEach(sel => {
    try {
      $(sel).each((_, el) => {
        const $el = $(el);
        $el.find(".tags, .keywords, .topic-keywords, .author-bio, .source").remove();
        
        const text = $el.text().trim();
        const paragraphs = $el.find("p").length;
        const links = $el.find("a").length;
        const images = $el.find("img").length;
        const score = text.length + (paragraphs * 100) - (links * 20) + (images * 30);
        const linkRatio = links / Math.max(1, text.length / 100);
        
        if (score > maxScore && text.length > 200 && linkRatio < 3) {
          maxScore = score;
          bestContent = text;
        }
      });
    } catch (e) {}
  });
  
  if (!bestContent || bestContent.length < 300) {
    const contentParts = [];
    
    if (articleLead && articleLead.length > 50 && !articleLead.includes("Từ khóa")) {
      contentParts.push(articleLead);
    }
    
    $("p").each((_, p) => {
      const $p = $(p);
      const parent = $p.parent();
      if (parent.hasClass("tags") || parent.hasClass("keywords")) return;
      
      const text = $p.text().trim();
      
      if (text.length > 60 && 
          !text.toLowerCase().includes("từ khóa") &&
          !text.toLowerCase().includes("tags:") &&
          !text.toLowerCase().includes("xem thêm") && 
          !text.toLowerCase().includes("đọc thêm") &&
          !text.toLowerCase().includes("tin liên quan") &&
          !text.toLowerCase().includes("bình luận") &&
          !text.toLowerCase().includes("chia sẻ")) {
        contentParts.push(text);
      }
    });
    
    bestContent = contentParts.join(" ");
  }
  
  if (!bestContent || bestContent.length < 100) {
    bestContent = [ogDescription, metaDescription, articleLead]
      .filter(text => text && !text.includes("Từ khóa"))
      .join(" ");
  }
  
  bestContent = bestContent
    .replace(/\s+/g, " ")
    .replace(/(\r\n|\n|\r)/gm, " ")
    .replace(/Từ khóa[:\s].*/gi, "")
    .replace(/Tags?[:\s].*/gi, "")
    .replace(/Chủ đề[:\s].*/gi, "")
    .replace(/Hashtag[:\s].*/gi, "")
    .replace(/Chia sẻ bài viết.*/gi, "")
    .replace(/Xem thêm[:\s].*/gi, "")
    .replace(/Đọc thêm[:\s].*/gi, "")
    .replace(/TIN LIÊN QUAN.*/gi, "")
    .replace(/Tin cùng chuyên mục.*/gi, "")
    .replace(/Bài viết liên quan.*/gi, "")
    .replace(/Bình luận.*/gi, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\(Ảnh:.*?\)/gi, "")
    .replace(/Nguồn:.*$/gi, "")
    .replace(/Theo\s+[A-Z][^.]{0,30}$/gi, "")
    .trim();
  
  console.log(`Extracted content: ${bestContent.length} chars (score: ${maxScore})`);
  return bestContent;
}

// Enhanced Translation System
async function translateText(text, targetLang = 'vi') {
  if (!text || text.trim().length === 0) return text;
  
  const cacheKey = `${text.slice(0, 100)}_${targetLang}`;
  const cached = translationCacheGet(cacheKey);
  if (cached) return cached;

  const translationMethods = [
    async () => {
      const response = await fetch('https://translate.terraprint.co/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: 'auto',
          target: targetLang,
          format: 'text'
        }),
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.translatedText || null;
      }
      return null;
    },

    async () => {
      const encoded = encodeURIComponent(text);
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encoded}&langpair=auto|${targetLang}`,
        { signal: AbortSignal.timeout(8000) }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.responseData && data.responseData.translatedText && 
            !data.responseData.translatedText.includes('MYMEMORY WARNING')) {
          return data.responseData.translatedText;
        }
      }
      return null;
    },

    async () => {
      const encoded = encodeURIComponent(text);
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encoded}`,
        { 
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Translation Bot)' },
          signal: AbortSignal.timeout(8000)
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          return data[0].map(item => item[0]).join('');
        }
      }
      return null;
    }
  ];

  for (const method of translationMethods) {
    try {
      const result = await method();
      if (result && result.trim() !== text.trim()) {
        translationCacheSet(cacheKey, result);
        console.log(`Translation successful: ${text.slice(0, 50)}... -> ${result.slice(0, 50)}...`);
        return result;
      }
    } catch (error) {
      console.log(`Translation method failed: ${error.message}`);
      continue;
    }
  }
  
  console.log('All translation methods failed, returning original with [EN] prefix');
  return `[EN] ${text}`;
}

async function translatePageContent(content, sourceLanguage = 'en') {
  if (!content || content.length < 10) return content;
  
  const chunks = content.match(/.{1,800}(?:\s|$)/g) || [content];
  const translatedChunks = [];
  
  for (const chunk of chunks) {
    if (chunk.trim()) {
      const translated = await translateText(chunk.trim());
      translatedChunks.push(translated);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return translatedChunks.join(' ');
}

function detectLanguage(text) {
  const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  const chinesePattern = /[\u4e00-\u9fa5]/;
  const koreanPattern = /[\uac00-\ud7af]/;
  const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff]/;
  
  if (vietnamesePattern.test(text)) return 'vi';
  if (chinesePattern.test(text)) return 'zh';
  if (koreanPattern.test(text)) return 'ko';
  if (japanesePattern.test(text)) return 'ja';
  
  return 'en';
}

async function summarizeToBulletsWithTranslation(fullText, sourceGroup) {
  const bullets = summarizeToBullets(fullText);
  
  if (sourceGroup === 'internationaleconomics') {
    const lang = detectLanguage(fullText);
    if (lang !== 'vi') {
      const translatedBullets = await Promise.all(
        bullets.map(async (bullet) => {
          if (bullet.startsWith('(')) return bullet;
          const translated = await translateText(bullet);
          return translated;
        })
      );
      return translatedBullets;
    }
  }
  
  return bullets;
}

function splitSentencesNoLookbehind(fullText) {
  if (!fullText) return [];
  return fullText.match(/[^.!?…]+(?:[.!?…]+|$)/g) || [];
}

function summarizeToBullets(fullText) {
  if (!fullText || fullText.length < 30) {
    console.log(`Text too short: ${fullText?.length || 0} chars`);
    return [`(Không thể trích xuất nội dung từ trang này)`];
  }
  
  if (fullText.length < 200) {
    return [fullText];
  }
  
  const sentences = splitSentencesNoLookbehind(fullText)
    .filter(s => {
      const clean = s.trim();
      return clean.length > 30 && 
             !clean.toLowerCase().includes("từ khóa") &&
             !clean.toLowerCase().includes("xem thêm") &&
             !clean.toLowerCase().includes("đọc thêm");
    });
  
  if (sentences.length === 0) {
    return [fullText.slice(0, 300) + (fullText.length > 300 ? "..." : "")];
  }
  
  if (sentences.length <= 3) {
    return sentences;
  }
  
  const mainPoints = [];
  const processedIndexes = new Set();
  
  for (let i = 0; i < Math.min(2, sentences.length); i++) {
    if (sentences[i].length > 50) {
      mainPoints.push({
        text: sentences[i],
        index: i,
        type: 'intro',
        score: 100 - i * 10
      });
      processedIndexes.add(i);
    }
  }
  
  sentences.forEach((s, i) => {
    if (!processedIndexes.has(i)) {
      const hasNumbers = /\d+[\s]*(tỷ|triệu|nghìn|%|phần trăm|USD|VND|đồng)/i.test(s);
      const hasQuotes = /"[^"]{20,}"/.test(s) || /["""][^"""]{20,}["""]/.test(s);
      
      if (hasNumbers || hasQuotes) {
        mainPoints.push({
          text: s,
          index: i,
          type: hasNumbers ? 'data' : 'quote',
          score: 80
        });
        processedIndexes.add(i);
      }
    }
  });
  
  const importantKeywords = [
    /^(Theo|Ông|Bà|PGS|TS|BS|Luật sư|Chuyên gia)/i,
    /quan trọng|chủ yếu|chính là|điểm nổi bật|đáng chú ý/i,
    /kết luận|tóm lại|như vậy|do đó|vì thế/i,
    /tuy nhiên|mặt khác|ngược lại|trong khi đó/i,
    /đầu tiên|thứ hai|thứ ba|cuối cùng/i
  ];
  
  sentences.forEach((s, i) => {
    if (!processedIndexes.has(i)) {
      for (const pattern of importantKeywords) {
        if (pattern.test(s)) {
          mainPoints.push({
            text: s,
            index: i,
            type: 'keyword',
            score: 70
          });
          processedIndexes.add(i);
          break;
        }
      }
    }
  });
  
  for (let i = sentences.length - 2; i < sentences.length; i++) {
    if (i >= 0 && !processedIndexes.has(i) && sentences[i].length > 50) {
      mainPoints.push({
        text: sentences[i],
        index: i,
        type: 'conclusion',
        score: 60
      });
      processedIndexes.add(i);
    }
  }
  
  if (mainPoints.length < 5) {
    sentences.forEach((s, i) => {
      if (!processedIndexes.has(i) && s.length > 100 && mainPoints.length < 10) {
        mainPoints.push({
          text: s,
          index: i,
          type: 'additional',
          score: 50
        });
      }
    });
  }
  
  mainPoints.sort((a, b) => a.index - b.index);
  
  const finalBullets = [];
  let currentBullet = "";
  let lastIndex = -1;
  
  for (const point of mainPoints) {
    if (lastIndex >= 0 && point.index === lastIndex + 1 && 
        currentBullet.length + point.text.length < 400) {
      currentBullet += " " + point.text;
    } else {
      if (currentBullet) {
        finalBullets.push(currentBullet.trim());
      }
      currentBullet = point.text;
    }
    lastIndex = point.index;
  }
  
  if (currentBullet) {
    finalBullets.push(currentBullet.trim());
  }
  
  const uniqueBullets = [];
  const seenStarts = new Set();
  
  for (const bullet of finalBullets) {
    const start = bullet.slice(0, 50).toLowerCase();
    if (!seenStarts.has(start)) {
      seenStarts.add(start);
      uniqueBullets.push(bullet);
    }
  }
  
  return uniqueBullets.length > 0 ? uniqueBullets : 
         [`(Tìm thấy ${sentences.length} câu, ${fullText.length} ký tự nhưng không thể tóm tắt)`];
}

// AI Summary Functions
async function generateAISummary(content, language = 'vi') {
  if (!content || content.length < 100) {
    throw new Error('Nội dung quá ngắn để tóm tắt');
  }

  const maxLength = 4000;
  const truncatedContent = content.length > maxLength 
    ? content.substring(0, maxLength) + '...' 
    : content;

  const aiMethods = [
    async () => {
      if (!process.env.OPENAI_API_KEY) return null;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: `Hãy tóm tắt nội dung sau thành 3-5 điểm chính bằng tiếng Việt, mỗi điểm khoảng 1-2 câu:\n\n${truncatedContent}`
          }],
          max_tokens: 500,
          temperature: 0.3
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim();
      }
      return null;
    },

    async () => {
      if (!process.env.COHERE_API_KEY) return null;
      const response = await fetch('https://api.cohere.ai/v1/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.COHERE_API_KEY}`
        },
        body: JSON.stringify({
          text: truncatedContent,
          length: 'medium',
          format: 'bullets',
          model: 'summarize-xlarge',
          additional_command: 'Summarize in Vietnamese language'
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        const data = await response.json();
        return data.summary;
      }
      return null;
    },

    async () => {
      if (!process.env.HUGGINGFACE_API_KEY) return null;
      const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
        },
        body: JSON.stringify({
          inputs: truncatedContent,
          parameters: {
            max_length: 200,
            min_length: 50,
            do_sample: false
          }
        }),
        signal: AbortSignal.timeout(20000)
      });

      if (response.ok) {
        const data = await response.json();
        const summary = data[0]?.summary_text || data.summary_text;
        if (summary) {
          const translated = await translateText(summary, 'vi');
          return translated;
        }
      }
      return null;
    },

    async () => {
      return generateLocalAISummary(truncatedContent);
    }
  ];

  for (const method of aiMethods) {
    try {
      const result = await method();
      if (result && result.trim().length > 50) {
        return result.trim();
      }
    } catch (error) {
      console.log(`AI summary method failed: ${error.message}`);
      continue;
    }
  }

  throw new Error('Không thể tạo AI summary');
}

function generateLocalAISummary(content) {
  const sentences = splitSentencesNoLookbehind(content);
  if (sentences.length < 3) return content;

  const scored = sentences.map((sentence, index) => {
    let score = 0;
    
    if (index === 0) score += 10;
    if (index === sentences.length - 1) score += 5;
    if (index < sentences.length * 0.3) score += 3;
    
    const length = sentence.length;
    if (length > 50 && length < 200) score += 5;
    if (length > 200) score -= 2;
    
    const importantKeywords = [
      /\d+[\s]*(%|phần trăm|tỷ|triệu|nghìn|USD|VND|đồng)/gi,
      /(quan trọng|chủ yếu|chính là|đáng chú ý|nổi bật)/gi,
      /(kết luận|tóm lại|như vậy|do đó|vì thế)/gi,
      /(đầu tiên|thứ hai|thứ ba|cuối cùng)/gi,
      /(theo|ông|bà|PGS|TS|BS|chuyên gia)/gi
    ];
    
    importantKeywords.forEach(regex => {
      const matches = sentence.match(regex);
      if (matches) score += matches.length * 3;
    });
    
    if (sentence.toLowerCase().includes('xem thêm') || 
        sentence.toLowerCase().includes('đọc thêm') ||
        sentence.toLowerCase().includes('tin liên quan')) {
      score -= 10;
    }
    
    return { sentence, score, index };
  }).sort((a, b) => b.score - a.score);

  const selected = scored
    .slice(0, Math.min(5, Math.max(3, Math.floor(sentences.length * 0.3))))
    .sort((a, b) => a.index - b.index)
    .map(item => item.sentence);

  return '• ' + selected.join('\n• ');
}

// API Endpoints
app.get("/api/summary", async (req,res) => {
  const raw = String(req.query.url || "").trim();
  const fallbackSummary = req.query.fallback || "";
  
  try {
    if (!raw) return res.status(400).json({ error: "Missing url" });
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol)) return res.status(400).json({ error: "Only http/https allowed" });
    const cached = cacheGet(raw); if (cached) return res.json({ cached:true, ...cached });

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
      "Referer": "https://www.google.com/",
      "X-Forwarded-For": "66.249.66.1",
      "Cookie": ""
    };

    const resp = await fetch(raw, { 
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(10000)
    });
    
    if (!resp.ok) {
      console.log(`Direct fetch failed, trying Google Cache...`);
      const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(raw)}`;
      const cacheResp = await fetch(cacheUrl, { headers });
      
      if (cacheResp.ok) {
        const html = await cacheResp.text();
        const $ = cheerio.load(html);
        
        $("#google-cache-hdr").remove();
        
        let title = ($("meta[property='og:title']").attr("content") || $("title").text() || "").trim();
        const site = (new URL(raw)).hostname;
        const mainText = extractMainContent($);
        
        const isInternational = site.includes('wsj.com') || site.includes('ft.com') || 
                               site.includes('bloomberg.com') || site.includes('economist.com') || 
                               site.includes('reuters.com') || site.includes('cnbc.com') || 
                               site.includes('marketwatch.com');
        
        if (isInternational && detectLanguage(title) !== 'vi') {
          title = await translateText(title);
        }
        
        const bullets = mainText.length > 100 ? 
          await summarizeToBulletsWithTranslation(mainText, isInternational ? 'internationaleconomics' : 'vietnam') : 
          [fallbackSummary || "(Không có nội dung)"];
        
        const originalLength = mainText.length || 0;
        const summaryLength = bullets.join(" ").length;
        const percentage = originalLength > 0 ? Math.round((summaryLength / originalLength) * 100) : 100;
        
        const data = { 
          url: raw, 
          title, 
          site, 
          bullets, 
          percentage, 
          originalLength, 
          summaryLength,
          source: "Google Cache",
          translated: isInternational
        };
        cacheSet(raw, data);
        return res.json(data);
      }
    }
    
    const html = await resp.text();
    const $ = cheerio.load(html);
    
    const hasJsContent = html.includes("__NEXT_DATA__") || 
                        html.includes("window.__INITIAL_STATE__") ||
                        html.includes("ReactDOM.render");
    
    if (hasJsContent) {
      console.log("Detected JS-rendered content, extracting from script tags...");
      
      $("script[id='__NEXT_DATA__']").each((_, script) => {
        try {
          const data = JSON.parse($(script).html());
          const article = data?.props?.pageProps?.article || 
                         data?.props?.pageProps?.post ||
                         data?.props?.pageProps?.data;
          
          if (article?.content) {
            $("body").append(`<div class="extracted-content">${article.content}</div>`);
          }
        } catch (e) {}
      });
      
      $("script").each((_, script) => {
        const text = $(script).html() || "";
        const matches = text.match(/"content"\s*:\s*"([^"]+)"/g) || 
                       text.match(/"body"\s*:\s*"([^"]+)"/g) ||
                       text.match(/"text"\s*:\s*"([^"]+)"/g);
        
        if (matches && matches.length > 0) {
          const content = matches.join(" ").replace(/\\n/g, " ").replace(/\\"/g, '"');
          $("body").append(`<div class="extracted-json-content">${content}</div>`);
        }
      });
    }
    
    let title = ($("meta[property='og:title']").attr("content") || $("title").text() || "").trim();
    const site = $("meta[property='og:site_name']").attr("content") || (new URL(raw)).hostname;
    const mainText = extractMainContent($);
    
    const isInternational = site.includes('wsj.com') || site.includes('ft.com') || 
                           site.includes('bloomberg.com') || site.includes('economist.com') || 
                           site.includes('reuters.com') || site.includes('cnbc.com') || 
                           site.includes('marketwatch.com');
    
    if (isInternational && detectLanguage(title) !== 'vi') {
      title = await translateText(title);
    }
    
    let bullets;
    if (!mainText || mainText.length < 100) {
      const metaDesc = $("meta[property='og:description']").attr("content") || 
                       $("meta[name='description']").attr("content") || "";
      const contentToUse = metaDesc || fallbackSummary || "";
      
      if (contentToUse) {
        if (isInternational && detectLanguage(contentToUse) !== 'vi') {
          bullets = [await translateText(contentToUse)];
        } else {
          bullets = [contentToUse];
        }
      } else {
        bullets = ["(Trang có thể yêu cầu đăng nhập hoặc có paywall. Vui lòng xem bài gốc)"];
      }
    } else {
      bullets = await summarizeToBulletsWithTranslation(mainText, isInternational ? 'internationaleconomics' : 'vietnam');
    }
    
    const originalLength = mainText.length || (fallbackSummary ? fallbackSummary.length : 0);
    const summaryLength = bullets.join(" ").length;
    const percentage = originalLength > 0 ? Math.round((summaryLength / originalLength) * 100) : 100;
    
    const data = { 
      url: raw, 
      title, 
      site, 
      bullets, 
      percentage, 
      originalLength, 
      summaryLength,
      translated: isInternational
    };
    cacheSet(raw, data);
    res.json(data);
  } catch (e) {
    console.error(`Error summarizing ${raw}:`, e.message);
    
    if (fallbackSummary) {
      return res.json({
        url: raw,
        title: "Không thể tải trang",
        site: (new URL(raw)).hostname,
        bullets: [fallbackSummary],
        percentage: 100,
        error: e.message
      });
    }
    
    res.status(500).json({ error: e.message || "Summary error" });
  }
});

app.get("/api/ai-summary", async (req, res) => {
  const raw = String(req.query.url || "").trim();
  
  try {
    if (!raw) return res.status(400).json({ error: "Missing url parameter" });
    
    const url = new URL(raw);
    if (!/^https?:$/.test(url.protocol)) {
      return res.status(400).json({ error: "Only http/https URLs allowed" });
    }

    const cached = aiSummaryCacheGet(raw);
    if (cached) {
      return res.json({ cached: true, ...cached });
    }

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
    };

    const response = await fetch(raw, { 
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const content = extractMainContent($);
    if (!content || content.length < 100) {
      throw new Error('Không thể trích xuất nội dung từ trang này');
    }

    const isEnglish = detectLanguage(content) === 'en';
    let processedContent = content;
    
    if (isEnglish) {
      console.log('Detected English content, translating...');
      processedContent = await translatePageContent(content);
    }

    const aiSummary = await generateAISummary(processedContent);
    
    const title = ($("meta[property='og:title']").attr("content") || $("title").text() || "").trim();
    const site = $("meta[property='og:site_name']").attr("content") || url.hostname;

    const result = {
      url: raw,
      title: isEnglish && title ? await translateText(title) : title,
      site,
      aiSummary,
      originalLength: content.length,
      summaryLength: aiSummary.length,
      translated: isEnglish,
      method: 'ai'
    };

    aiSummaryCacheSet(raw, result);
    
    res.json(result);
    
  } catch (error) {
    console.error(`AI Summary error for ${raw}:`, error.message);
    res.status(500).json({ 
      error: error.message || "AI Summary generation failed",
      fallback: true
    });
  }
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`News aggregator running at http://localhost:${PORT}`));