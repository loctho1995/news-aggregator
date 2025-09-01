// server/services/aggregator/rss-fetcher.js
// FIXED VERSION - Handle WSJ and complex RSS structures

import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { cleanText, toISO, toArray, deriveCategoriesFromURL } from "./utils.js";
import { createBulletPointSummary, extractFullContent } from "./content-extractor/index.js";
import { isVietnamese, translateToVietnamese } from "./translator.js";

// Check if running locally
const isLocal = process.env.NODE_ENV !== 'production' || 
                process.env.LOCAL_DEV === 'true' ||
                !process.env.PORT;

// Parser configuration with custom fields for WSJ
const parser = new Parser({ 
  timeout: isLocal ? 10000 : 15000,
  headers: { 
    "User-Agent": isLocal ? 
      "VN News Aggregator/1.0" :
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*"
  },
  customFields: {
    item: [
      ['media:content', 'media:content', {keepArray: true}],
      ['media:thumbnail', 'media:thumbnail'],
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator'],
      ['category', 'categories', {keepArray: true}]
    ]
  }
});

// Safe string conversion helper
function safeToString(value) {
  if (value === null || value === undefined) return '';
  
  // If it's already a string, return it
  if (typeof value === 'string') return value;
  
  // If it's a number or boolean, convert directly
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  // If it's an array, join with comma
  if (Array.isArray(value)) {
    return value.map(v => safeToString(v)).filter(Boolean).join(', ');
  }
  
  // If it's an object with toString
  if (typeof value === 'object') {
    // Check for common RSS object structures
    if (value.$ && value._) return safeToString(value._);
    if (value.$ && value.$.term) return value.$.term;
    if (value.term) return value.term;
    if (value.label) return value.label;
    if (value.name) return value.name;
    if (value.title) return value.title;
    if (value.value) return safeToString(value.value);
    
    // Try to get text content
    if (value._ !== undefined) return safeToString(value._);
    
    // Last resort - try JSON stringify
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  
  return '';
}

// Safe category extraction
function extractCategories(item) {
  const categories = [];
  
  // Try different category fields
  const possibleCategoryFields = [
    item.categories,
    item.category,
    item.tags,
    item.keywords
  ];
  
  for (const field of possibleCategoryFields) {
    if (!field) continue;
    
    if (Array.isArray(field)) {
      field.forEach(cat => {
        const catStr = safeToString(cat);
        if (catStr && catStr.length > 1 && catStr.length < 100) {
          categories.push(catStr);
        }
      });
    } else if (typeof field === 'string') {
      categories.push(field);
    } else if (typeof field === 'object') {
      const catStr = safeToString(field);
      if (catStr && catStr !== '[Object]' && catStr.length > 1 && catStr.length < 100) {
        categories.push(catStr);
      }
    }
  }
  
  // Remove duplicates and clean
  return [...new Set(categories)]
    .map(c => c.trim())
    .filter(c => c && !c.includes('[Object]') && !c.includes('{"'));
}

// Extract image URL safely
function extractImageUrl(item) {
  // Try different image fields
  if (item.enclosure?.url) return item.enclosure.url;
  if (item.image?.url) return item.image.url;
  if (item['media:thumbnail']?.url) return item['media:thumbnail'].url;
  if (item['media:thumbnail']?.$?.url) return item['media:thumbnail'].$.url;
  
  // Try media:content
  if (item['media:content']) {
    const mediaContent = Array.isArray(item['media:content']) 
      ? item['media:content'][0] 
      : item['media:content'];
    
    if (mediaContent?.$?.url) return mediaContent.$.url;
    if (mediaContent?.url) return mediaContent.url;
  }
  
  return null;
}

export async function fetchRSSWithFullContent(source, signal = null) {
  console.log(`Fetching RSS from ${source.name}...`);
  
  try {
    let feed = null;
    
    // Special handling for WSJ
    const isWSJ = source.id === 'wsj' || source.url.includes('wsj.com') || source.url.includes('dj.com');
    
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
    const isInternational = source.group === 'internationaleconomics' || source.group === 'internationaltech';
    const maxItems = isLocal ? 10 : 8;
    
    // Process items with better error handling
    for (let i = 0; i < Math.min(feed.items.length, maxItems); i++) {
      const it = feed.items[i];
      
      try {
        if (signal && signal.aborted) {
          console.log(`Aborted processing for ${source.name}`);
          break;
        }
        
        // Safe extraction of title
        let title = safeToString(it.title || it.headline || '');
        if (!title) {
          console.log(`Skipping item without title from ${source.name}`);
          continue;
        }
        
        title = cleanText(title, 280);
        
        // Safe extraction of link
        const link = safeToString(it.link || it.url || it.guid || '');
        if (!link) {
          console.log(`Skipping item without link from ${source.name}`);
          continue;
        }
        
        // Try to get more content
        let fullContent = "";
        let rssContent = "";
        
        // Safe content extraction
        const contentFields = [
          it.contentEncoded,
          it['content:encoded'],
          it.content,
          it.description,
          it.summary,
          it.contentSnippet
        ];
        
        for (const field of contentFields) {
          if (field) {
            const content = safeToString(field);
            if (content && content.length > rssContent.length) {
              rssContent = content;
            }
          }
        }
        
        // Clean HTML if present
        if (rssContent && rssContent.includes('<')) {
          try {
            const $ = cheerio.load(rssContent);
            $('img, script, style, iframe').remove();
            rssContent = $.text();
          } catch (e) {
            // If cheerio fails, try simple regex
            rssContent = rssContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          }
        }
        
        // LOCAL: Try to fetch full content for better summary (skip for WSJ to avoid issues)
        if (isLocal && i < 5 && !isWSJ) {
          try {
            const response = await fetch(link, {
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
            console.log(`Could not fetch full content for ${link}`);
          }
        }
        
        // Use the longest content available
        let finalContent = fullContent || rssContent || "";
        finalContent = cleanText(finalContent, 1500);
        
        // Ensure we have meaningful content
        if (finalContent.length < 100) {
          // If content too short, use title + any available content
          finalContent = title + ". " + finalContent;
        }
        
        // Translation for international sources (skip for WSJ if causing issues)
        if (isInternational && title && !isVietnamese(title) && !isWSJ) {
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
        let bulletSummary;
        try {
          bulletSummary = createBulletPointSummary(
            finalContent, 
            3,  // Keep 3 bullets
            800 // 800 characters total
          );
        } catch (e) {
          console.log(`Bullet creation failed for ${source.name}: ${e.message}`);
          bulletSummary = {
            text: finalContent.substring(0, 500),
            bullets: [`• ${finalContent.substring(0, 400)}...`]
          };
        }
        
        // If bullets are too short, create from full content
        if (!bulletSummary.bullets || bulletSummary.bullets.length === 0) {
          bulletSummary.bullets = [`• ${finalContent.substring(0, 400)}...`];
        }
        
        if (!bulletSummary.text || bulletSummary.text.length < 200) {
          bulletSummary.text = finalContent.substring(0, 500) + "...";
        }
        
        // Safe category extraction
        const cats = extractCategories(it);
        const derived = cats.length ? cats : deriveCategoriesFromURL(link);
        
        // Safe date extraction
        let publishedAt = null;
        try {
          publishedAt = toISO(it.isoDate || it.pubDate || it.date || it.published);
        } catch (e) {
          console.log(`Date parsing failed for ${source.name}: ${e.message}`);
          publishedAt = toISO(new Date());
        }
        
        // Safe image extraction
        const imageUrl = extractImageUrl(it);
        
        items.push({
          sourceId: source.id,
          sourceName: source.name,
          title: title,
          link: link,
          summary: bulletSummary.text || finalContent.substring(0, 500),
          bullets: bulletSummary.bullets,
          fullContent: fullContent || finalContent,
          publishedAt: publishedAt,
          image: imageUrl,
          categories: derived,
          translated: false
        });
        
      } catch (itemError) {
        console.error(`Error processing item from ${source.name}: ${itemError.message}`);
        // Continue with next item instead of failing completely
        continue;
      }
    }
    
    console.log(`✓ ${source.name}: Processed ${items.length} items`);
    return items;
    
  } catch (error) {
    console.error(`✗ RSS fetch failed for ${source.name}: ${error.message}`);
    return [];
  }
}