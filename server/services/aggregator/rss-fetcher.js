// server/services/aggregator/rss-fetcher.js
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { cleanText, toISO, toArray, createCardSummary, deriveCategoriesFromURL } from "./utils.js";
import { extractFullContent, createSmartSummary } from "./content-extractor.js";
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
      
      // Tạo smart summary cho card (200-250 ký tự)
      let cardSummary = createCardSummary(fullContent || it.contentSnippet || it.content || "", 250);
      
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
        summary: cardSummary, // Smart summary cho card
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
      let summary = createCardSummary(
        it.contentSnippet || it.content || it.summary || "", 
        250
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