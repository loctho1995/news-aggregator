// server/services/aggregator/rss-fetcher.js
// FIXED VERSION - Longer content for cards

import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { cleanText, toISO, toArray, deriveCategoriesFromURL } from "./utils.js";
import { createBulletPointSummary, extractFullContent } from "./content-extractor/index.js";
import { isVietnamese, translateToVietnamese } from "./translator.js";

// Check if running locally
const isLocal = process.env.NODE_ENV !== 'production' || 
                process.env.LOCAL_DEV === 'true' ||
                !process.env.PORT;

// Parser configuration
const parser = new Parser({ 
  timeout: isLocal ? 10000 : 15000,
  headers: { 
    "User-Agent": isLocal ? 
      "VN News Aggregator/1.0" :
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*"
  }
});

export async function fetchRSSWithFullContent(source, signal = null) {
  console.log(`Fetching RSS from ${source.name}...`);
  
  try {
    let feed = null;
    
    // LOCAL: Direct fetch only
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

    const englishGroups = ['internationaleconomics', 'internationaltech', 'startuptech', 'developernews', 'gamenews', 'designuiux'];
    const isInternational = englishGroups.includes(source.group);
    const maxItems = isLocal ? 10 : 8;
    
    // Process items
    for (let i = 0; i < Math.min(feed.items.length, maxItems); i++) {
      const it = feed.items[i];
      
      try {
        if (signal && signal.aborted) {
          console.log(`Aborted processing for ${source.name}`);
          break;
        }
        
        let title = cleanText(it.title, 280);
        
        // Try to get more content
        let fullContent = "";
        
        // Get RSS content first
        let rssContent = "";
        
        // Try multiple content fields for better coverage
        if (it.contentEncoded) {
          rssContent = it.contentEncoded;
        } else if (it['content:encoded']) {
          rssContent = it['content:encoded'];
        } else if (it.content) {
          rssContent = it.content;
        } else if (it.contentSnippet) {
          rssContent = it.contentSnippet;
        } else if (it.summary) {
          rssContent = it.summary;
        } else if (it.description) {
          rssContent = it.description;
        }
        
        // Clean HTML if present
        if (rssContent && rssContent.includes('<')) {
          const $ = cheerio.load(rssContent);
          // Remove images and scripts
          $('img, script, style').remove();
          // Get text content
          rssContent = $.text();
        }
        
        // LOCAL: Try to fetch full content for better summary
        if (isLocal && i < 5) {
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
            // Use RSS content if fetch fails
            console.log(`Could not fetch full content for ${it.link}`);
          }
        }
        
        // Use the longest content available
        let finalContent = fullContent || rssContent || "";
        
        // IMPORTANT: Increase content length limits
        finalContent = cleanText(finalContent, 1500); // Increased from 600 to 1500
        
        // Ensure we have meaningful content
        if (finalContent.length < 100 && it.title) {
          // If content too short, add title as content
          finalContent = it.title + ". " + finalContent;
        }
        
        // Translation for international sources
        if (isInternational && title && !isVietnamese(title)) {
          if (isLocal) {
            try {
              title = await translateToVietnamese(title) || `[EN] ${title}`;
            } catch (e) {
              title = `[EN] ${title}`;
            }
          } else {
            title = `[EN] ${title}`;
          }
        }
        
        // Create bullet summary with MORE content
        const bulletSummary = createBulletPointSummary(
          finalContent, 
          3,  // Keep 3 bullets
          800 // INCREASED from 400 to 800 characters total
        );
        
        // If bullets are too short, create from full content
        if (bulletSummary.text.length < 200 && finalContent.length > 200) {
          // Take first 500 chars as single summary
          bulletSummary.text = finalContent.substring(0, 500) + "...";
          bulletSummary.bullets = [
            `• ${finalContent.substring(0, 250)}...`,
            `• ${finalContent.substring(250, 450)}...`
          ].filter(b => b.length > 10);
        }
        
        const cats = toArray(it.categories || it.category).map(c => String(c).trim()).filter(Boolean);
        const derived = cats.length ? cats : deriveCategoriesFromURL(it.link || "");
        
        items.push({
          sourceId: source.id,
          sourceName: source.name,
          title: title,
          link: it.link,
          summary: bulletSummary.text || finalContent.substring(0, 500), // Fallback summary
          bullets: bulletSummary.bullets.length > 0 ? bulletSummary.bullets : [`• ${finalContent.substring(0, 400)}...`],
          fullContent: fullContent || finalContent, // Store full content
          publishedAt: toISO(it.isoDate || it.pubDate),
          image: it.enclosure?.url || it.image?.url || null,
          categories: derived,
          translated: false
        });
        
      } catch (itemError) {
        console.error(`Error processing item from ${source.name}: ${itemError.message}`);
      }
    }
    
    console.log(`✓ ${source.name}: Processed ${items.length} items`);
    return items;
    
  } catch (error) {
    console.error(`✗ RSS fetch failed for ${source.name}: ${error.message}`);
    return [];
  }
}