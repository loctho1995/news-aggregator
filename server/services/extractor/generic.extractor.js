export class GenericExtractor {
  static ARTICLE_SELECTORS = [
    'article',
    '[role="article"]',
    '[itemprop="articleBody"]',
    '.article-body',
    '.article-content',
    '.entry-content',
    '.post-content',
    '.news-content',
    '.content-body',
    '.main-content',
    'main',
    '#content'
  ];

  static PARAGRAPH_SELECTORS = [
    'p',
    '.paragraph',
    '.text-block',
    '.content p'
  ];

  static UNWANTED_SELECTORS = [
    'script',
    'style',
    'noscript',
    'iframe',
    '.advertisement',
    '.ads',
    '.social-share',
    '.related-news',
    '.comments',
    'footer',
    'header',
    'nav'
  ].join(',');

  static extract($) {
    // Remove unwanted elements
    $(this.UNWANTED_SELECTORS).remove();
    
    const paragraphs = [];
    
    // Try article selectors first
    for (const selector of this.ARTICLE_SELECTORS) {
      const $article = $(selector);
      if ($article.length > 0) {
        const extracted = this.extractFromElement($, $article);
        if (extracted.length > 2) {
          paragraphs.push(...extracted);
          break;
        }
      }
    }
    
    // Fallback to direct paragraph extraction
    if (paragraphs.length < 3) {
      $(this.PARAGRAPH_SELECTORS.join(',')).each((i, el) => {
        const text = $(el).text().trim();
        if (this.isValidParagraph(text) && !this.isDuplicate(text, paragraphs)) {
          paragraphs.push(text);
        }
      });
    }
    
    // Last resort: meta description
    if (paragraphs.length === 0) {
      const metaDesc = $('meta[property="og:description"]').attr('content') ||
                      $('meta[name="description"]').attr('content');
      if (metaDesc) {
        paragraphs.push(metaDesc);
      }
    }
    
    return {
      fullContent: paragraphs.join('\n\n'),
      paragraphs: paragraphs,
      paragraphCount: paragraphs.length
    };
  }

  static extractFromElement($, $element) {
    const paragraphs = [];
    
    $element.find('p').each((i, el) => {
      const text = $(el).text().trim();
      if (this.isValidParagraph(text)) {
        paragraphs.push(text);
      }
    });
    
    return paragraphs;
  }

  static isValidParagraph(text) {
    if (!text || text.length < 20) return false;
    
    const unwantedPatterns = [
      /^(Xem thêm|Đọc thêm|TIN LIÊN QUAN)/i,
      /^(Copyright|©|All rights reserved)/i,
      /^(Quảng cáo|Advertisement)/i
    ];
    
    return !unwantedPatterns.some(pattern => pattern.test(text));
  }

  static isDuplicate(text, paragraphs) {
    const normalized = text.toLowerCase().replace(/\s+/g, ' ');
    
    return paragraphs.some(p => {
      const pNorm = p.toLowerCase().replace(/\s+/g, ' ');
      return pNorm.includes(normalized) || normalized.includes(pNorm);
    });
  }
}