// Content extraction logic

import { CONTENT_SELECTORS, LEAD_SELECTORS, UNWANTED_SELECTORS } from './config.js';

export class ContentExtractor {
  constructor($) {
    this.$ = $;
    this.removeUnwanted();
  }

  removeUnwanted() {
    this.$(UNWANTED_SELECTORS).remove();
  }

  extract() {
    let paragraphs = [];
    let contentFound = false;

    // Try specific selectors
    for (const [site, selectors] of Object.entries(CONTENT_SELECTORS)) {
      if (contentFound) break;
      
      paragraphs = this.extractWithSelectors(selectors);
      if (paragraphs.length > 2) {
        contentFound = true;
        break;
      }
    }

    // Fallback to density analysis
    if (!contentFound) {
      paragraphs = this.extractByDensity(paragraphs);
    }

    // Add lead/summary
    paragraphs = this.addLeadContent(paragraphs);

    // Final fallback
    if (paragraphs.length === 0) {
      paragraphs = this.extractFromMeta();
    }

    const fullContent = paragraphs.join("\n\n");
    
    return {
      fullContent,
      paragraphs,
      paragraphCount: paragraphs.length
    };
  }

  extractWithSelectors(selectors) {
    const paragraphs = [];
    const $ = this.$;
    const $contents = $(selectors.article);
    
    $contents.each((i, content) => {
      const $content = $(content);
      const textContent = $content.find(selectors.paragraphs);
      
      textContent.each((j, el) => {
        const text = $(el).text().trim();
        if (this.isValidParagraph(text) && !this.isDuplicate(text, paragraphs)) {
          paragraphs.push(text);
        }
      });
    });
    
    return paragraphs;
  }

  extractByDensity(existingParagraphs) {
    const $ = this.$;
    const candidates = [];
    
    $("p, div, section, article").each((i, el) => {
      const $el = $(el);
      const text = $el.clone().children().remove().end().text().trim();
      
      if (text && text.length > 50) {
        candidates.push({
          text,
          parent: $el.parent().attr('class') || 'unknown',
          score: this.calculateDensity($el, text)
        });
      }
    });
    
    // Group by parent and select best group
    const grouped = this.groupByParent(candidates);
    const bestGroup = this.selectBestGroup(grouped);
    
    return this.mergeUnique(existingParagraphs, bestGroup);
  }

  addLeadContent(paragraphs) {
    const $ = this.$;
    
    for (const selector of LEAD_SELECTORS) {
      const lead = $(selector).text().trim();
      if (lead && lead.length > 30 && !this.isDuplicate(lead, paragraphs)) {
        paragraphs.unshift(lead);
        break;
      }
    }
    
    return paragraphs;
  }

  extractFromMeta() {
    const $ = this.$;
    const metaContent = [
      $("meta[property='og:description']").attr("content"),
      $("meta[name='description']").attr("content"),
      $("meta[property='article:description']").attr("content")
    ].filter(Boolean);
    
    return metaContent.length > 0 ? metaContent : ["Không thể trích xuất nội dung"];
  }

  isValidParagraph(text) {
    if (!text || text.length < 20) return false;
    
    const unwantedPatterns = [
      /Xem thêm:/i, /Đọc thêm:/i, /TIN LIÊN QUAN/i,
      /Chia sẻ bài viết/i, /Bình luận/i
    ];
    
    return !unwantedPatterns.some(pattern => pattern.test(text));
  }

  isDuplicate(text, paragraphs) {
    return paragraphs.some(p => 
      p.includes(text) || text.includes(p)
    );
  }

  calculateDensity($el, text) {
    const linkDensity = $el.find('a').text().length / (text.length || 1);
    const childElements = $el.children().length;
    
    return text.length * (1 - linkDensity) - childElements * 10;
  }

  groupByParent(candidates) {
    const grouped = {};
    
    candidates.forEach(c => {
      if (!grouped[c.parent]) grouped[c.parent] = [];
      grouped[c.parent].push(c.text);
    });
    
    return grouped;
  }

  selectBestGroup(grouped) {
    let bestGroup = [];
    let maxScore = 0;
    
    Object.values(grouped).forEach(group => {
      const score = group.reduce((sum, text) => sum + text.length, 0);
      if (score > maxScore) {
        maxScore = score;
        bestGroup = group;
      }
    });
    
    return bestGroup;
  }

  mergeUnique(existing, newItems) {
    const result = [...existing];
    
    newItems.forEach(text => {
      if (!this.isDuplicate(text, result)) {
        result.push(text);
      }
    });
    
    return result;
  }
}

export function extractFullContentWithParagraphs($) {
  const extractor = new ContentExtractor($);
  return extractor.extract();
}

export function extractFullContent($) {
  const { fullContent } = extractFullContentWithParagraphs($);
  return fullContent;
}