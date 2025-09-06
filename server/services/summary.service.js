import * as cheerio from 'cheerio';
import { config } from '../config/index.js';
import { CacheService } from './cache.service.js';
import { ContentExtractor } from './extractor/index.js';
import { ParagraphSummarizer } from './summarizer/paragraph.summarizer.js';
import { FetchStrategies } from './fetcher/strategies.js';

export class SummaryService {
  static async summarize({ url, percent = 70, fallback = '', isMobile = false }) {
    if (!url) throw new Error('URL is required');
    
    // Check cache
    const cacheKey = `${url}_${percent}_${isMobile ? 'm' : 'd'}`;
    const cached = CacheService.getSummary(cacheKey, isMobile);
    if (cached) {
      return { ...cached, cached: true };
    }
    
    try {
      // Fetch content with strategies
      const html = await FetchStrategies.fetchWithRetry(url, isMobile);
      
      if (!html || html.length < 100) {
        throw new Error('Could not fetch meaningful content');
      }
      
      // Parse HTML
      const $ = cheerio.load(html);
      
      // Extract metadata
      const title = this.extractTitle($);
      const metaDesc = this.extractMetaDescription($);
      const siteName = new URL(url).hostname;
      
      // Extract content
      const extracted = ContentExtractor.extract($, url);
      
      // Summarize
      const summarized = ParagraphSummarizer.summarize(
        extracted.paragraphs,
        percent / 100
      );
      
      // Build result
      const result = {
        url,
        title,
        site: siteName,
        bullets: summarized.bullets || [`• ${metaDesc || title}`],
        paragraphs: summarized.paragraphs || [metaDesc || title],
        fullSummary: summarized.summary || metaDesc || title,
        percentage: percent,
        originalLength: extracted.fullContent.length,
        summaryLength: summarized.summary.length,
        mobile: isMobile
      };
      
      // Cache result
      CacheService.setSummary(cacheKey, result, isMobile);
      
      return result;
    } catch (error) {
      console.error(`Summary error for ${url}:`, error.message);
      
      // Return fallback
      if (fallback) {
        return this.createFallbackResult(url, fallback, error.message);
      }
      
      throw error;
    }
  }

  static extractTitle($) {
    return $('meta[property="og:title"]').attr('content') ||
           $('meta[name="title"]').attr('content') ||
           $('title').text() ||
           $('h1').first().text() ||
           'Bài viết';
  }

  static extractMetaDescription($) {
    return $('meta[property="og:description"]').attr('content') ||
           $('meta[name="description"]').attr('content') ||
           '';
  }

  static createFallbackResult(url, fallback, errorMessage) {
    const bullets = fallback
      .split(/[.!?]+/)
      .filter(s => s.trim().length > 20)
      .slice(0, 3)
      .map(s => `• ${s.trim()}`);
    
    return {
      url,
      title: 'Tóm tắt từ bản lưu',
      site: new URL(url).hostname,
      bullets: bullets.length ? bullets : [`• ${fallback.substring(0, 300)}`],
      paragraphs: [fallback],
      fullSummary: fallback,
      percentage: 100,
      fallback: true,
      error: errorMessage
    };
  }
}