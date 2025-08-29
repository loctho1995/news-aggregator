// Định nghĩa selectors cho từng trang báo

export const contentSelectors = {
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
  // Generic fallback
  generic: {
    article: "article, [itemprop='articleBody'], .article-body, .entry-content, .post-content, .news-content, .main-content, .story-body, .text-content, .body-content, .article__body, main",
    paragraphs: "p, .text-content p"
  }
};

export const leadSelectors = [
  ".sapo", ".lead", ".description", ".chapeau", ".article-summary",
  ".excerpt", ".intro", ".abstract", "[class*='lead']", "[class*='summary']"
];