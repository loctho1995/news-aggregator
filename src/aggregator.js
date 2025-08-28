import Parser from "rss-parser";
import * as cheerio from "cheerio";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import tz from "dayjs/plugin/timezone.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import { SOURCES } from "./sources.js";

dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(relativeTime);

const parser = new Parser({ timeout: 10000, headers: { "User-Agent": "VN News Aggregator/1.0 (+https://example.com)" } });
const DEFAULT_TZ = "Asia/Bangkok";

const toArray = (v) => Array.isArray(v) ? v : (v ? [v] : []);

function cleanText(htmlOrText, maxLen = 240) {
  if (!htmlOrText) return "";
  const text = String(htmlOrText).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}

function toISO(dateLike) {
  if (!dateLike) return null;
  const d = dayjs(dateLike);
  return d.isValid() ? d.toISOString() : null;
}

function deriveCategoriesFromURL(href) {
  try {
    const u = new URL(href);
    const segs = u.pathname.split("/").filter(Boolean);
    const cat = segs.filter(s => !/^\d/.test(s)).slice(0, 2).map(s => s.replace(/[-_]/g, " "));
    return cat;
  } catch { return []; }
}

// Hàm extract content giống như trong server.js
function extractFullContent($) {
  // Xóa các thành phần không cần thiết
  $("script,style,noscript,iframe,.advertisement,.ads,.banner,.sidebar,.widget,.social-share,.related-news,.comment").remove();
  
  // Meta tags và structured data
  const ogDescription = $("meta[property='og:description']").attr("content") || "";
  const metaDescription = $("meta[name='description']").attr("content") || "";
  const articleLead = $(".sapo, .lead, .description, .chapeau, .article-summary").text().trim();
  
  // Selectors theo từng báo
  const selectors = {
    vnexpress: [".fck_detail", ".article-content", ".content-detail"],
    tuoitre: [".content-detail", ".detail-content", ".detail__content"],
    dantri: [".singular-content", ".detail-content", ".e-magazine__body"],
    thanhnien: [".detail-content", ".content", ".article-body"],
    cafe: [".newscontent", ".detail-content", ".content-detail"],
    vietnamnet: [".ArticleContent", ".article-content", ".content__body"],
    generic: [
      "article", "[itemprop='articleBody']", ".article-body",
      ".entry-content", ".post-content", ".news-content",
      ".main-content", ".story-body", ".text-content"
    ]
  };
  
  let bestContent = "";
  let maxScore = 0;
  
  // Tìm content tốt nhất
  Object.values(selectors).flat().forEach(sel => {
    try {
      $(sel).each((_, el) => {
        const $el = $(el);
        const text = $el.text().trim();
        const paragraphs = $el.find("p").length;
        const links = $el.find("a").length;
        const images = $el.find("img").length;
        
        const score = text.length + (paragraphs * 50) - (links * 10) + (images * 20);
        
        if (score > maxScore && text.length > 200) {
          maxScore = score;
          bestContent = text;
        }
      });
    } catch (e) {}
  });
  
  // Fallback: thu thập từ paragraphs
  if (!bestContent || bestContent.length < 300) {
    const contentParts = [];
    
    if (articleLead && articleLead.length > 50) {
      contentParts.push(articleLead);
    }
    
    $("p").each((_, p) => {
      const text = $(p).text().trim();
      if (text.length > 80 && 
          !text.includes("Xem thêm") && 
          !text.includes("Đọc thêm") &&
          !text.includes("TIN LIÊN QUAN")) {
        contentParts.push(text);
      }
    });
    
    bestContent = contentParts.join(" ");
  }
  
  // Fallback với meta
  if (!bestContent || bestContent.length < 100) {
    bestContent = [ogDescription, metaDescription, articleLead].filter(Boolean).join(" ");
  }
  
  // Làm sạch
  bestContent = bestContent
    .replace(/\s+/g, " ")
    .replace(/Chia sẻ bài viết.*/gi, "")
    .replace(/Xem thêm:.*/gi, "")
    .replace(/TIN LIÊN QUAN.*/gi, "")
    .trim();
  
  return bestContent;
}

// Tóm tắt nội dung
function summarizeContent(text, maxBullets = 3) {
  if (!text || text.length < 100) return text || "";
  
  const sentences = text.match(/[^.!?…]+(?:[.!?…]+|$)/g) || [];
  const bullets = [];
  let buf = "";
  
  for (const s of sentences.slice(0, maxBullets * 3)) { // Giới hạn để tóm tắt ngắn
    const cleaned = s.trim();
    if (cleaned.length < 30) continue;
    
    const next = (buf ? buf + " " : "") + cleaned;
    if (next.length < 200) {
      buf = next;
    } else {
      if (buf) bullets.push(buf);
      buf = cleaned;
      if (bullets.length >= maxBullets) break;
    }
  }
  
  if (buf && bullets.length < maxBullets) bullets.push(buf);
  
  return bullets.join(". ").slice(0, 280);
}

// FETCH RSS VÀ LẤY FULL CONTENT
async function fetchRSSWithFullContent(source) {
  console.log(`Fetching RSS from ${source.name}...`);
  const feed = await parser.parseURL(source.url);
  const items = [];
  
  // Giới hạn số bài để tránh quá tải
  const maxItems = 10; 
  const promises = feed.items.slice(0, maxItems).map(async (it) => {
    try {
      // Fetch full content từ link
      const response = await fetch(it.link, {
        headers: { "User-Agent": "VN News Aggregator/1.0" },
        timeout: 5000
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract full content
      const fullContent = extractFullContent($);
      
      // Tóm tắt
      const summary = summarizeContent(fullContent);
      
      const cats = toArray(it.categories || it.category).map(c => String(c).trim()).filter(Boolean);
      const derived = cats.length ? cats : deriveCategoriesFromURL(it.link || "");
      
      return {
        sourceId: source.id,
        sourceName: source.name,
        title: cleanText(it.title, 280),
        link: it.link,
        summary: summary || cleanText(it.contentSnippet || it.content, 280),
        fullContent: fullContent, // Lưu full content để có thể tóm tắt lại sau
        publishedAt: toISO(it.isoDate || it.pubDate),
        image: it.enclosure?.url || $("meta[property='og:image']").attr("content") || null,
        categories: derived
      };
    } catch (e) {
      console.error(`Error fetching ${it.link}: ${e.message}`);
      // Fallback về RSS content nếu không fetch được
      return {
        sourceId: source.id,
        sourceName: source.name,
        title: cleanText(it.title, 280),
        link: it.link,
        summary: cleanText(it.contentSnippet || it.content || it.summary, 280),
        publishedAt: toISO(it.isoDate || it.pubDate),
        image: it.enclosure?.url || null,
        categories: toArray(it.categories || it.category).map(c => String(c).trim()).filter(Boolean)
      };
    }
  });
  
  const results = await Promise.allSettled(promises);
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value) {
      items.push(r.value);
    }
  });
  
  return items;
}

// FETCH HTML VÀ LẤY FULL CONTENT
async function fetchHTMLWithFullContent(source) {
  console.log(`Fetching HTML from ${source.name}...`);
  const res = await fetch(source.url, { headers: { "User-Agent": "VN News Aggregator/1.0" } });
  const html = await res.text();
  const $ = cheerio.load(html);
  const items = [];
  const host = (new URL(source.url)).hostname;
  
  // Tìm các link bài viết
  const containers = $("article a, .article a, .post a, .news-item a, .story a, h3 a, h2 a");
  const links = new Set();
  
  containers.each((_, el) => {
    const href = $(el).attr("href");
    if (href && /^https?:\/\//.test(href) && href.includes(host)) {
      links.add(href);
    }
  });
  
  // Giới hạn số link
  const maxLinks = 10;
  const promises = Array.from(links).slice(0, maxLinks).map(async (link) => {
    try {
      const response = await fetch(link, {
        headers: { "User-Agent": "VN News Aggregator/1.0" },
        timeout: 5000
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const articleHtml = await response.text();
      const $article = cheerio.load(articleHtml);
      
      // Extract metadata và content
      const title = $article("meta[property='og:title']").attr("content") || 
                   $article("title").text() || 
                   $article("h1").first().text();
      
      const fullContent = extractFullContent($article);
      const summary = summarizeContent(fullContent);
      
      const image = $article("meta[property='og:image']").attr("content") || 
                   $article("img").first().attr("src");
      
      const publishedTime = $article("meta[property='article:published_time']").attr("content") ||
                           $article("time").attr("datetime");
      
      return {
        sourceId: source.id,
        sourceName: source.name,
        title: cleanText(title, 280),
        link: link,
        summary: summary,
        fullContent: fullContent,
        publishedAt: toISO(publishedTime),
        image: image,
        categories: deriveCategoriesFromURL(link)
      };
    } catch (e) {
      console.error(`Error fetching ${link}: ${e.message}`);
      return null;
    }
  });
  
  const results = await Promise.allSettled(promises);
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value) {
      items.push(r.value);
    }
  });
  
  return items;
}

// Main fetch function
async function fetchFromSource(sourceId) {
  const source = SOURCES[sourceId];
  if (!source) throw new Error("Unknown source: " + sourceId);
  
  try {
    if (source.type === "rss") {
      return await fetchRSSWithFullContent(source);
    } else if (source.type === "html") {
      return await fetchHTMLWithFullContent(source);
    }
  } catch (e) {
    console.error(`Error with source ${sourceId}: ${e.message}`);
    return [];
  }
}

// Streaming version: gửi từng item khi có
export async function fetchAllStreaming({ include = [], hours = 24, limitPerSource = 30, group = null, onItem } = {}) {
  // Filter sources by group if specified
  let ids;
  if (include.length) {
    ids = include;
  } else if (group) {
    ids = Object.keys(SOURCES).filter(id => SOURCES[id].group === group);
  } else {
    ids = Object.keys(SOURCES);
  }
  
  const since = dayjs().tz(DEFAULT_TZ).subtract(hours, "hour");
  const seen = new Set();
  
  // Process sources in parallel but emit items as soon as available
  const promises = ids.map(async (id) => {
    try {
      console.log(`Fetching from ${id}...`);
      const items = await fetchFromSource(id);
      
      // Process and emit each item immediately
      for (const item of items) {
        // Check time filter
        if (item.publishedAt) {
          const t = dayjs(item.publishedAt);
          if (t.isValid() && !t.isAfter(since)) continue;
        }
        
        // Check duplicate
        if (seen.has(item.link)) continue;
        seen.add(item.link);
        
        // Add group info
        item.group = SOURCES[id].group || 'vietnam';
        item.categories = (item.categories || []).map(x => String(x).trim()).filter(Boolean);
        
        // Emit item immediately
        if (onItem) {
          onItem(item);
        }
      }
    } catch (e) {
      console.error(`Source ${id} failed: ${e.message}`);
      // Send error item but don't stop
      if (onItem) {
        onItem({ 
          error: true, 
          sourceId: id, 
          message: e.message,
          group: SOURCES[id]?.group || 'vietnam'
        });
      }
    }
  });
  
  // Wait for all to complete
  await Promise.allSettled(promises);
}

// Original batch version
export async function fetchAll({ include = [], hours = 24, limitPerSource = 30, group = null } = {}) {
  // Filter sources by group if specified
  let ids;
  if (include.length) {
    ids = include;
  } else if (group) {
    // Get only sources from specified group
    ids = Object.keys(SOURCES).filter(id => SOURCES[id].group === group);
  } else {
    ids = Object.keys(SOURCES);
  }
  
  const since = dayjs().tz(DEFAULT_TZ).subtract(hours, "hour");
  
  // Fetch song song nhưng giới hạn concurrent
  const batchSize = 3; // Xử lý 3 nguồn cùng lúc
  const results = [];
  
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchPromises = batch.map(async (id) => {
      try {
        const items = await fetchFromSource(id);
        const filtered = items
          .filter((it) => {
            if (!it.publishedAt) return true;
            const t = dayjs(it.publishedAt);
            return t.isValid() ? t.isAfter(since) : true;
          })
          .slice(0, limitPerSource);
        
        // Add group info to each item
        filtered.forEach(item => {
          item.group = SOURCES[id].group || 'vietnam';
        });
        
        return filtered;
      } catch (e) {
        console.error(`Source ${id} failed: ${e.message}`);
        return [];
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.flat());
  }
  
  // Deduplicate
  const seen = new Set();
  const deduped = [];
  for (const it of results) {
    if (!it.link || seen.has(it.link)) continue;
    seen.add(it.link);
    it.categories = (it.categories || []).map(x => String(x).trim()).filter(Boolean);
    deduped.push(it);
  }
  
  // Sort by date
  deduped.sort((a, b) => {
    const ta = a.publishedAt ? +new Date(a.publishedAt) : 0;
    const tb = b.publishedAt ? +new Date(b.publishedAt) : 0;
    return tb - ta;
  });
  
  return deduped;
}

export function listSources() {
  return Object.values(SOURCES).map(({ id, name, homepage, url, type, group }) => ({ 
    id, name, homepage, url, type, group: group || 'vietnam'
  }));
}