// server/services/aggregator/rss-fetcher.js
// VERSION HOẠT ĐỘNG CHO CẢ LOCAL & SERVER

import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { cleanText, toISO, toArray, deriveCategoriesFromURL } from "./utils.js";
import { createBulletPointSummary } from "./content-extractor/index.js";
import { isVietnamese, translateToVietnamese } from "./translator.js";

// Check if running locally
const isLocal = process.env.NODE_ENV !== 'production' || 
                process.env.LOCAL_DEV === 'true' ||
                !process.env.PORT;

// Parser configuration based on environment
const parser = new Parser({ 
  timeout: isLocal ? 10000 : 15000, // Shorter timeout for local
  headers: { 
    "User-Agent": isLocal ? 
      "VN News Aggregator/1.0" : // Simple UA for local
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*"
  }
});

export async function fetchRSSWithFullContent(source, signal = null) {
  console.log(`Fetching RSS from ${source.name}...`);
  
  try {
    let feed = null;
    
    // LOCAL: Direct fetch only (no proxy)
    if (isLocal) {
      try {
        feed = await parser.parseURL(source.url);
      } catch (error) {
        console.error(`Failed to fetch ${source.name}: ${error.message}`);
        return [];
      }
    } 
    // SERVER: Try direct first, then proxy
    else {
      try {
        feed = await parser.parseURL(source.url);
      } catch (firstError) {
        console.log(`Direct fetch failed for ${source.name}, trying with proxy...`);
        
        try {
          // Try with proxy only on server
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(source.url)}`;
          feed = await parser.parseURL(proxyUrl);
        } catch (proxyError) {
          console.error(`Both direct and proxy failed for ${source.name}`);
          return [];
        }
      }
    }
    
    if (!feed || !feed.items || feed.items.length === 0) {
      console.log(`No items found for ${source.name}`);
      return [];
    }
    
    const items = [];
    const isInternational = source.group === 'internationaleconomics';
    const maxItems = isLocal ? 10 : 8; // More items locally
    
    // Process items
    for (let i = 0; i < Math.min(feed.items.length, maxItems); i++) {
      const it = feed.items[i];
      
      try {
        // Check if aborted
        if (signal && signal.aborted) {
          console.log(`Aborted processing for ${source.name}`);
          break;
        }
        
        let title = cleanText(it.title, 280);
        
        // LOCAL: Try to fetch full content
        let fullContent = "";
        if (isLocal && i < 5) { // Fetch full content for first 5 items locally
          try {
            const response = await fetch(it.link, {
              headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
              },
              signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
              const html = await response.text();
              const $ = cheerio.load(html);
              fullContent = extractFullContent($);
            }
          } catch (e) {
            // Ignore fetch errors, use RSS content
          }
        }
        
        // Use full content if available, otherwise RSS content
        let summary = fullContent || it.contentSnippet || it.content || it.summary || "";
        
        // Clean HTML if present
        if (!fullContent && summary && summary.includes('<')) {
          const $ = cheerio.load(summary);
          summary = $.text();
        }
        
        summary = cleanText(summary, 600);
        
        // Translation handling
        if (isInternational && title && !isVietnamese(title)) {
          if (isLocal) {
            // Try translation locally
            try {
              title = await translateToVietnamese(title) || `[EN] ${title}`;
            } catch (e) {
              title = `[EN] ${title}`;
            }
          } else {
            // Skip translation on server to save time
            title = `[EN] ${title}`;
          }
        }
        
        // Create bullet summary
        const bulletSummary = createBulletPointSummary(summary, 3, 400);
        
        const cats = toArray(it.categories || it.category).map(c => String(c).trim()).filter(Boolean);
        const derived = cats.length ? cats : deriveCategoriesFromURL(it.link || "");
        
        items.push({
          sourceId: source.id,
          sourceName: source.name,
          title: title,
          link: it.link,
          summary: bulletSummary.text,
          bullets: bulletSummary.bullets,
          fullContent: fullContent || summary,
          publishedAt: toISO(it.isoDate || it.pubDate),
          image: it.enclosure?.url || null,
          categories: derived,
          translated: false
        });
        
      } catch (itemError) {
        console.error(`Error processing item from ${source.name}: ${itemError.message}`);
        // Continue with next item
      }
    }
    
    console.log(`✓ ${source.name}: Processed ${items.length} items`);
    return items;
    
  } catch (error) {
    console.error(`✗ RSS fetch failed for ${source.name}: ${error.message}`);
    return [];
  }
}