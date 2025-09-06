import * as cheerio from 'cheerio';
import { config } from '../../config/index.js';
import { BulletSummarizer } from '../summarizer/bullet.summarizer.js';

export class HTMLFetcher {
  static SKIP_SOURCES = config.isLocal ? [] : ['bnews', 'brandsvietnam', 'vietnamfinance'];

  static async fetch(source, options = {}) {
    console.log(`Fetching HTML from ${source.name}...`);
    
    if (!config.isLocal && this.SKIP_SOURCES.includes(source.id)) {
      console.log(`⚠️ Skipping ${source.name} (known issues on server)`);
      return [];
    }

    try {
      const timeout = config.timeouts.html[config.isLocal ? 'local' : 'production'];
      const html = await this.fetchHTML(source.url, timeout, options.signal);
      
      if (!html) {
        console.log(`No content fetched for ${source.name}`);
        return [];
      }

      const $ = cheerio.load(html);
      const items = this.extractItems($, source);
      
      console.log(`✓ ${source.name}: Extracted ${items.length} items`);
      return items;
    } catch (error) {
      console.error(`✗ HTML fetch failed for ${source.name}: ${error.message}`);
      return [];
    }
  }

  static async fetchHTML(url, timeout, signal) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8'
        },
        signal: signal || controller.signal,
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  static extractItems($, source) {
    const items = [];
    const host = new URL(source.url).hostname;
    const processedLinks = new Set();
    const maxItems = config.isLocal ? 10 : 5;

    const selectors = [
      'article',
      '.article-item',
      '.news-item',
      '.story-item',
      '.list-news li',
      '.content-item'
    ];

    for (const selector of selectors) {
      if (items.length >= maxItems) break;
      
      $(selector).each((i, elem) => {
        if (items.length >= maxItems) return false;
        
        const item = this.extractItem($(elem), host, source, processedLinks);
        if (item) items.push(item);
      });
    }

    return items;
  }

  static extractItem($elem, host, source, processedLinks) {
    const $link = $elem.find('a[href]').first();
    if (!$link.length) return null;

    const href = $link.attr('href');
    if (!href || processedLinks.has(href)) return null;

    const absoluteUrl = this.makeAbsoluteUrl(href, host, source.url);
    if (!absoluteUrl.includes(host)) return null;
    
    processedLinks.add(href);

    const title = this.extractTitle($elem, $link);
    if (!title || title.length < 10) return null;

    const summary = this.extractSummary($elem, $link, title);
    const bulletSummary = BulletSummarizer.create(summary, 3, 800);

    return {
      sourceId: source.id,
      sourceName: source.name,
      title: this.cleanText(title, 280),
      link: absoluteUrl,
      summary: bulletSummary.text || summary.substring(0, 600),
      bullets: bulletSummary.bullets,
      fullContent: summary,
      publishedAt: new Date().toISOString(),
      image: this.extractImage($elem, host),
      categories: this.deriveCategoriesFromURL(absoluteUrl)
    };
  }

  static extractTitle($elem, $link) {
    return $elem.find('h2, h3, h4, .title, .headline').first().text().trim() ||
           $link.text().trim() ||
           $link.attr('title') ||
           '';
  }

  static extractSummary($elem, $link, title) {
    let summary = '';
    
    const selectors = [
      '.summary',
      '.description',
      '.desc',
      '.sapo',
      '.excerpt',
      'p'
    ];

    for (const selector of selectors) {
      if (summary) break;
      const $summary = $elem.find(selector).first();
      if ($summary.length) {
        summary = $summary.text().trim();
      }
    }

    if (!summary) {
      const allText = $elem.text().replace(/\s+/g, ' ').trim();
      summary = allText.replace(title, '').trim();
    }

    return this.cleanText(summary, 1200);
  }

  static extractImage($elem, host) {
    let image = $elem.find('img').first().attr('src') ||
                $elem.find('img').first().attr('data-src');
    
    if (image && !image.startsWith('http')) {
      image = `https://${host}${image.startsWith('/') ? '' : '/'}${image}`;
    }
    
    return image || null;
  }

  static makeAbsoluteUrl(href, host, baseUrl) {
    if (href.startsWith('http')) return href;
    if (href.startsWith('/')) return `https://${host}${href}`;
    return `${baseUrl}/${href}`;
  }

  static cleanText(text, maxLength = 500) {
    if (!text) return '';
    const cleaned = String(text)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned.length > maxLength 
      ? cleaned.slice(0, maxLength - 3) + '...' 
      : cleaned;
  }

  static deriveCategoriesFromURL(url) {
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      return segments
        .filter(s => !/^\d/.test(s))
        .slice(0, 2)
        .map(s => s.replace(/[-_]/g, ' '));
    } catch {
      return [];
    }
  }
}