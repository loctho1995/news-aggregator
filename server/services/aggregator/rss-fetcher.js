// server/services/aggregator/rss-fetcher.js
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { cleanText, toISO, toArray, deriveCategoriesFromURL } from "./utils.js";
import { extractFullContent } from "./content-extractor.js";
import { isVietnamese, translateToVietnamese } from "./translator.js";

const parser = new Parser({ 
  timeout: 10000, 
  headers: { "User-Agent": "VN News Aggregator/1.0 (+https://example.com)" } 
});

// Hàm tạo bullet points từ text
function createBulletPoints(text, maxLength = 500) {
  if (!text || text.length < 50) return text || "";
  
  // Tách câu
  const sentences = text.match(/[^.!?]+[.!?]+/g) || 
                   text.split(/[;,]/).filter(s => s.length > 30) ||
                   [text];
  
  const bullets = [];
  let totalLength = 0;
  const maxBullets = 3;
  
  for (let i = 0; i < sentences.length && bullets.length < maxBullets; i++) {
    const sent = sentences[i].trim();
    
    // Bỏ qua câu quá ngắn hoặc không có nghĩa
    if (sent.length < 30) continue;
    if (/^(Xem thêm|Đọc thêm|Chia sẻ|Bình luận|TIN LIÊN QUAN)/i.test(sent)) continue;
    
    // Giới hạn độ dài mỗi bullet
    let bulletText = sent;
    if (sent.length > 150) {
      bulletText = sent.substring(0, 147) + '...';
    }
    
    // Kiểm tra tổng độ dài
    if (totalLength + bulletText.length > maxLength) {
      // Nếu đã có ít nhất 2 bullets thì dừng
      if (bullets.length >= 2) break;
      
      // Nếu chưa, cắt bullet này cho vừa
      const remaining = maxLength - totalLength - 10;
      if (remaining > 50) {
        bulletText = sent.substring(0, remaining) + '...';
        bullets.push(bulletText);
      }
      break;
    }
    
    bullets.push(bulletText);
    totalLength += bulletText.length + 3; // +3 cho " • "
  }
  
  // Nếu không có bullet nào, lấy đoạn đầu
  if (bullets.length === 0 && text) {
    const firstChunk = text.substring(0, Math.min(150, text.length));
    bullets.push(firstChunk + (text.length > 150 ? '...' : ''));
  }
  
  // Join với bullet separator
  return bullets.join('<br>• ');
}

export async function fetchRSSWithFullContent(source) {
  console.log(`Fetching RSS from ${source.name}...`);
  const feed = await parser.parseURL(source.url);
  const items = [];
  
  const isInternational = source.group === 'internationaleconomics';
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
      
      // Translate title if international
      let title = cleanText(it.title, 280);
      if (isInternational && title && !isVietnamese(title)) {
        title = await translateToVietnamese(title) || title;
      }
      
      // Tạo summary với bullet points
      let cardSummary = createBulletPoints(
        fullContent || it.contentSnippet || it.content || "",
        500
      );
      
      // Dịch summary nếu cần
      if (isInternational && cardSummary && !isVietnamese(cardSummary)) {
        cardSummary = await translateToVietnamese(cardSummary) || cardSummary;
      }
      
      const cats = toArray(it.categories || it.category).map(c => String(c).trim()).filter(Boolean);
      const derived = cats.length ? cats : deriveCategoriesFromURL(it.link || "");
      
      return {
        sourceId: source.id,
        sourceName: source.name,
        title: title,
        link: it.link,
        summary: cardSummary, // Summary với bullet points
        fullContent: fullContent,
        publishedAt: toISO(it.isoDate || it.pubDate),
        image: it.enclosure?.url || $("meta[property='og:image']").attr("content") || null,
        categories: derived,
        translated: isInternational
      };
    } catch (e) {
      console.error(`Error fetching ${it.link}: ${e.message}`);
      
      // Fallback với RSS content
      let title = cleanText(it.title, 280);
      let summary = createBulletPoints(
        it.contentSnippet || it.content || it.summary || "",
        500
      );
      
      if (isInternational) {
        if (title && !isVietnamese(title)) {
          title = await translateToVietnamese(title) || title;
        }
        if (summary && !isVietnamese(summary)) {
          summary = await translateToVietnamese(summary) || summary;
        }
      }
      
      return {
        sourceId: source.id,
        sourceName: source.name,
        title: title,
        link: it.link,
        summary: summary,
        publishedAt: toISO(it.isoDate || it.pubDate),
        image: it.enclosure?.url || null,
        categories: toArray(it.categories || it.category).map(c => String(c).trim()).filter(Boolean),
        translated: isInternational
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