import { contentSelectors, leadSelectors } from './selectors.js';

export function extractFullContentWithParagraphs($) {
  // Xóa các thành phần không cần thiết
  $("script,style,noscript,iframe,.advertisement,.ads,.banner,.sidebar,.widget,.social-share,.related-news,.comment,.comments,footer,header,nav,.breadcrumb").remove();
  
  let paragraphs = [];
  let fullContent = "";
  let contentFound = false;

  // Phương pháp 1: Tìm theo selectors cụ thể
  for (const [site, selectors] of Object.entries(contentSelectors)) {
    if (contentFound) break;
    
    const $contents = $(selectors.article);
    
    for (let i = 0; i < $contents.length; i++) {
      const $content = $($contents[i]);
      const textContent = $content.find(selectors.paragraphs).add($content.filter(selectors.paragraphs));
      
      if (textContent.length > 0) {
        textContent.each((j, el) => {
          const text = $(el).text().trim();
          
          if (text && text.length > 20 && 
              !text.includes("Xem thêm:") && 
              !text.includes("Đọc thêm:") &&
              !text.includes("TIN LIÊN QUAN") &&
              !text.includes("Chia sẻ bài viết") &&
              !text.includes("Bình luận")) {
            
            if (!paragraphs.some(p => p.includes(text) || text.includes(p))) {
              paragraphs.push(text);
            }
          }
        });
        
        if (paragraphs.length > 2) {
          contentFound = true;
          break;
        }
      }
    }
  }

  // Phương pháp 2: Text density analysis
  if (paragraphs.length < 3) {
    paragraphs = extractByTextDensity($, paragraphs);
  }

  // Phương pháp 3: Lead/summary extraction
  leadSelectors.forEach(selector => {
    const lead = $(selector).text().trim();
    if (lead && lead.length > 30) {
      if (!paragraphs.some(p => p.includes(lead) || lead.includes(p))) {
        paragraphs.unshift(lead);
      }
    }
  });

  fullContent = paragraphs.join("\n\n");

  // Fallback với meta tags
  if (!fullContent || fullContent.length < 100) {
    fullContent = extractFromMetaTags($);
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

function extractByTextDensity($, existingParagraphs) {
  const allParagraphs = [];
  
  $("p, div, section, article").each((i, el) => {
    const $el = $(el);
    const text = $el.clone().children().remove().end().text().trim();
    
    if (text && text.length > 50) {
      const childText = $el.find("p, div").text().trim();
      
      if (childText && childText.length > text.length * 0.5) {
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
        allParagraphs.push({
          text: text,
          parent: $el.parent().attr('class') || $el.parent().attr('id') || 'unknown'
        });
      }
    }
  });
  
  const groupedByParent = {};
  allParagraphs.forEach(p => {
    const key = p.parent;
    if (!groupedByParent[key]) groupedByParent[key] = [];
    groupedByParent[key].push(p.text);
  });
  
  let maxGroup = [];
  Object.values(groupedByParent).forEach(group => {
    if (group.length > maxGroup.length) {
      maxGroup = group;
    }
  });
  
  const result = [...existingParagraphs];
  maxGroup.forEach(text => {
    if (!result.some(p => p.includes(text) || text.includes(p))) {
      result.push(text);
    }
  });
  
  return result;
}

function extractFromMetaTags($) {
  const ogDescription = $("meta[property='og:description']").attr("content") || "";
  const metaDescription = $("meta[name='description']").attr("content") || "";
  const articleDescription = $("meta[property='article:description']").attr("content") || "";
  
  return [ogDescription, metaDescription, articleDescription]
    .filter(Boolean)
    .join("\n\n");
}

export function extractFullContent($) {
  const { fullContent } = extractFullContentWithParagraphs($);
  return fullContent;
}