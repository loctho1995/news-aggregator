// server/services/aggregator/html-fetcher.js
// FIXED VERSION - Longer content for cards

import * as cheerio from "cheerio";
import { cleanText, toISO, deriveCategoriesFromURL } from "./utils.js";
import { createBulletPointSummary } from "./content-extractor/index.js";

// Check environment
const isLocal = process.env.NODE_ENV !== 'production' || 
                process.env.LOCAL_DEV === 'true';

// Skip these sources only on server
const SKIP_HTML_SOURCES = isLocal ? [] : ['bnews', 'brandsvietnam', 'vietnamfinance', 'fireant'];

export async function fetchHTMLWithFullContent(source, signal = null) {
  console.log(`Fetching HTML from ${source.name}...`);
  
  // Skip problematic sources on server only
  if (!isLocal && SKIP_HTML_SOURCES.includes(source.id)) {
    console.log(`⚠️ Skipping ${source.name} (known timeout issues on server)`);
    return [];
  }
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), isLocal ? 10000 : 20000);
    
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
    
    // Enhanced selectors for better content extraction
    const articleSelectors = [
      'article',
      '.article-item',
      '.news-item', 
      '.story-item',
      '.list-news li',
      '.content-item',
      '.post-item',
      '.entry'
    ];
    
    const processedLinks = new Set();
    const maxLinks = isLocal ? 10 : 5; // More items locally
    
    // Try to find articles with more content
    for (const selector of articleSelectors) {
      if (items.length >= maxLinks) break;
      
      $(selector).each((i, elem) => {
        if (items.length >= maxLinks) return false;
        
        const $elem = $(elem);
        
        // Find link
        const $link = $elem.find('a[href]').first();
        if (!$link.length) return;
        
        const href = $link.attr('href');
        if (!href || processedLinks.has(href)) return;
        
        const absoluteUrl = href.startsWith('http') ? href : 
                          href.startsWith('/') ? `https://${host}${href}` : 
                          `${source.url}/${href}`;
        
        if (!absoluteUrl.includes(host)) return;
        processedLinks.add(href);
        
        // Extract title (try multiple selectors)
        let title = $elem.find('h2, h3, h4, .title, .headline').first().text().trim() ||
                   $link.text().trim() ||
                   $link.attr('title') ||
                   "";
        
        if (!title || title.length < 10) return;
        
        // Extract summary/description (ENHANCED)
        let summary = "";
        
        // Try multiple summary selectors
        const summarySelectors = [
          '.summary',
          '.description', 
          '.desc',
          '.sapo',
          '.excerpt',
          '.intro',
          '.lead',
          '.abstract',
          'p'
        ];
        
        for (const sumSelector of summarySelectors) {
          if (summary) break;
          const $summary = $elem.find(sumSelector).first();
          if ($summary.length) {
            summary = $summary.text().trim();
          }
        }
        
        // If no summary in article element, try to find it near the link
        if (!summary) {
          // Check siblings
          const $parent = $link.parent();
          summary = $parent.find('p, .desc, .summary').text().trim() ||
                   $parent.siblings('p, .desc, .summary').first().text().trim() ||
                   $parent.parent().find('p, .desc, .summary').first().text().trim();
        }
        
        // If still no summary, use any text content in the article
        if (!summary || summary.length < 50) {
          // Get all text from article element
          const allText = $elem.text().replace(/\s+/g, ' ').trim();
          // Remove title from text
          summary = allText.replace(title, '').trim();
        }
        
        // Clean and ensure good length
        title = cleanText(title, 280);
        summary = cleanText(summary, 1200); // INCREASED from 500 to 1200
        
        // If summary still too short, combine with title
        if (summary.length < 100) {
          summary = title + ". " + summary;
        }
        
        // Create bullet summary with MORE content
        const bulletSummary = createBulletPointSummary(
          summary, 
          3,  // 3 bullets
          800 // INCREASED from 400 to 800 chars
        );
        
        // Ensure bullets have content
        if (bulletSummary.bullets.length === 0 || bulletSummary.text.length < 100) {
          // Create bullets from summary chunks
          const chunkSize = Math.min(300, Math.floor(summary.length / 3));
          bulletSummary.bullets = [];
          
          for (let i = 0; i < Math.min(3, Math.floor(summary.length / chunkSize)); i++) {
            const chunk = summary.substring(i * chunkSize, (i + 1) * chunkSize);
            if (chunk.trim()) {
              bulletSummary.bullets.push(`• ${chunk.trim()}${chunk.length === chunkSize ? '...' : ''}`);
            }
          }
          
          bulletSummary.text = summary.substring(0, 600);
        }
        
        // Extract image if available
        let image = $elem.find('img').first().attr('src') ||
                   $elem.find('img').first().attr('data-src') ||
                   null;
        
        if (image && !image.startsWith('http')) {
          image = `https://${host}${image.startsWith('/') ? '' : '/'}${image}`;
        }
        
        items.push({
          sourceId: source.id,
          sourceName: source.name,
          title: title,
          link: absoluteUrl,
          summary: bulletSummary.text || summary.substring(0, 600),
          bullets: bulletSummary.bullets.length > 0 ? bulletSummary.bullets : [`• ${summary.substring(0, 500)}...`],
          fullContent: summary, // Store full extracted content
          publishedAt: toISO(new Date()),
          image: image,
          categories: deriveCategoriesFromURL(absoluteUrl)
        });
      });
    }
    
    console.log(`✓ ${source.name}: Extracted ${items.length} items`);
    return items;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`✗ ${source.name} timeout after ${isLocal ? '10s' : '20s'}`);
    } else {
      console.error(`✗ HTML fetch failed for ${source.name}: ${error.message}`);
    }
    return [];
  }
}