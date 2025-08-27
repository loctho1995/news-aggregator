import express from "express";
import cors from "cors";
import pino from "pino";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";
import { fetchAll, listSources } from "./src/aggregator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || "info" });

app.use(cors());
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/api/healthz", (req, res) => res.json({ ok: true }));
app.get("/api/sources", (req, res) => res.json({ sources: listSources() }));

app.get("/api/news", async (req, res) => {
  const hours = Math.max(1, Math.min(parseInt(req.query.hours || "24", 10), 168));
  const include = String(req.query.sources || "").split(",").map((s) => s.trim()).filter(Boolean);
  const limitPerSource = Math.max(1, Math.min(parseInt(req.query.limit || "30", 10), 100));
  try {
    const items = await fetchAll({ include, hours, limitPerSource });
    res.json({ generatedAt: new Date().toISOString(), count: items.length, items });
  } catch (e) {
    logger.error(e);
    res.status(500).json({ error: e.message || "Unknown error" });
  }
});

const SUM_CACHE = new Map();
const TTL_MS = 30 * 60 * 1000;
const cacheGet = k => { const v = SUM_CACHE.get(k); if (!v) return null; if (Date.now()-v.ts>TTL_MS){SUM_CACHE.delete(k); return null;} return v.data; };
const cacheSet = (k,d) => SUM_CACHE.set(k,{ts:Date.now(), data:d});

function extractMainContent($) {
  // KIỂM TRA PAYWALL/ĐĂNG KÝ TRƯỚC
  const paywallIndicators = [
    "vui lòng nhập email",
    "vui lòng đăng nhập", 
    "đăng ký để đọc",
    "mã xác nhận",
    "subscription required",
    "please login",
    "member only"
  ];
  
  const bodyText = $("body").text().toLowerCase();
  const hasPaywall = paywallIndicators.some(indicator => bodyText.includes(indicator));
  
  // Nếu có paywall, thử bypass
  if (hasPaywall) {
    console.log("Detected paywall/registration form, attempting bypass...");
    
    // Xóa overlay, modal, popup
    $(".modal, .popup, .overlay, .paywall, .subscription-box, .register-form").remove();
    $("[class*='modal'], [class*='popup'], [class*='overlay']").remove();
    $("[id*='modal'], [id*='popup'], [id*='overlay']").remove();
    
    // Xóa form đăng ký
    $("form").each((_, form) => {
      const $form = $(form);
      const formText = $form.text().toLowerCase();
      if (formText.includes("email") || formText.includes("đăng ký") || formText.includes("xác nhận")) {
        $form.remove();
      }
    });
    
    // Hiển thị content bị ẩn
    $(".content, .article-content, [class*='content']").css({
      'display': 'block',
      'visibility': 'visible',
      'overflow': 'visible',
      'height': 'auto',
      'max-height': 'none'
    });
    
    // Xóa blur effect
    $("*").each((_, el) => {
      const $el = $(el);
      const style = $el.attr("style") || "";
      if (style.includes("blur") || style.includes("opacity")) {
        $el.css({
          'filter': 'none',
          'opacity': '1'
        });
      }
    });
  }
  
  // Xóa TẤT CẢ các thành phần không phải nội dung chính
  $(
    "script, style, noscript, iframe, " +
    ".advertisement, .ads, .banner, .sidebar, .widget, " +
    ".social-share, .related-news, .comment, .comments, " +
    ".tags, .tag, .keyword, .keywords, .topic-keywords, " +
    ".author-info, .source-info, .copyright, " +
    ".navigation, .breadcrumb, .menu, " +
    ".share-button, .reaction, .like-button, " +
    ".video-list, .photo-list, .most-viewed, " +
    ".box-tinlienquan, .box-category, .box-news-other, " +
    ".register-form, .login-form, .subscription-form" // Thêm xóa form
  ).remove();
  
  // XÓA các element chứa text "Từ khóa", "Tags", etc.
  $("*").each((_, el) => {
    const $el = $(el);
    const text = $el.text().toLowerCase();
    if (text.startsWith("từ khóa:") || 
        text.startsWith("tags:") || 
        text.startsWith("chủ đề:") ||
        text.startsWith("tin liên quan") ||
        text.startsWith("xem thêm")) {
      $el.remove();
    }
  });
  
  // PHƯƠNG PHÁP 1: Tìm theo meta tags và structured data
  const ogDescription = $("meta[property='og:description']").attr("content") || "";
  const metaDescription = $("meta[name='description']").attr("content") || "";
  const articleLead = $(".sapo, .lead, .description, .chapeau, .article-summary").text().trim();
  
  // PHƯƠNG PHÁP 2: Selector cụ thể cho các trang báo VN
  const selectors = {
    // VnExpress
    vnexpress: [".fck_detail", ".article-content", ".content-detail"],
    // Tuổi Trẻ  
    tuoitre: [".content-detail", ".detail-content", ".detail__content"],
    // Dân Trí
    dantri: [".singular-content", ".detail-content", ".e-magazine__body"],
    // Thanh Niên
    thanhnien: [".detail-content", ".content", ".article-body"],
    // CafeF/CafeBiz
    cafe: [".newscontent", ".detail-content", ".content-detail"],
    // VietnamNet
    vietnamnet: [".ArticleContent", ".article-content", ".content__body"],
    // Generic
    generic: [
      "article > div:not(.tags):not(.keywords)",
      "[itemprop='articleBody']",
      ".article-body", ".entry-content", ".post-content",
      ".news-content", ".main-content", ".story-body"
    ]
  };
  
  let bestContent = "";
  let maxScore = 0;
  
  // Tìm content container tốt nhất
  Object.values(selectors).flat().forEach(sel => {
    try {
      $(sel).each((_, el) => {
        const $el = $(el);
        
        // Loại bỏ các phần không mong muốn TRONG element
        $el.find(".tags, .keywords, .topic-keywords, .author-bio, .source").remove();
        
        const text = $el.text().trim();
        const paragraphs = $el.find("p").length;
        const links = $el.find("a").length;
        const images = $el.find("img").length;
        
        // Tính điểm: ưu tiên nội dung có nhiều đoạn văn, ít link
        const score = text.length + (paragraphs * 100) - (links * 20) + (images * 30);
        
        // Kiểm tra không phải menu/sidebar (tỷ lệ link/text thấp)
        const linkRatio = links / Math.max(1, text.length / 100);
        
        if (score > maxScore && text.length > 200 && linkRatio < 3) {
          maxScore = score;
          bestContent = text;
        }
      });
    } catch (e) {}
  });
  
  // PHƯƠNG PHÁP 3: Thu thập paragraphs nếu không tìm thấy container
  if (!bestContent || bestContent.length < 300) {
    const contentParts = [];
    
    // Thêm lead/sapo nếu có
    if (articleLead && articleLead.length > 50 && !articleLead.includes("Từ khóa")) {
      contentParts.push(articleLead);
    }
    
    // Thu thập paragraphs chính
    $("p").each((_, p) => {
      const $p = $(p);
      const parent = $p.parent();
      
      // Bỏ qua nếu parent là tags/keywords
      if (parent.hasClass("tags") || parent.hasClass("keywords")) return;
      
      const text = $p.text().trim();
      
      // Chỉ lấy paragraph có nội dung thực sự
      if (text.length > 60 && 
          !text.toLowerCase().includes("từ khóa") &&
          !text.toLowerCase().includes("tags:") &&
          !text.toLowerCase().includes("xem thêm") && 
          !text.toLowerCase().includes("đọc thêm") &&
          !text.toLowerCase().includes("tin liên quan") &&
          !text.toLowerCase().includes("bình luận") &&
          !text.toLowerCase().includes("chia sẻ")) {
        contentParts.push(text);
      }
    });
    
    bestContent = contentParts.join(" ");
  }
  
  // PHƯƠNG PHÁP 4: Fallback với meta nếu vẫn không có
  if (!bestContent || bestContent.length < 100) {
    bestContent = [ogDescription, metaDescription, articleLead]
      .filter(text => text && !text.includes("Từ khóa"))
      .join(" ");
  }
  
  // Làm sạch content TRIỆT ĐỂ
  bestContent = bestContent
    .replace(/\s+/g, " ")
    .replace(/(\r\n|\n|\r)/gm, " ")
    // Xóa phần từ khóa và các pattern liên quan
    .replace(/Từ khóa[:\s].*/gi, "")
    .replace(/Tags?[:\s].*/gi, "")
    .replace(/Chủ đề[:\s].*/gi, "")
    .replace(/Hashtag[:\s].*/gi, "")
    // Xóa các phần không mong muốn khác
    .replace(/Chia sẻ bài viết.*/gi, "")
    .replace(/Xem thêm[:\s].*/gi, "")
    .replace(/Đọc thêm[:\s].*/gi, "")
    .replace(/TIN LIÊN QUAN.*/gi, "")
    .replace(/Tin cùng chuyên mục.*/gi, "")
    .replace(/Bài viết liên quan.*/gi, "")
    .replace(/Bình luận.*/gi, "")
    .replace(/\[.*?\]/g, "") // [Photo], [Video]
    .replace(/\(Ảnh:.*?\)/gi, "")
    .replace(/Nguồn:.*$/gi, "")
    .replace(/Theo\s+[A-Z][^.]{0,30}$/gi, "")
    .trim();
  
  console.log(`Extracted content: ${bestContent.length} chars (score: ${maxScore})`);
  return bestContent;
}

function splitSentencesNoLookbehind(text) {
  const parts = text.match(/[^.!?…]+(?:[.!?…]+|$)/g) || [];
  return parts.map(s => s.trim()).filter(Boolean);
}

// TÓM TẮT THÔNG MINH: Lấy những ý chính quan trọng
function summarizeToBullets(fullText) {
  // Nếu text quá ngắn
  if (!fullText || fullText.length < 30) {
    console.log(`Text too short: ${fullText?.length || 0} chars`);
    return [`(Không thể trích xuất nội dung từ trang này)`];
  }
  
  // Nếu text ngắn (30-200 ký tự), trả về nguyên văn
  if (fullText.length < 200) {
    return [fullText];
  }
  
  // Tách câu và lọc sạch
  const sentences = splitSentencesNoLookbehind(fullText)
    .filter(s => {
      const clean = s.trim();
      // Loại câu quá ngắn hoặc chứa từ khóa không mong muốn
      return clean.length > 30 && 
             !clean.toLowerCase().includes("từ khóa") &&
             !clean.toLowerCase().includes("xem thêm") &&
             !clean.toLowerCase().includes("đọc thêm");
    });
  
  if (sentences.length === 0) {
    return [fullText.slice(0, 300) + (fullText.length > 300 ? "..." : "")];
  }
  
  // Nếu ít câu, trả về từng câu
  if (sentences.length <= 3) {
    return sentences;
  }
  
  // THUẬT TOÁN TÓM TẮT Ý CHÍNH
  const mainPoints = [];
  const processedIndexes = new Set();
  
  // 1. Tìm câu mở đầu quan trọng (thường là 1-2 câu đầu)
  for (let i = 0; i < Math.min(2, sentences.length); i++) {
    if (sentences[i].length > 50) {
      mainPoints.push({
        text: sentences[i],
        index: i,
        type: 'intro',
        score: 100 - i * 10 // Câu đầu quan trọng hơn
      });
      processedIndexes.add(i);
    }
  }
  
  // 2. Tìm các câu chứa số liệu, phần trăm (thường là ý chính)
  sentences.forEach((s, i) => {
    if (!processedIndexes.has(i)) {
      const hasNumbers = /\d+[\s]*(tỷ|triệu|nghìn|%|phần trăm|USD|VND|đồng)/i.test(s);
      const hasQuotes = /"[^"]{20,}"/.test(s) || /["""][^"""]{20,}["""]/.test(s);
      
      if (hasNumbers || hasQuotes) {
        mainPoints.push({
          text: s,
          index: i,
          type: hasNumbers ? 'data' : 'quote',
          score: 80
        });
        processedIndexes.add(i);
      }
    }
  });
  
  // 3. Tìm câu có từ khóa quan trọng (kết luận, quan trọng, chính)
  const importantKeywords = [
    /^(Theo|Ông|Bà|PGS|TS|BS|Luật sư|Chuyên gia)/i,
    /quan trọng|chủ yếu|chính là|điểm nổi bật|đáng chú ý/i,
    /kết luận|tóm lại|như vậy|do đó|vì thế/i,
    /tuy nhiên|mặt khác|ngược lại|trong khi đó/i,
    /đầu tiên|thứ hai|thứ ba|cuối cùng/i
  ];
  
  sentences.forEach((s, i) => {
    if (!processedIndexes.has(i)) {
      for (const pattern of importantKeywords) {
        if (pattern.test(s)) {
          mainPoints.push({
            text: s,
            index: i,
            type: 'keyword',
            score: 70
          });
          processedIndexes.add(i);
          break;
        }
      }
    }
  });
  
  // 4. Tìm câu kết (thường ở cuối)
  for (let i = sentences.length - 2; i < sentences.length; i++) {
    if (i >= 0 && !processedIndexes.has(i) && sentences[i].length > 50) {
      mainPoints.push({
        text: sentences[i],
        index: i,
        type: 'conclusion',
        score: 60
      });
      processedIndexes.add(i);
    }
  }
  
  // 5. Bổ sung thêm câu quan trọng nếu còn thiếu
  if (mainPoints.length < 5) {
    sentences.forEach((s, i) => {
      if (!processedIndexes.has(i) && s.length > 100 && mainPoints.length < 10) {
        mainPoints.push({
          text: s,
          index: i,
          type: 'additional',
          score: 50
        });
      }
    });
  }
  
  // Sắp xếp theo thứ tự xuất hiện trong bài (giữ logic)
  mainPoints.sort((a, b) => a.index - b.index);
  
  // Gộp các câu liên quan thành bullets
  const finalBullets = [];
  let currentBullet = "";
  let lastIndex = -1;
  
  for (const point of mainPoints) {
    // Nếu câu liền kề và có liên kết logic, gộp lại
    if (lastIndex >= 0 && point.index === lastIndex + 1 && 
        currentBullet.length + point.text.length < 400) {
      currentBullet += " " + point.text;
    } else {
      // Lưu bullet hiện tại nếu có
      if (currentBullet) {
        finalBullets.push(currentBullet.trim());
      }
      currentBullet = point.text;
    }
    lastIndex = point.index;
  }
  
  // Đừng quên bullet cuối cùng
  if (currentBullet) {
    finalBullets.push(currentBullet.trim());
  }
  
  // Loại bỏ trùng lặp
  const uniqueBullets = [];
  const seenStarts = new Set();
  
  for (const bullet of finalBullets) {
    const start = bullet.slice(0, 50).toLowerCase();
    if (!seenStarts.has(start)) {
      seenStarts.add(start);
      uniqueBullets.push(bullet);
    }
  }
  
  return uniqueBullets.length > 0 ? uniqueBullets : 
         [`(Tìm thấy ${sentences.length} câu, ${fullText.length} ký tự nhưng không thể tóm tắt)`];
}

app.get("/api/summary", async (req,res) => {
  const raw = String(req.query.url || "").trim();
  const fallbackSummary = req.query.fallback || "";
  
  try {
    if (!raw) return res.status(400).json({ error: "Missing url" });
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol)) return res.status(400).json({ error: "Only http/https allowed" });
    const cached = cacheGet(raw); if (cached) return res.json({ cached:true, ...cached });

    // Headers giả lập browser thật + bypass một số paywall
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
      "Referer": "https://www.google.com/",
      // Bypass một số paywall đơn giản
      "X-Forwarded-For": "66.249.66.1", // Googlebot IP
      "Cookie": "" // Xóa cookie để tránh tracking
    };

    const resp = await fetch(raw, { 
      headers,
      redirect: "follow",
      // Timeout để tránh treo
      signal: AbortSignal.timeout(10000)
    });
    
    if (!resp.ok) {
      // Nếu fail, thử dùng Google Cache
      console.log(`Direct fetch failed, trying Google Cache...`);
      const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(raw)}`;
      const cacheResp = await fetch(cacheUrl, { headers });
      
      if (cacheResp.ok) {
        const html = await cacheResp.text();
        const $ = cheerio.load(html);
        
        // Xóa Google Cache header
        $("#google-cache-hdr").remove();
        
        const title = ($("meta[property='og:title']").attr("content") || $("title").text() || "").trim();
        const site = (new URL(raw)).hostname;
        const mainText = extractMainContent($);
        const bullets = mainText.length > 100 ? summarizeToBullets(mainText) : [fallbackSummary || "(Không có nội dung)"];
        
        const originalLength = mainText.length || 0;
        const summaryLength = bullets.join(" ").length;
        const percentage = originalLength > 0 ? Math.round((summaryLength / originalLength) * 100) : 100;
        
        const data = { 
          url: raw, 
          title, 
          site, 
          bullets, 
          percentage, 
          originalLength, 
          summaryLength,
          source: "Google Cache"
        };
        cacheSet(raw, data);
        return res.json(data);
      }
    }
    
    const html = await resp.text();
    const $ = cheerio.load(html);
    
    // Kiểm tra và bypass JavaScript rendering
    const hasJsContent = html.includes("__NEXT_DATA__") || 
                        html.includes("window.__INITIAL_STATE__") ||
                        html.includes("ReactDOM.render");
    
    if (hasJsContent) {
      console.log("Detected JS-rendered content, extracting from script tags...");
      
      // Thử extract từ Next.js data
      $("script[id='__NEXT_DATA__']").each((_, script) => {
        try {
          const data = JSON.parse($(script).html());
          const article = data?.props?.pageProps?.article || 
                         data?.props?.pageProps?.post ||
                         data?.props?.pageProps?.data;
          
          if (article?.content) {
            // Inject content vào DOM để xử lý
            $("body").append(`<div class="extracted-content">${article.content}</div>`);
          }
        } catch (e) {}
      });
      
      // Thử extract từ các script khác
      $("script").each((_, script) => {
        const text = $(script).html() || "";
        const matches = text.match(/"content"\s*:\s*"([^"]+)"/g) || 
                       text.match(/"body"\s*:\s*"([^"]+)"/g) ||
                       text.match(/"text"\s*:\s*"([^"]+)"/g);
        
        if (matches && matches.length > 0) {
          const content = matches.join(" ").replace(/\\n/g, " ").replace(/\\"/g, '"');
          $("body").append(`<div class="extracted-json-content">${content}</div>`);
        }
      });
    }
    
    const title = ($("meta[property='og:title']").attr("content") || $("title").text() || "").trim();
    const site = $("meta[property='og:site_name']").attr("content") || (new URL(raw)).hostname;
    const mainText = extractMainContent($);
    
    // Nếu không extract được, dùng fallback
    let bullets;
    if (!mainText || mainText.length < 100) {
      const metaDesc = $("meta[property='og:description']").attr("content") || 
                       $("meta[name='description']").attr("content") || "";
      const contentToUse = metaDesc || fallbackSummary || "";
      
      if (contentToUse) {
        bullets = [contentToUse];
      } else {
        bullets = ["(Trang có thể yêu cầu đăng nhập hoặc có paywall. Vui lòng xem bài gốc)"];
      }
    } else {
      bullets = summarizeToBullets(mainText);
    }
    
    const originalLength = mainText.length || (fallbackSummary ? fallbackSummary.length : 0);
    const summaryLength = bullets.join(" ").length;
    const percentage = originalLength > 0 ? Math.round((summaryLength / originalLength) * 100) : 100;
    
    const data = { url: raw, title, site, bullets, percentage, originalLength, summaryLength };
    cacheSet(raw, data);
    res.json(data);
  } catch (e) {
    console.error(`Error summarizing ${raw}:`, e.message);
    
    // Fallback cuối cùng
    if (fallbackSummary) {
      return res.json({
        url: raw,
        title: "Không thể tải trang",
        site: (new URL(raw)).hostname,
        bullets: [fallbackSummary],
        percentage: 100,
        error: e.message
      });
    }
    
    res.status(500).json({ error: e.message || "Summary error" });
  }
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`News aggregator running at http://localhost:${PORT}`));