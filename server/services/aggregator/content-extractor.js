// server/services/aggregator/content-extractor.js
// Trích xuất và tóm tắt nội dung từ HTML

// Trích xuất nội dung đầy đủ với các đoạn văn
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

// Hàm tóm tắt một đoạn văn với tỷ lệ chính xác
function summarizeParagraph(paragraph, targetRatio = 0.5) {
  if (!paragraph || paragraph.length < 50) return paragraph;
  
  // Tách câu cẩn thận hơn - hỗ trợ cả tiếng Việt
  const sentences = paragraph.match(/[^.!?…]+[.!?…]+/g) || [paragraph];
  
  // Nếu chỉ có 1 câu VÀ rất dài
  if (sentences.length === 1) {
    // Nếu câu quá dài (>200 ký tự) và cần cắt nhiều (ratio < 0.5)
    if (paragraph.length > 200 && targetRatio < 0.5) {
      // Thử tìm điểm cắt tự nhiên (dấu phẩy, dấu chấm phẩy)
      const naturalBreaks = paragraph.split(/[,;]/);
      if (naturalBreaks.length > 1) {
        // Lấy phần đầu có ý nghĩa
        const targetLength = Math.floor(paragraph.length * targetRatio);
        let result = '';
        for (const part of naturalBreaks) {
          if (result.length < targetLength) {
            result += (result ? ',' : '') + part;
          } else {
            break;
          }
        }
        // Chỉ thêm "..." nếu thực sự cắt bớt nội dung
        if (result.length < paragraph.length - 10) {
          return result.trim() + '...';
        }
      }
    }
    // Nếu không thể cắt hoặc câu ngắn, giữ nguyên
    return paragraph;
  }
  
  // Với nhiều câu - tính điểm quan trọng cho mỗi câu
  const scoredSentences = sentences.map((sentence, index) => {
    let score = 0;
    const cleanSent = sentence.trim();
    
    // Bỏ qua câu quá ngắn (có thể là lỗi tách câu)
    if (cleanSent.length < 20) {
      score -= 5;
    }
    
    // Câu có số liệu, phần trăm
    if (/\d+[%]?/.test(cleanSent)) score += 4;
    
    // Câu có tên riêng (viết hoa)
    if (/[A-ZĂÂĐÊÔƠƯ][a-zăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]+/.test(cleanSent)) score += 2;
    
    // Câu có từ khóa quan trọng tiếng Việt
    const importantWords = /tăng|giảm|phát triển|quan trọng|chính|mới|đầu tiên|cuối cùng|kết quả|nguyên nhân|theo|cho biết|khẳng định|tuy nhiên|nhưng|tổng|trung bình|cao nhất|thấp nhất/gi;
    const matches = cleanSent.match(importantWords);
    if (matches) score += matches.length * 2;
    
    // Câu có dấu ngoặc kép (trích dẫn)
    if (/["'"]/.test(cleanSent)) score += 3;
    
    // Vị trí câu
    if (index === 0) score += 3; // Câu đầu quan trọng
    if (index === sentences.length - 1) score += 2; // Câu cuối quan trọng
    if (index === 1) score += 1; // Câu thứ 2 cũng thường quan trọng
    
    // Độ dài câu hợp lý (không quá ngắn, không quá dài)
    if (cleanSent.length > 50 && cleanSent.length < 200) score += 2;
    
    return { 
      sentence: cleanSent, 
      score, 
      index,
      length: cleanSent.length 
    };
  });
  
  // Loại bỏ câu có điểm âm
  const validSentences = scoredSentences.filter(s => s.score > 0);
  
  // Nếu không có câu hợp lệ, giữ ít nhất câu đầu
  if (validSentences.length === 0) {
    return sentences[0].trim();
  }
  
  // Tính số ký tự mục tiêu
  const totalLength = paragraph.length;
  const targetLength = Math.floor(totalLength * targetRatio);
  
  // Sắp xếp theo điểm
  validSentences.sort((a, b) => b.score - a.score);
  
  // Chọn câu quan trọng nhất cho đến khi đạt targetLength
  let currentLength = 0;
  const selectedSentences = [];
  
  for (const sentObj of validSentences) {
    // Luôn giữ ít nhất 1 câu
    if (selectedSentences.length === 0) {
      selectedSentences.push(sentObj);
      currentLength += sentObj.length;
      continue;
    }
    
    // Kiểm tra có nên thêm câu này
    if (currentLength < targetLength * 0.8) { // Cho phép dưới 80% target
      selectedSentences.push(sentObj);
      currentLength += sentObj.length;
    } else {
      // Đã đủ gần target, kiểm tra xem có nên thêm
      const overshoot = currentLength - targetLength;
      const nextOvershoot = (currentLength + sentObj.length) - targetLength;
      
      // Chỉ thêm nếu không vượt quá 120% target
      if (nextOvershoot < targetLength * 0.2) {
        selectedSentences.push(sentObj);
        currentLength += sentObj.length;
      }
    }
  }
  
  // Sắp xếp lại theo thứ tự xuất hiện ban đầu
  selectedSentences.sort((a, b) => a.index - b.index);
  
  // Ghép câu và kiểm tra tính mạch lạc
  let result = selectedSentences.map(s => s.sentence).join(' ');
  
  // Kiểm tra kết quả có hợp lý không
  if (result.length < 30) { // Quá ngắn
    // Lấy câu đầu tiên đầy đủ
    return sentences[0].trim();
  }
  
  // Nếu kết quả quá giống bản gốc (>85%), cần cắt mạnh hơn
  if (result.length > paragraph.length * 0.85 && targetRatio < 0.6) {
    // Chỉ giữ các câu có điểm cao nhất
    const topSentences = selectedSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(1, Math.ceil(sentences.length * targetRatio)))
      .sort((a, b) => a.index - b.index);
    
    result = topSentences.map(s => s.sentence).join(' ');
  }
  
  return result;
}

// Điều chỉnh tỷ lệ để có sự khác biệt rõ ràng
function getAdjustedRatio(summaryRatio) {
  // Tạo sự khác biệt lớn hơn giữa các mức
  if (summaryRatio <= 0.3) return 0.30;  // 30% -> giữ 30%
  if (summaryRatio <= 0.4) return 0.35;  // 40% -> giữ 35%
  if (summaryRatio <= 0.5) return 0.45;  // 50% -> giữ 45%
  if (summaryRatio <= 0.6) return 0.55;  // 60% -> giữ 55%
  if (summaryRatio <= 0.7) return 0.65;  // 70% -> giữ 65%
  if (summaryRatio <= 0.8) return 0.75;  // 80% -> giữ 75%
  return 0.85; // >80% -> giữ 85%
}

// Gộp các đoạn ngắn khi tóm tắt ở mức thấp
function combineShortParagraphs(paragraphs, originalCount) {
  const combined = [];
  let buffer = "";
  
  for (let i = 0; i < paragraphs.length; i++) {
    if (buffer) {
      buffer += " " + paragraphs[i];
    } else {
      buffer = paragraphs[i];
    }
    
    // Gộp 2-3 đoạn thành 1
    if ((i + 1) % 2 === 0 || i === paragraphs.length - 1) {
      combined.push(buffer);
      buffer = "";
    }
  }
  
  return {
    summarizedParagraphs: combined,
    summary: combined.join('\n\n'),
    originalParagraphCount: originalCount,
    summarizedParagraphCount: combined.length
  };
}

// Xác định số bullets tối đa theo phần trăm
function getMaxBullets(percent) {
  if (percent <= 30) return 3;
  if (percent <= 40) return 4;
  if (percent <= 50) return 5;
  if (percent <= 60) return 6;
  if (percent <= 70) return 7;
  return 10;
}

// Hàm tóm tắt theo từng đoạn văn
export function summarizeByParagraphs(paragraphs, summaryRatio = 0.7) {
  if (!paragraphs || paragraphs.length === 0) return { summarizedParagraphs: [], summary: "" };
  
  const summarizedParagraphs = [];
  
  // Áp dụng tỷ lệ khác nhau cho các phần trăm
  const adjustedRatio = getAdjustedRatio(summaryRatio);
  
  for (const paragraph of paragraphs) {
    if (paragraph && paragraph.trim()) {
      const summarized = summarizeParagraph(paragraph, adjustedRatio);
      
      // Chỉ giữ đoạn nếu nó có nội dung thực sự
      if (summarized && summarized.trim() && summarized.length > 20) {
        summarizedParagraphs.push(summarized);
      }
    }
  }
  
  // Nếu tỷ lệ rất thấp (30-40%), có thể gộp một số đoạn
  if (summaryRatio <= 0.4 && summarizedParagraphs.length > 5) {
    return combineShortParagraphs(summarizedParagraphs, paragraphs.length);
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
  
  // Tính summary ratio từ percent
  const summaryRatio = summaryPercent / 100;
  
  // Tóm tắt theo từng đoạn với ratio đã điều chỉnh
  const { 
    summarizedParagraphs, 
    summary, 
    originalParagraphCount, 
    summarizedParagraphCount 
  } = summarizeByParagraphs(paragraphs, summaryRatio);
  
  // Tạo bullets từ các đoạn tóm tắt
  const maxBullets = getMaxBullets(summaryPercent);
  const bullets = summarizedParagraphs
    .slice(0, maxBullets)
    .map(p => `• ${p}`);
  
  // Tính toán compression ratio chính xác
  const actualRatio = summary.length / (fullContent.length || 1);
  const compressionRatio = Math.round(actualRatio * 100);
  
  return {
    fullContent: fullContent,
    originalParagraphs: paragraphs,
    summarizedParagraphs: summarizedParagraphs,
    summary: summary,
    bullets: bullets,
    stats: {
      originalLength: fullContent.length,
      summaryLength: summary.length,
      compressionRatio: compressionRatio,
      originalParagraphCount: originalParagraphCount,
      summarizedParagraphCount: summarizedParagraphCount,
      summaryPercent: summaryPercent,
      actualPercent: compressionRatio // Phần trăm thực tế
    }
  };
}

// Export hàm extractFullContent cũ cho backward compatibility
export function extractFullContent($) {
  const { fullContent } = extractFullContentWithParagraphs($);
  return fullContent;
}