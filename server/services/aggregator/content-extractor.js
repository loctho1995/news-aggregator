// server/services/aggregator/content-extractor.js
// Trích xuất và tóm tắt nội dung từ HTML

// Trích xuất nội dung đầy đủ với các đoạn văn
export function extractFullContentWithParagraphs($) {
  // Xóa các thành phần không cần thiết
  $("script,style,noscript,iframe,.advertisement,.ads,.banner,.sidebar,.widget,.social-share,.related-news,.comment,.comments,footer,header,nav,.breadcrumb").remove();
  
  // Danh sách selectors ưu tiên cho từng trang báo (mở rộng và cải thiện)
  const contentSelectors = {
    // VnExpress
    vnexpress: {
      article: ".fck_detail, .article-content, .content-detail, .Normal",
      paragraphs: "p:not(.Image):not(.caption), .Normal"
    },
    // Tuổi Trẻ
    tuoitre: {
      article: ".content-detail, .detail-content, .detail__content, .VCSortableInPreviewMode",
      paragraphs: "p, div.VCSortableInPreviewMode"
    },
    // Dân Trí
    dantri: {
      article: ".singular-content, .detail-content, .e-magazine__body, .dt-news__content",
      paragraphs: "p, .dt-news__content p"
    },
    // Thanh Niên
    thanhnien: {
      article: ".detail-content, .content, .article-body, .cms-body",
      paragraphs: "p, .cms-body p"
    },
    // CafeF/CafeBiz
    cafe: {
      article: ".newscontent, .detail-content, .content-detail, .knc-content",
      paragraphs: "p, .knc-content p"
    },
    // VietnamNet
    vietnamnet: {
      article: ".ArticleContent, .article-content, .content__body, .maincontent",
      paragraphs: "p, .maincontent p"
    },
    // Lao Động
    laodong: {
      article: ".article-content, .the-article-body",
      paragraphs: "p"
    },
    // Generic fallback (mở rộng)
    generic: {
      article: "article, [itemprop='articleBody'], .article-body, .entry-content, .post-content, .news-content, .main-content, .story-body, .text-content, .body-content, .article__body, main",
      paragraphs: "p, .text-content p"
    }
  };

  let paragraphs = [];
  let fullContent = "";
  let contentFound = false;

  // Thử tìm content với nhiều phương pháp
  // Phương pháp 1: Tìm theo selectors cụ thể
  for (const [site, selectors] of Object.entries(contentSelectors)) {
    if (contentFound) break;
    
    const $contents = $(selectors.article);
    
    for (let i = 0; i < $contents.length; i++) {
      const $content = $($contents[i]);
      
      // Lấy TẤT CẢ text nodes và paragraphs
      const textContent = $content.find(selectors.paragraphs).add($content.filter(selectors.paragraphs));
      
      if (textContent.length > 0) {
        textContent.each((j, el) => {
          const text = $(el).text().trim();
          
          // Lọc nội dung hợp lệ (giảm ngưỡng để lấy nhiều content hơn)
          if (text && text.length > 20 && 
              !text.includes("Xem thêm:") && 
              !text.includes("Đọc thêm:") &&
              !text.includes("TIN LIÊN QUAN") &&
              !text.includes("Chia sẻ bài viết") &&
              !text.includes("Bình luận")) {
            
            // Tránh duplicate
            if (!paragraphs.some(p => p.includes(text) || text.includes(p))) {
              paragraphs.push(text);
            }
          }
        });
        
        if (paragraphs.length > 2) { // Cần ít nhất 3 đoạn để coi là tìm thấy content
          contentFound = true;
          break;
        }
      }
    }
  }

  // Phương pháp 2: Nếu vẫn ít content, thử tìm theo text density
  if (paragraphs.length < 3) {
    const allParagraphs = [];
    
    // Tìm tất cả các khối text
    $("p, div, section, article").each((i, el) => {
      const $el = $(el);
      const text = $el.clone()
        .children()
        .remove()
        .end()
        .text()
        .trim();
      
      // Chỉ lấy khối có đủ text
      if (text && text.length > 50) {
        const childText = $el.find("p, div").text().trim();
        
        // Nếu là container (có child elements với text)
        if (childText && childText.length > text.length * 0.5) {
          // Lấy từng paragraph con
          $el.find("p").each((j, p) => {
            const pText = $(p).text().trim();
            if (pText && pText.length > 30) {
              allParagraphs.push({
                text: pText,
                parent: $el.attr('class') || $el.attr('id') || 'unknown'
              });
            }
          });
        } else if (text.length > 50) {
          // Là text node trực tiếp
          allParagraphs.push({
            text: text,
            parent: $el.parent().attr('class') || $el.parent().attr('id') || 'unknown'
          });
        }
      }
    });
    
    // Nhóm theo parent và chọn nhóm lớn nhất
    const groupedByParent = {};
    allParagraphs.forEach(p => {
      const key = p.parent;
      if (!groupedByParent[key]) groupedByParent[key] = [];
      groupedByParent[key].push(p.text);
    });
    
    // Tìm nhóm có nhiều content nhất
    let maxGroup = [];
    Object.values(groupedByParent).forEach(group => {
      if (group.length > maxGroup.length) {
        maxGroup = group;
      }
    });
    
    // Thêm vào paragraphs nếu chưa có
    maxGroup.forEach(text => {
      if (!paragraphs.some(p => p.includes(text) || text.includes(p))) {
        paragraphs.push(text);
      }
    });
  }

  // Phương pháp 3: Lấy thêm lead/summary/description
  const leadSelectors = [
    ".sapo", ".lead", ".description", ".chapeau", ".article-summary",
    ".excerpt", ".intro", ".abstract", "[class*='lead']", "[class*='summary']"
  ];
  
  leadSelectors.forEach(selector => {
    const lead = $(selector).text().trim();
    if (lead && lead.length > 30) {
      // Thêm vào đầu nếu chưa có
      if (!paragraphs.some(p => p.includes(lead) || lead.includes(p))) {
        paragraphs.unshift(lead);
      }
    }
  });

  // Ghép thành fullContent
  fullContent = paragraphs.join("\n\n");

  // Nếu vẫn quá ít content, thử lấy tất cả text có structure
  if (fullContent.length < 500) {
    const bodyText = $("body").text()
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    // Tìm phần text dài nhất liên tục
    const chunks = bodyText.split(/\n\n+/);
    const longChunks = chunks
      .filter(c => c.length > 100)
      .sort((a, b) => b.length - a.length)
      .slice(0, 10); // Lấy 10 đoạn dài nhất
    
    if (longChunks.length > 0) {
      fullContent = longChunks.join("\n\n");
      paragraphs = longChunks;
    }
  }

  // Fallback cuối cùng với meta tags
  if (!fullContent || fullContent.length < 100) {
    const ogDescription = $("meta[property='og:description']").attr("content") || "";
    const metaDescription = $("meta[name='description']").attr("content") || "";
    const articleDescription = $("meta[property='article:description']").attr("content") || "";
    
    fullContent = [ogDescription, metaDescription, articleDescription]
      .filter(Boolean)
      .join("\n\n");
    
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

// Hàm tóm tắt thông minh cho card description
export function createSmartSummary(fullText, maxLength = 250) {
  if (!fullText || fullText.length < 50) return fullText || "";
  
  // Tách câu
  const sentences = fullText.match(/[^.!?…]+[.!?…]+/g) || [fullText];
  
  // Tính điểm cho mỗi câu để tìm câu quan trọng nhất
  const scoredSentences = sentences.map((sentence, index) => {
    let score = 0;
    const cleanSent = sentence.trim();
    
    // Ưu tiên câu có thông tin cụ thể
    if (/\d+[%]?/.test(cleanSent)) score += 5; // Số liệu
    if (/triệu|tỷ|nghìn|USD|VND|đồng/.test(cleanSent)) score += 4; // Tiền tệ
    if (/tăng|giảm|phát triển|sụt|tụt/.test(cleanSent)) score += 3; // Xu hướng
    if (/["'"]/.test(cleanSent)) score += 3; // Trích dẫn
    if (/theo|cho biết|khẳng định|tuyên bố/.test(cleanSent)) score += 2; // Nguồn
    
    // Vị trí quan trọng
    if (index === 0) score += 4; // Câu đầu
    if (index === 1) score += 2; // Câu thứ 2
    
    // Độ dài phù hợp (không quá ngắn, không quá dài)
    if (cleanSent.length > 50 && cleanSent.length < 150) score += 2;
    
    return { sentence: cleanSent, score, index };
  });
  
  // Sắp xếp theo điểm
  scoredSentences.sort((a, b) => b.score - a.score);
  
  // Xây dựng summary
  let summary = "";
  let usedIndexes = new Set();
  
  // Lấy câu quan trọng nhất
  if (scoredSentences.length > 0) {
    summary = scoredSentences[0].sentence;
    usedIndexes.add(scoredSentences[0].index);
  }
  
  // Thêm câu bổ sung nếu còn chỗ
  for (let i = 1; i < scoredSentences.length && summary.length < maxLength - 50; i++) {
    const sent = scoredSentences[i];
    
    // Tránh câu liền kề để tạo tính tóm tắt
    if (!usedIndexes.has(sent.index - 1) && !usedIndexes.has(sent.index + 1)) {
      const newSummary = summary + " " + sent.sentence;
      
      if (newSummary.length <= maxLength) {
        summary = newSummary;
        usedIndexes.add(sent.index);
      } else {
        // Nếu quá dài, thử cắt bớt câu
        const words = sent.sentence.split(' ');
        const remainingSpace = maxLength - summary.length - 10;
        const wordsToTake = Math.floor(remainingSpace / 6); // Ước tính 6 ký tự/từ
        
        if (wordsToTake > 5) {
          summary += " " + words.slice(0, wordsToTake).join(' ') + "...";
        }
        break;
      }
    }
  }
  
  // Đảm bảo không vượt quá maxLength
  if (summary.length > maxLength) {
    // Cắt tại câu hoàn chỉnh gần nhất
    const cutPoint = summary.lastIndexOf('.', maxLength - 3);
    if (cutPoint > maxLength * 0.6) {
      summary = summary.substring(0, cutPoint + 1);
    } else {
      // Cắt tại từ gần nhất
      const words = summary.substring(0, maxLength - 3).split(' ');
      summary = words.slice(0, -1).join(' ') + '...';
    }
  }
  
  return summary.trim();
}

// Hàm tạo bullet point summary cho card
export function createBulletPointSummary(fullText, maxBullets = 3) {
  if (!fullText || fullText.length < 50) {
    return {
      bullets: [fullText || "Không có nội dung"],
      text: fullText || ""
    };
  }
  
  // Tách câu - hỗ trợ cả tiếng Việt và tiếng Anh
  const sentences = fullText.match(/[^.!?…]+[.!?…]+/g) || 
                   fullText.split(/[.!?]\s+/).filter(s => s.trim()) ||
                   [fullText];
  
  // Tính điểm cho mỗi câu để tìm câu quan trọng nhất
  const scoredSentences = sentences.map((sentence, index) => {
    let score = 0;
    const cleanSent = sentence.trim().replace(/^[-•●○■□▪▫◦‣⁃]\s*/, '');
    
    // Bỏ qua câu quá ngắn
    if (cleanSent.length < 20) return { sentence: cleanSent, score: -10, index };
    
    // Ưu tiên câu có thông tin cụ thể
    if (/\d+[%]?/.test(cleanSent)) score += 6; // Số liệu
    if (/triệu|tỷ|nghìn|USD|VND|đồng|\$|€/.test(cleanSent)) score += 5; // Tiền tệ
    if (/tăng|giảm|phát triển|sụt|tụt|mở rộng|thu hẹp/.test(cleanSent)) score += 4; // Xu hướng
    if (/năm \d{4}|tháng \d{1,2}|quý [1-4]|Q[1-4]/.test(cleanSent)) score += 3; // Thời gian cụ thể
    if (/theo|cho biết|khẳng định|tuyên bố|công bố/.test(cleanSent)) score += 3; // Nguồn tin
    if (/["'"]/.test(cleanSent)) score += 3; // Trích dẫn
    if (/nhằm|để|với mục tiêu|với mục đích/.test(cleanSent)) score += 2; // Mục đích
    
    // Từ khóa quan trọng
    const importantWords = /quan trọng|chính|mới|đầu tiên|lớn nhất|cao nhất|thấp nhất|kỷ lục|đột phá|then chốt|quyết định|cốt lõi/gi;
    const matches = cleanSent.match(importantWords);
    if (matches) score += matches.length * 2;
    
    // Vị trí câu
    if (index === 0) score += 5; // Câu đầu quan trọng nhất
    if (index === 1) score += 3; // Câu thứ 2
    if (index === sentences.length - 1) score += 2; // Câu cuối (kết luận)
    
    // Độ dài phù hợp cho bullet (không quá ngắn, không quá dài)
    if (cleanSent.length > 40 && cleanSent.length < 150) score += 3;
    else if (cleanSent.length > 150 && cleanSent.length < 200) score += 1;
    else if (cleanSent.length >= 200) score -= 2; // Câu quá dài cho bullet
    
    // Penalize câu chứa từ không mong muốn
    if (/Xem thêm|Đọc thêm|Chia sẻ|Bình luận|Theo dõi|Click|Nhấn vào/.test(cleanSent)) score -= 10;
    
    return { 
      sentence: cleanSent, 
      score, 
      index,
      length: cleanSent.length 
    };
  });
  
  // Lọc và sắp xếp theo điểm
  const validSentences = scoredSentences
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);
  
  // Nếu không có câu hợp lệ, lấy câu đầu
  if (validSentences.length === 0) {
    const firstSent = sentences[0] ? sentences[0].trim() : fullText.substring(0, 150) + '...';
    return {
      bullets: [firstSent],
      text: firstSent
    };
  }
  
  // Chọn bullets
  const bullets = [];
  const usedIndexes = new Set();
  const selectedSentences = [];
  
  // Lấy câu quan trọng nhất
  for (const sentObj of validSentences) {
    // Tránh câu liền kề để tạo tính đa dạng
    let tooClose = false;
    for (const usedIdx of usedIndexes) {
      if (Math.abs(sentObj.index - usedIdx) <= 1) {
        tooClose = true;
        break;
      }
    }
    
    // Nếu đã có 1 bullet và câu này quá gần, skip (trừ khi rất quan trọng)
    if (bullets.length > 0 && tooClose && sentObj.score < 10) continue;
    
    // Xử lý câu dài
    let bulletText = sentObj.sentence;
    if (bulletText.length > 180) {
      // Cắt tại dấu phẩy hoặc chấm phẩy gần nhất
      const cutPoints = [
        bulletText.lastIndexOf(',', 150),
        bulletText.lastIndexOf(';', 150),
        bulletText.lastIndexOf(' và ', 150),
        bulletText.lastIndexOf(' hoặc ', 150),
        bulletText.lastIndexOf(' nhưng ', 150)
      ].filter(pos => pos > 80);
      
      if (cutPoints.length > 0) {
        const cutAt = Math.max(...cutPoints);
        bulletText = bulletText.substring(0, cutAt) + '...';
      } else {
        // Cắt tại từ gần nhất
        const words = bulletText.substring(0, 150).split(' ');
        bulletText = words.slice(0, -1).join(' ') + '...';
      }
    }
    
    bullets.push(bulletText);
    selectedSentences.push(sentObj);
    usedIndexes.add(sentObj.index);
    
    if (bullets.length >= maxBullets) break;
  }
  
  // Nếu chưa đủ bullets và còn câu, thêm câu theo thứ tự
  if (bullets.length < maxBullets) {
    for (const sent of sentences.slice(0, 10)) {
      const cleanSent = sent.trim().replace(/^[-•●○■□▪▫◦‣⁃]\s*/, '');
      
      // Check if already used
      const alreadyUsed = bullets.some(b => 
        b.includes(cleanSent.substring(0, 50)) || 
        cleanSent.includes(b.substring(0, 50))
      );
      
      if (!alreadyUsed && cleanSent.length > 30 && cleanSent.length < 200) {
        bullets.push(cleanSent.length > 180 ? 
          cleanSent.substring(0, 150) + '...' : 
          cleanSent
        );
        
        if (bullets.length >= maxBullets) break;
      }
    }
  }
  
  // Nếu vẫn ít hơn yêu cầu, tách đoạn đầu thành bullets
  if (bullets.length < maxBullets && fullText.length > 200) {
    const chunks = fullText.substring(0, 500).split(/[.!?]\s+/);
    for (const chunk of chunks) {
      if (bullets.length >= maxBullets) break;
      
      const cleanChunk = chunk.trim();
      if (cleanChunk.length > 30 && !bullets.some(b => b.includes(cleanChunk.substring(0, 30)))) {
        bullets.push(cleanChunk.length > 180 ? 
          cleanChunk.substring(0, 150) + '...' : 
          cleanChunk
        );
      }
    }
  }
  
  // Format bullets với dấu • đơn giản
  const formattedBullets = bullets.map((bullet) => {
    return `• ${bullet}`;
  });
  
  return {
    bullets: formattedBullets,
    text: bullets.join('. ') // Text version for backward compatibility
  };
}

// Export hàm extractFullContent cũ cho backward compatibility
export function extractFullContent($) {
  const { fullContent } = extractFullContentWithParagraphs($);
  return fullContent;
}