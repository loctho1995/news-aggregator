// Content extraction logic - ENHANCED VERSION

import { CONTENT_SELECTORS, LEAD_SELECTORS, UNWANTED_SELECTORS } from './config.js';

export class ContentExtractor {
  constructor($) {
    this.$ = $;
    this.removeUnwanted();
  }

  removeUnwanted() {
    this.$(UNWANTED_SELECTORS).remove();
    // Also remove empty elements
    this.$('p:empty, div:empty').remove();
  }

  extract() {
    let paragraphs = [];
    let contentFound = false;

    // Try domain-specific selectors first
    const domain = this.detectDomain();
    if (domain && CONTENT_SELECTORS[domain]) {
      paragraphs = this.extractWithSelectors(CONTENT_SELECTORS[domain]);
      if (paragraphs.length > 2) {
        contentFound = true;
      }
    }

    // Try all specific selectors if domain not found
    if (!contentFound) {
      for (const [site, selectors] of Object.entries(CONTENT_SELECTORS)) {
        if (contentFound) break;
        
        paragraphs = this.extractWithSelectors(selectors);
        if (paragraphs.length > 2) {
          contentFound = true;
          break;
        }
      }
    }

    // Fallback to smart extraction
    if (!contentFound) {
      paragraphs = this.smartExtraction();
    }

    // Try density analysis if still not enough
    if (paragraphs.length < 3) {
      const densityParagraphs = this.extractByDensity(paragraphs);
      paragraphs = this.mergeUnique(paragraphs, densityParagraphs);
    }

    // Add lead/summary
    paragraphs = this.addLeadContent(paragraphs);

    // Last resort: aggressive extraction
    if (paragraphs.length < 2) {
      paragraphs = this.aggressiveExtraction();
    }

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

  detectDomain() {
    const $ = this.$;
    const url = $('meta[property="og:url"]').attr('content') || 
                $('link[rel="canonical"]').attr('href') || '';
    
    if (url.includes('vnexpress')) return 'vnexpress';
    if (url.includes('tuoitre')) return 'tuoitre';
    if (url.includes('dantri')) return 'dantri';
    if (url.includes('thanhnien')) return 'thanhnien';
    if (url.includes('vietnamnet')) return 'vietnamnet';
    if (url.includes('laodong')) return 'laodong';
    if (url.includes('cafef') || url.includes('cafebiz')) return 'cafe';
    
    return null;
  }

  smartExtraction() {
    const $ = this.$;
    const paragraphs = [];
    
    // Common article selectors used by many Vietnamese sites
    const smartSelectors = [
      'article p',
      'main p',
      '.content p',
      '.article p',
      '.post p',
      '.entry p',
      '.body p',
      '.text p',
      '[role="main"] p',
      '[itemscope] p',
      '.container p'
    ];
    
    for (const selector of smartSelectors) {
      const elements = $(selector);
      if (elements.length > 2) {
        elements.each((i, el) => {
          const text = $(el).text().trim();
          if (this.isValidParagraph(text) && !this.isDuplicate(text, paragraphs)) {
            paragraphs.push(text);
          }
        });
        
        if (paragraphs.length > 3) break;
      }
    }
    
    return paragraphs;
  }

  aggressiveExtraction() {
    const $ = this.$;
    const paragraphs = [];
    
    // Get ALL text nodes with significant content
    const textNodes = [];
    
    // Find elements with text
    $('*').each((i, elem) => {
      const $elem = $(elem);
      const tagName = elem.name?.toLowerCase();
      
      // Skip unwanted tags
      if (['script', 'style', 'noscript', 'iframe'].includes(tagName)) return;
      
      // Get direct text (not from children)
      const directText = $elem.clone().children().remove().end().text().trim();
      
      if (directText && directText.length > 50) {
        // Calculate text density
        const childrenCount = $elem.children().length;
        const linkDensity = $elem.find('a').text().length / (directText.length || 1);
        
        // Score based on various factors
        let score = directText.length;
        score -= childrenCount * 20;
        score -= linkDensity * 100;
        
        // Bonus for certain tags
        if (['p', 'article', 'section', 'main'].includes(tagName)) score += 50;
        if ($elem.attr('class')?.includes('content')) score += 30;
        if ($elem.attr('class')?.includes('article')) score += 30;
        
        textNodes.push({
          text: directText,
          score,
          tag: tagName,
          class: $elem.attr('class') || ''
        });
      }
    });
    
    // Sort by score and select best content
    textNodes.sort((a, b) => b.score - a.score);
    
    // Group consecutive high-scoring nodes
    const seen = new Set();
    for (const node of textNodes.slice(0, 30)) {
      if (!seen.has(node.text) && this.isValidParagraph(node.text)) {
        paragraphs.push(node.text);
        seen.add(node.text);
        
        if (paragraphs.length >= 5) break;
      }
    }
    
    return paragraphs;
  }

  extractWithSelectors(selectors) {
    const paragraphs = [];
    const $ = this.$;
    
    // Try article selector first
    const $contents = $(selectors.article);
    
    if ($contents.length > 0) {
      $contents.each((i, content) => {
        const $content = $(content);
        
        // Try paragraph selectors
        const textContent = $content.find(selectors.paragraphs);
        
        textContent.each((j, el) => {
          const text = $(el).text().trim();
          if (this.isValidParagraph(text) && !this.isDuplicate(text, paragraphs)) {
            paragraphs.push(text);
          }
        });
        
        // If no paragraphs found, try direct text
        if (paragraphs.length === 0) {
          const directText = $content.text().trim();
          if (directText && directText.length > 100) {
            // Split by double newlines
            const chunks = directText.split(/\n\n+/).filter(chunk => chunk.trim().length > 50);
            paragraphs.push(...chunks);
          }
        }
      });
    } else {
      // Try paragraph selectors directly
      $(selectors.paragraphs).each((i, el) => {
        const text = $(el).text().trim();
        if (this.isValidParagraph(text) && !this.isDuplicate(text, paragraphs)) {
          paragraphs.push(text);
        }
      });
    }
    
    return paragraphs;
  }

  extractByDensity(existingParagraphs) {
    const $ = this.$;
    const candidates = [];
    
    $("p, div, section, article, td").each((i, el) => {
      const $el = $(el);
      const text = $el.clone().children().remove().end().text().trim();
      
      if (text && text.length > 50 && text.length < 2000) {
        candidates.push({
          text,
          parent: $el.parent().attr('class') || $el.parent().prop('tagName') || 'unknown',
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
    const metaContent = [];
    
    // Try various meta tags
    const metaTags = [
      $("meta[property='og:description']").attr("content"),
      $("meta[name='description']").attr("content"),
      $("meta[property='article:description']").attr("content"),
      $("meta[name='twitter:description']").attr("content"),
      $("meta[property='og:title']").attr("content"),
      $("title").text()
    ];
    
    for (const content of metaTags) {
      if (content && content.trim().length > 20) {
        metaContent.push(content.trim());
      }
    }
    
    // Also try to get any visible text
    if (metaContent.length === 0) {
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
      if (bodyText && bodyText.length > 100) {
        metaContent.push(bodyText.substring(0, 500) + '...');
      }
    }
    
    return metaContent.length > 0 ? metaContent : ["Không thể trích xuất nội dung"];
  }

  isValidParagraph(text) {
    if (!text || text.length < 20) return false;
    
    // Improved filtering
    const unwantedPatterns = [
      /^(Xem thêm|Đọc thêm|TIN LIÊN QUAN|Chia sẻ|Bình luận|Theo dõi|Click|Nhấn vào)/i,
      /^(Copyright|©|All rights reserved)/i,
      /^(Quảng cáo|Advertisement|Sponsored)/i,
      /^[\d\s\-\+\(\)]+$/, // Phone numbers
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Emails
      /^(Share|Tweet|Pin|Email|Print)/i
    ];
    
    return !unwantedPatterns.some(pattern => pattern.test(text));
  }

  isDuplicate(text, paragraphs) {
    const normalized = text.toLowerCase().replace(/\s+/g, ' ');
    
    return paragraphs.some(p => {
      const pNorm = p.toLowerCase().replace(/\s+/g, ' ');
      // Check if either contains the other (with some tolerance)
      return pNorm.includes(normalized) || normalized.includes(pNorm) ||
             this.similarity(pNorm, normalized) > 0.8;
    });
  }

  similarity(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  calculateDensity($el, text) {
    const linkDensity = $el.find('a').text().length / (text.length || 1);
    const childElements = $el.children().length;
    const imageCount = $el.find('img').length;
    
    let score = text.length * (1 - linkDensity);
    score -= childElements * 10;
    score -= imageCount * 30;
    
    // Bonus for good indicators
    const className = $el.attr('class') || '';
    const id = $el.attr('id') || '';
    
    if (/content|article|body|main|post|entry/i.test(className + ' ' + id)) {
      score += 100;
    }
    
    if (/sidebar|menu|nav|footer|header|ad|comment/i.test(className + ' ' + id)) {
      score -= 200;
    }
    
    return score;
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
    
    Object.entries(grouped).forEach(([parent, texts]) => {
      const totalLength = texts.reduce((sum, text) => sum + text.length, 0);
      const avgLength = totalLength / texts.length;
      const score = totalLength * (texts.length > 2 ? 1.5 : 1) * (avgLength > 100 ? 1.2 : 1);
      
      if (score > maxScore && texts.length > 0) {
        maxScore = score;
        bestGroup = texts;
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