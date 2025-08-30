// server/services/aggregator/html-fetcher.js
// OPTIMIZED FOR TIMEOUT ISSUES - Skip HTML fetching for problematic sources

import * as cheerio from "cheerio";
import { cleanText, toISO, deriveCategoriesFromURL } from "./utils.js";
import { createBulletPointSummary } from "./content-extractor/index.js";

// List of sources that often timeout
const SKIP_HTML_SOURCES = ['bnews', 'brandsvietnam', 'vietnamfinance', 'fireant'];

export async function fetchHTMLWithFullContent(source, signal = null) {
  console.log(`Fetching HTML from ${source.name}...`);
  
  // Skip known problematic sources
  if (SKIP_HTML_SOURCES.includes(source.id)) {
    console.log(`⚠️ Skipping ${source.name} (known timeout issues)`);
    return [];
  }
  
  try {
    // Fetch with extended timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout
    
    const res = await fetch(source.url, { 
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      },
      signal: signal || controller.signal,
      redirect: 'follow'
    });
    
    clearTimeout(timeout);
    
    if (!res.ok) {
      console.log(`HTTP ${res.status} for ${source.name}`);
      return [];
    }
    
    const html = await res.text();
    const $ = cheerio.load(html);
    const items = [];
    const host = (new URL(source.url)).hostname;
    
    // Find article links more efficiently
    const selectors = [
      'article h2 a',
      'article h3 a', 
      '.article-item a',
      '.news-item a',
      '.list-news a',
      'h2.title a',
      'h3.title a'
    ];
    
    const links = new Set();
    
    for (const selector of selectors) {
      $(selector).each((i, el) => {
        if (links.size >= 5) return false; // Stop after 5 links
        
        const href = $(el).attr("href");
        const text = $(el).text().trim();
        
        if (href && text && text.length > 20) {
          const absoluteUrl = href.startsWith('http') ? href : 
                            href.startsWith('/') ? `https://${host}${href}` : 
                            `${source.url}/${href}`;
          
          if (absoluteUrl.includes(host)) {
            links.add({
              url: absoluteUrl,
              title: text
            });
          }
        }
      });
      
      if (links.size >= 5) break;
    }
    
    // Process found links
    for (const linkData of links) {
      try {
        // Don't fetch full article content to save time
        // Just use the title and create summary from it
        const title = cleanText(linkData.title, 280);
        
        // Try to find description/summary on the listing page
        const linkEl = $(`a[href="${linkData.url}"]`).first();
        let summary = "";
        
        // Look for summary in common patterns
        const parent = linkEl.closest('article, .article-item, .news-item');
        if (parent.length) {
          summary = parent.find('.summary, .description, .desc, .sapo, p').first().text() || "";
        }
        
        if (!summary) {
          summary = title; // Use title as summary if nothing found
        }
        
        summary = cleanText(summary, 500);
        const bulletSummary = createBulletPointSummary(summary, 3, 400);
        
        items.push({
          sourceId: source.id,
          sourceName: source.name,
          title: title,
          link: linkData.url,
          summary: bulletSummary.text,
          bullets: bulletSummary.bullets,
          fullContent: summary,
          publishedAt: toISO(new Date()),
          image: null,
          categories: deriveCategoriesFromURL(linkData.url)
        });
        
      } catch (e) {
        console.error(`Error processing link from ${source.name}: ${e.message}`);
      }
    }
    
    console.log(`✓ ${source.name}: Extracted ${items.length} items`);
    return items;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`✗ ${source.name} timeout after 20s`);
    } else {
      console.error(`✗ HTML fetch failed for ${source.name}: ${error.message}`);
    }
    return [];
  }
}