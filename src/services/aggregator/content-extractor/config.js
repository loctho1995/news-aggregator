// Configuration and constants - COMPREHENSIVE VERSION

export const CONTENT_SELECTORS = {
    // Vietnamese news sites
    vnexpress: {
      article: ".fck_detail, article.fck, .sidebar-1, .content-detail, article[type='article'], .article-content",
      paragraphs: "p.Normal, p:not(.Image):not(.caption), .description, div.Normal"
    },
    tuoitre: {
      article: ".content-detail, .detail-content, .detail__content, .VCSortableInPreviewMode, article.article-content",
      paragraphs: "p, div.VCSortableInPreviewMode, .content-detail p"
    },
    dantri: {
      article: ".singular-content, .detail-content, .e-magazine__body, .dt-news__content, article.singular-container",
      paragraphs: "p, .dt-news__content p, .singular-content p"
    },
    thanhnien: {
      article: ".detail-content, .content, .article-body, .cms-body, .pswp-content__main",
      paragraphs: "p, .cms-body p, .detail-content p"
    },
    cafe: {
      article: ".newscontent, .detail-content, .content-detail, .knc-content, .detail-news, .contentdetail",
      paragraphs: "p, .knc-content p, .newscontent p"
    },
    vietnamnet: {
      article: ".ArticleContent, .article-content, .content__body, .maincontent, .ArticleDetail",
      paragraphs: "p, .maincontent p, .ArticleContent p"
    },
    laodong: {
      article: ".article-content, .the-article-body, .article-body, .content",
      paragraphs: "p, .article-content p"
    },
    vietstock: {
      article: ".content-detail, .article-content, .post-content, .content",
      paragraphs: "p, li, .content-detail p"
    },
    vneconomy: {
      article: ".detail-content, .content-detail, .article-body, .detail",
      paragraphs: "p, .detail-content p"
    },
    cafef: {
      article: ".contentdetail, .content-detail, .newscontent, .content",
      paragraphs: "p, .contentdetail p"
    },
    
    // International sites
    bloomberg: {
      article: "article, .article-content, .body-content, main",
      paragraphs: "p, .paragraph"
    },
    reuters: {
      article: "article, .article-body, .StandardArticleBody, .ArticleBody",
      paragraphs: "p, .paragraph"
    },
    wsj: {
      article: "article, .article-content, .wsj-snippet-body, main",
      paragraphs: "p, .paragraph"
    },
    
    // Generic patterns for any site
    generic: {
      article: "article, [role='article'], [itemprop='articleBody'], .article-body, .article-content, .entry-content, .post-content, .news-content, .content-body, .main-content, .story-body, .text-content, .body-content, .article__body, .content, .post, .entry, main, #content",
      paragraphs: "p, .paragraph, .text-block, .content p"
    }
  };
  
  // Extended lead selectors
  export const LEAD_SELECTORS = [
    ".sapo", ".lead", ".description", ".chapeau", ".article-summary",
    ".excerpt", ".intro", ".abstract", ".summary", ".deck",
    "[class*='lead']", "[class*='summary']", "[class*='description']",
    "h2.description", "h2.sapo", ".article-lead", ".post-excerpt",
    ".entry-summary", ".standfirst", ".kicker"
  ];
  
  // More comprehensive unwanted selectors
  export const UNWANTED_SELECTORS = [
    "script", "style", "noscript", "iframe",
    ".advertisement", ".ads", ".ad", ".banner", ".sponsor",
    ".sidebar", ".widget", ".social-share", ".social", ".share-buttons",
    ".related-news", ".related", ".see-more", ".read-more",
    ".comment", ".comments", ".disqus", "#disqus_thread",
    "footer", "header", "nav", ".navigation", ".breadcrumb",
    ".box-category", ".box-tinlienquan", ".box-tag", ".tags",
    ".author-info", ".author-bio", ".meta", ".metadata",
    ".newsletter", ".subscribe", ".popup", ".modal",
    ".video-js", ".video-player", ".jwplayer",
    "[class*='banner']", "[class*='promotion']", "[id*='ads']",
    ".footer", ".header", ".menu", ".nav"
  ].join(',');
  
  // Unwanted text patterns
  export const UNWANTED_TEXT = [
    "Xem thêm:", "Đọc thêm:", "TIN LIÊN QUAN", 
    "Chia sẻ bài viết", "Bình luận", "Theo dõi", 
    "Click", "Nhấn vào", ">> Xem thêm", "Nguồn:",
    "Đăng ký", "Subscribe", "Newsletter",
    "Copyright", "©", "All rights reserved",
    "Quảng cáo", "Advertisement", "Sponsored",
    "Theo dõi chúng tôi", "Follow us", "Fanpage"
  ];