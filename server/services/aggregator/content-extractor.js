// server/services/aggregator/content-extractor.js

export function extractFullContent($) {
  // Xóa các thành phần không cần thiết
  $("script,style,noscript,iframe,.advertisement,.ads,.banner,.sidebar,.widget,.social-share,.related-news,.comment").remove();
  
  // Meta tags và structured data
  const ogDescription = $("meta[property='og:description']").attr("content") || "";
  const metaDescription = $("meta[name='description']").attr("content") || "";
  const articleLead = $(".sapo, .lead, .description, .chapeau, .article-summary").text().trim();
  
  // Selectors theo từng báo
  const selectors = {
    vnexpress: [".fck_detail", ".article-content", ".content-detail"],
    tuoitre: [".content-detail", ".detail-content", ".detail__content"],
    dantri: [".singular-content", ".detail-content", ".e-magazine__body"],
    thanhnien: [".detail-content", ".content", ".article-body"],
    cafe: [".newscontent", ".detail-content", ".content-detail"],
    vietnamnet: [".ArticleContent", ".article-content", ".content__body"],
    generic: [
      "article", "[itemprop='articleBody']", ".article-body",
      ".entry-content", ".post-content", ".news-content",
      ".main-content", ".story-body", ".text-content"
    ]
  };
  
  let bestContent = "";
  let maxScore = 0;
  
  // Tìm content tốt nhất
  Object.values(selectors).flat().forEach(sel => {
    try {
      $(sel).each((_, el) => {
        const $el = $(el);
        const text = $el.text().trim();
        const paragraphs = $el.find("p").length;
        const links = $el.find("a").length;
        const images = $el.find("img").length;
        
        const score = text.length + (paragraphs * 50) - (links * 10) + (images * 20);
        
        if (score > maxScore && text.length > 200) {
          maxScore = score;
          bestContent = text;
        }
      });
    } catch (e) {}
  });
  
  // Fallback: thu thập từ paragraphs
  if (!bestContent || bestContent.length < 300) {
    const contentParts = [];
    
    if (articleLead && articleLead.length > 50) {
      contentParts.push(articleLead);
    }
    
    $("p").each((_, p) => {
      const text = $(p).text().trim();
      if (text.length > 80 && 
          !text.includes("Xem thêm") && 
          !text.includes("Đọc thêm") &&
          !text.includes("TIN LIÊN QUAN")) {
        contentParts.push(text);
      }
    });
    
    bestContent = contentParts.join(" ");
  }
  
  // Fallback với meta
  if (!bestContent || bestContent.length < 100) {
    bestContent = [ogDescription, metaDescription, articleLead].filter(Boolean).join(" ");
  }
  
  // Làm sạch
  bestContent = bestContent
    .replace(/\s+/g, " ")
    .replace(/Chia sẻ bài viết.*/gi, "")
    .replace(/Xem thêm:.*/gi, "")
    .replace(/TIN LIÊN QUAN.*/gi, "")
    .trim();
  
  return bestContent;
}