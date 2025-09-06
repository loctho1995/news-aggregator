import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { config } from '../../config/index.js';
import { ContentExtractor } from '../extractor/index.js';
import { BulletSummarizer } from '../summarizer/bullet.summarizer.js';

export class RSSFetcher {
  static parser = new Parser({
    timeout: config.timeouts.rss[config.isLocal ? 'local' : 'production'],
    headers: {
      'User-Agent': config.isLocal 
        ? 'VN News Aggregator/1.0'
        : 'Mozilla/5.0 (compatible; Googlebot/2.1)',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*'
    }
  });

  static async fetch(source, options = {}) {
    console.log(`Fetching RSS from ${source.name}...`);
    
    try {
      const feed = await this.fetchFeed(source.url);
      
      if (!feed?.items?.length) {
        console.log(`No items found for ${source.name}`);
        return [];
      }

      const items = [];
      const maxItems = config.isLocal ? 10 : 8;
      const isInternational = this.isInternationalSource(source.group);

      for (let i = 0; i < Math.min(feed.items.length, maxItems); i++) {
        const item = await this.processItem(feed.items[i], source, isInternational);
        if (item) items.push(item);
      }

      console.log(`✓ ${source.name}: Processed ${items.length} items`);
      return items;
    } catch (error) {
      console.error(`✗ RSS fetch failed for ${source.name}: ${error.message}`);
      return [];
    }
  }

  static async fetchFeed(url) {
    if (config.isLocal) {
      return await this.parser.parseURL(url);
    }

    // Production: try direct first, then proxy
    try {
      return await this.parser.parseURL(url);
    } catch (error) {
      console.log('Direct fetch failed, trying proxy...');
      const proxyUrl = `${config.apis.proxy.allorigins}?url=${encodeURIComponent(url)}`;
      return await this.parser.parseURL(proxyUrl);
    }
  }

  static async processItem(feedItem, source, isInternational) {
    try {
      const title = this.cleanText(feedItem.title, 280);
      const content = this.extractContent(feedItem);
      
      // Create bullet summary
      const bulletSummary = BulletSummarizer.create(content, 3, 800);
      
      return {
        sourceId: source.id,
        sourceName: source.name,
        title: isInternational && !this.isVietnamese(title) ? `[EN] ${title}` : title,
        link: feedItem.link,
        summary: bulletSummary.text || content.substring(0, 500),
        bullets: bulletSummary.bullets,
        fullContent: content,
        publishedAt: this.parseDate(feedItem.isoDate || feedItem.pubDate),
        image: feedItem.enclosure?.url || feedItem.image?.url || null,
        categories: this.extractCategories(feedItem),
        translated: false
      };
    } catch (error) {
      console.error(`Error processing RSS item: ${error.message}`);
      return null;
    }
  }

  static extractContent(item) {
    let content = '';
    
    // Try multiple content fields
    const contentFields = [
      'contentEncoded',
      'content:encoded',
      'content',
      'contentSnippet',
      'summary',
      'description'
    ];

    for (const field of contentFields) {
      if (item[field]) {
        content = item[field];
        break;
      }
    }

    // Clean HTML if present
    if (content && content.includes('<')) {
      const $ = cheerio.load(content);
      $('img, script, style').remove();
      content = $.text();
    }

    return this.cleanText(content, 1500);
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

  static isVietnamese(text) {
    const vnPattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return vnPattern.test(text);
  }

  static isInternationalSource(group) {
    const internationalGroups = [
      'internationaleconomics',
      'internationaltech',
      'startuptech',
      'developernews',
      'gamenews',
      'designuiux'
    ];
    return internationalGroups.includes(group);
  }

  static parseDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString();
  }

  static extractCategories(item) {
    const categories = item.categories || item.category || [];
    return Array.isArray(categories) 
      ? categories.map(c => String(c).trim()).filter(Boolean)
      : [String(categories).trim()].filter(Boolean);
  }
}