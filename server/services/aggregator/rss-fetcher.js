// server/services/aggregator/rss-fetcher.js
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { cleanText, toISO, toArray, deriveCategoriesFromURL } from "./utils.js";
import { extractFullContent, createBulletPointSummary } from "./content-extractor.js";
import { isVietnamese, translateToVietnamese } from "./translator.js";

const parser = new Parser({ 
  timeout: 10000, 
  headers: { "User-Agent": "VN News Aggregator/1.0 (+https://example.com)" } 
});

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
      
      // Tạo bullet point summary cho card (3-4 bullets)
      let bulletSummary = createBulletPointSummary(
        fullContent || it.contentSnippet || it.content || "", 
        3 // Số bullets cho card
      );
      
      // Dịch summary nếu cần
      if (isInternational && bulletSummary && bulletSummary.bullets) {
        const translatedBullets = [];
        for (const bullet of bulletSummary.bullets) {
          if (!isVietnamese(bullet)) {
            const translated = await translateToVietnamese(bullet);
            translatedBullets.push(translated || bullet);
          } else {
            translatedBullets.push(bullet);
          }
        }
        bulletSummary.bullets = translatedBullets;
      }
      
      const cats = toArray(it.categories || it.category).map(c => String(c).trim()).filter(Boolean);
      const derived = cats.length ? cats : deriveCategoriesFromURL(it.link || "");
      
      return {
        sourceId: source.id,
        sourceName: source.name,
        title: title,
        link: it.link,
        summary: bulletSummary.text, // Text version for backward compatibility
        bullets: bulletSummary.bullets, // Array of bullet points
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
      let bulletSummary = createBulletPointSummary(
        it.contentSnippet || it.content || it.summary || "", 
        3
      );
      
      if (isInternational) {
        if (title && !isVietnamese(title)) {
          title = await translateToVietnamese(title) || title;
        }
        if (bulletSummary && bulletSummary.bullets) {
          const translatedBullets = [];
          for (const bullet of bulletSummary.bullets) {
            if (!isVietnamese(bullet)) {
              const translated = await translateToVietnamese(bullet);
              translatedBullets.push(translated || bullet);
            } else {
              translatedBullets.push(bullet);
            }
          }
          bulletSummary.bullets = translatedBullets;
        }
      }
      
      return {
        sourceId: source.id,
        sourceName: source.name,
        title: title,
        link: it.link,
        summary: bulletSummary.text,
        bullets: bulletSummary.bullets,
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