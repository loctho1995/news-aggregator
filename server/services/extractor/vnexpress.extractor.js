export class VnExpressExtractor {
  static extract($) {
    const paragraphs = [];
    
    // Remove unwanted elements
    $('.box-tinlienquan, .box-category, .banner, .social-share').remove();
    
    // Extract lead/description
    const lead = $('.sidebar-1 .description, h2.description, .description')
      .first()
      .text()
      .trim();
    
    if (lead && lead.length > 30) {
      paragraphs.push(lead);
    }
    
    // Extract main content
    $('.fck_detail p.Normal, article.fck p.Normal, .content-detail p').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 20 && !text.includes('Xem thêm:')) {
        paragraphs.push(text);
      }
    });
    
    // Fallback to any article paragraphs
    if (paragraphs.length < 3) {
      $('article p, .article-content p').each((i, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 30 && !paragraphs.includes(text)) {
          paragraphs.push(text);
        }
      });
    }
    
    return {
      fullContent: paragraphs.join('\n\n'),
      paragraphs: paragraphs,
      paragraphCount: paragraphs.length
    };
  }
}