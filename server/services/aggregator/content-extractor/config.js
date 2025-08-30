// Configuration and constants

export const CONTENT_SELECTORS = {
  vnexpress: {
    article: ".fck_detail, .article-content, .content-detail, .Normal",
    paragraphs: "p:not(.Image):not(.caption), .Normal"
  },
  tuoitre: {
    article: ".content-detail, .detail-content, .detail__content, .VCSortableInPreviewMode",
    paragraphs: "p, div.VCSortableInPreviewMode"
  },
  dantri: {
    article: ".singular-content, .detail-content, .e-magazine__body, .dt-news__content",
    paragraphs: "p, .dt-news__content p"
  },
  thanhnien: {
    article: ".detail-content, .content, .article-body, .cms-body",
    paragraphs: "p, .cms-body p"
  },
  cafe: {
    article: ".newscontent, .detail-content, .content-detail, .knc-content",
    paragraphs: "p, .knc-content p"
  },
  vietnamnet: {
    article: ".ArticleContent, .article-content, .content__body, .maincontent",
    paragraphs: "p, .maincontent p"
  },
  laodong: {
    article: ".article-content, .the-article-body",
    paragraphs: "p"
  },
  generic: {
    article: "article, [itemprop='articleBody'], .article-body, .entry-content, .post-content, .news-content, .main-content, .story-body, .text-content, .body-content, .article__body, main",
    paragraphs: "p, .text-content p"
  }
};

export const LEAD_SELECTORS = [
  ".sapo", ".lead", ".description", ".chapeau", ".article-summary",
  ".excerpt", ".intro", ".abstract", "[class*='lead']", "[class*='summary']"
];

export const UNWANTED_SELECTORS = 
  "script,style,noscript,iframe,.advertisement,.ads,.banner,.sidebar,.widget,.social-share,.related-news,.comment,.comments,footer,header,nav,.breadcrumb";

export const UNWANTED_TEXT = [
  "Xem thêm:", "Đọc thêm:", "TIN LIÊN QUAN", 
  "Chia sẻ bài viết", "Bình luận", "Theo dõi", 
  "Click", "Nhấn vào"
];