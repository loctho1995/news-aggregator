// server/services/aggregator/content-extractor.js
// PHIÊN BẢN CẢI TIẾN - Trích xuất đầy đủ và tóm tắt theo đoạn

export function extractFullContentWithParagraphs($) {
    // Xóa các thành phần không cần thiết
    $("script,style,noscript,iframe,.advertisement,.ads,.banner,.sidebar,.widget,.social-share,.related-news,.comment,.comments,.footer,header,nav").remove();
    
    // Danh sách selectors ưu tiên cho từng trang báo
    const contentSelectors = {
      // VnExpress
      vnexpress: {
        article: ".fck_detail, .article-content, .content-detail",
        paragraphs: "p:not(.Image):not(.caption)"
      },
      // Tuổi Trẻ
      tuoitre: {
        article: ".content-detail, .detail-content, .detail__content",
        paragraphs: "p"
      },
      // Dân Trí
      dantri: {
        article: ".singular-content, .detail-content, .e-magazine__body",
        paragraphs: "p"
      },
      // Thanh Niên
      thanhnien: {
        article: ".detail-content, .content, .article-body",
        paragraphs: "p"
      },
      // CafeF/CafeBiz
      cafe: {
        article: ".newscontent, .detail-content, .content-detail",
        paragraphs: "p"
      },
      // VietnamNet
      vietnamnet: {
        article: ".ArticleContent, .article-content, .content__body",
        paragraphs: "p"
      },
      // Generic fallback
      generic: {
        article: "article, [itemprop='articleBody'], .article-body, .entry-content, .post-content, .news-content, .main-content, .story-body",
        paragraphs: "p"
      }
    };
  
    let paragraphs = [];
    let fullContent = "";
    let contentElement = null;
  
    // Thử tìm content element chính xác nhất
    for (const [site, selectors] of Object.entries(contentSelectors)) {
      const $content = $(selectors.article);
      if ($content.length > 0) {
        contentElement = $content.first();
        
        // Lấy tất cả paragraphs trong content element
        const $paragraphs = contentElement.find(selectors.paragraphs);
        
        if ($paragraphs.length > 0) {
          $paragraphs.each((i, el) => {
            const text = $(el).text().trim();
            // Lọc paragraph có nội dung thực sự
            if (text && text.length > 30 && 
                !text.includes("Xem thêm") && 
                !text.includes("Đọc thêm") &&
                !text.includes("TIN LIÊN QUAN") &&
                !text.includes("Chia sẻ")) {
              paragraphs.push(text);
            }
          });
          
          if (paragraphs.length > 0) break;
        }
      }
    }
  
    // Fallback: Nếu không tìm thấy content chính, thu thập tất cả paragraphs
    if (paragraphs.length === 0) {
      $("p").each((i, el) => {
        const text = $(el).text().trim();
        const parent = $(el).parent();
        
        // Kiểm tra paragraph không nằm trong sidebar, footer, etc.
        if (text && text.length > 50 && 
            !parent.hasClass('sidebar') && 
            !parent.hasClass('footer') &&
            !parent.hasClass('related') &&
            !text.includes("Xem thêm") && 
            !text.includes("Đọc thêm")) {
          paragraphs.push(text);
        }
      });
    }
  
    // Lấy thêm lead/summary nếu có
    const lead = $(".sapo, .lead, .description, .chapeau, .article-summary").text().trim();
    if (lead && lead.length > 50 && !paragraphs.includes(lead)) {
      paragraphs.unshift(lead); // Thêm vào đầu
    }
  
    fullContent = paragraphs.join("\n\n");
  
    // Nếu vẫn không có content, fallback với meta tags
    if (!fullContent || fullContent.length < 100) {
      const ogDescription = $("meta[property='og:description']").attr("content") || "";
      const metaDescription = $("meta[name='description']").attr("content") || "";
      
      fullContent = [ogDescription, metaDescription].filter(Boolean).join("\n\n");
      if (fullContent) {
        paragraphs = fullContent.split("\n\n");
      }
    }
  
    return {
      fullContent: fullContent,
      paragraphs: paragraphs,
      paragraphCount: paragraphs.length
    };
  }
  
  // Hàm tóm tắt một đoạn văn
  function summarizeParagraph(paragraph, targetRatio = 0.5) {
    if (!paragraph || paragraph.length < 50) return paragraph;
    
    // Tách câu
    const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
    
    if (sentences.length <= 2) return paragraph; // Đoạn quá ngắn, giữ nguyên
    
    // Tính điểm quan trọng cho mỗi câu
    const scoredSentences = sentences.map(sentence => {
      let score = 0;
      const cleanSent = sentence.trim();
      
      // Câu có số liệu
      if (/\d+/.test(cleanSent)) score += 3;
      
      // Câu có từ khóa quan trọng
      const importantWords = /tăng|giảm|phát triển|quan trọng|chính|mới|đầu tiên|cuối cùng|kết quả|nguyên nhân|theo|cho biết|khẳng định/gi;
      if (importantWords.test(cleanSent)) score += 2;
      
      // Câu dài (thường chứa nhiều thông tin)
      if (cleanSent.length > 100) score += 1;
      
      // Câu đầu và cuối thường quan trọng
      if (sentences.indexOf(sentence) === 0) score += 2;
      if (sentences.indexOf(sentence) === sentences.length - 1) score += 1;
      
      return { sentence: cleanSent, score };
    });
    
    // Sắp xếp theo điểm và chọn câu quan trọng nhất
    scoredSentences.sort((a, b) => b.score - a.score);
    
    // Lấy số câu dựa trên targetRatio
    const targetCount = Math.max(1, Math.ceil(sentences.length * targetRatio));
    const selectedSentences = scoredSentences.slice(0, targetCount);
    
    // Sắp xếp lại theo thứ tự xuất hiện ban đầu
    selectedSentences.sort((a, b) => {
      const indexA = sentences.indexOf(sentences.find(s => s.trim() === a.sentence));
      const indexB = sentences.indexOf(sentences.find(s => s.trim() === b.sentence));
      return indexA - indexB;
    });
    
    return selectedSentences.map(s => s.sentence).join(' ');
  }
  
  // Hàm tóm tắt theo từng đoạn văn
  export function summarizeByParagraphs(paragraphs, summaryRatio = 0.7) {
    if (!paragraphs || paragraphs.length === 0) return { summarizedParagraphs: [], summary: "" };
    
    const summarizedParagraphs = [];
    
    for (const paragraph of paragraphs) {
      if (paragraph && paragraph.trim()) {
        const summarized = summarizeParagraph(paragraph, summaryRatio);
        if (summarized && summarized.trim()) {
          summarizedParagraphs.push(summarized);
        }
      }
    }
    
    return {
      summarizedParagraphs: summarizedParagraphs,
      summary: summarizedParagraphs.join('\n\n'),
      originalParagraphCount: paragraphs.length,
      summarizedParagraphCount: summarizedParagraphs.length
    };
  }
  
  // Hàm chính kết hợp extraction và summarization
  export function extractAndSummarizeContent($, summaryPercent = 70) {
    // Trích xuất nội dung đầy đủ với paragraphs
    const { fullContent, paragraphs, paragraphCount } = extractFullContentWithParagraphs($);
    
    // Tính summary ratio từ percent (70% = 0.7)
    const summaryRatio = summaryPercent / 100;
    
    // Tóm tắt theo từng đoạn
    const { 
      summarizedParagraphs, 
      summary, 
      originalParagraphCount, 
      summarizedParagraphCount 
    } = summarizeByParagraphs(paragraphs, summaryRatio);
    
    // Tạo bullets từ các đoạn tóm tắt (giới hạn 5-7 bullets)
    const maxBullets = Math.min(7, summarizedParagraphs.length);
    const bullets = summarizedParagraphs
      .slice(0, maxBullets)
      .map(p => `• ${p}`);
    
    return {
      fullContent: fullContent,
      originalParagraphs: paragraphs,
      summarizedParagraphs: summarizedParagraphs,
      summary: summary,
      bullets: bullets,
      stats: {
        originalLength: fullContent.length,
        summaryLength: summary.length,
        compressionRatio: Math.round((summary.length / fullContent.length) * 100),
        originalParagraphCount: originalParagraphCount,
        summarizedParagraphCount: summarizedParagraphCount,
        summaryPercent: summaryPercent
      }
    };
  }
  
  // Export hàm extractFullContent cũ cho backward compatibility
  export function extractFullContent($) {
    const { fullContent } = extractFullContentWithParagraphs($);
    return fullContent;
  }