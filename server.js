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
  // Xóa các thành phần không cần thiết (mở rộng danh sách)
  $("script,style,noscript,iframe,.advertisement,.ads,.banner,.sidebar,.widget,.social-share,.related-news,.comment").remove();
  
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
      "article", "[itemprop='articleBody']", ".article-body",
      ".entry-content", ".post-content", ".news-content",
      ".main-content", ".story-body", ".text-content",
      "[class*='article'][class*='content']",
      "[class*='detail'][class*='content']",
      "[class*='content'][class*='detail']",
      "[id*='content'][class*='detail']"
    ]
  };
  
  let bestContent = "";
  let maxScore = 0;
  
  // Thử tất cả selectors và chọn cái tốt nhất
  Object.values(selectors).flat().forEach(sel => {
    try {
      $(sel).each((_, el) => {
        const $el = $(el);
        const text = $el.text().trim();
        const paragraphs = $el.find("p").length;
        const links = $el.find("a").length;
        const images = $el.find("img").length;
        
        // Tính điểm dựa trên các yếu tố
        const score = text.length + (paragraphs * 50) - (links * 10) + (images * 20);
        
        if (score > maxScore && text.length > 200) {
          maxScore = score;
          bestContent = text;
        }
      });
    } catch (e) {}
  });
  
  // PHƯƠNG PHÁP 3: Thu thập từ nhiều nguồn
  if (!bestContent || bestContent.length < 300) {
    const contentParts = [];
    
    // Lấy lead/sapo
    if (articleLead && articleLead.length > 50) {
      contentParts.push(articleLead);
    }
    
    // Lấy tất cả paragraphs có nội dung
    $("p").each((_, p) => {
      const text = $(p).text().trim();
      // Lọc paragraph có ý nghĩa
      if (text.length > 80 && 
          !text.includes("Xem thêm") && 
          !text.includes("Đọc thêm") &&
          !text.includes("TIN LIÊN QUAN") &&
          !text.includes("Chia sẻ") &&
          !text.includes("Bình luận")) {
        contentParts.push(text);
      }
    });
    
    // Nếu ít paragraph, thử lấy từ div/span
    if (contentParts.length < 3) {
      $("div.text, div.txt, span.text").each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 100) contentParts.push(text);
      });
    }
    
    bestContent = contentParts.join(" ");
  }
  
  // PHƯƠNG PHÁP 4: Fallback với meta description
  if (!bestContent || bestContent.length < 100) {
    bestContent = [ogDescription, metaDescription, articleLead].filter(Boolean).join(" ");
  }
  
  // Làm sạch content
  bestContent = bestContent
    .replace(/\s+/g, " ")
    .replace(/(\r\n|\n|\r)/gm, " ")
    .replace(/Chia sẻ bài viết.*/gi, "")
    .replace(/Xem thêm:.*/gi, "")
    .replace(/Đọc thêm:.*/gi, "")
    .replace(/TIN LIÊN QUAN.*/gi, "")
    .replace(/Bài viết liên quan.*/gi, "")
    .replace(/Tags?:.*/gi, "")
    .replace(/\[.*?\]/g, "") // Xóa [Photo], [Video]...
    .replace(/\(Ảnh:.*?\)/gi, "")
    .replace(/Theo\s+[A-Z][^.]{0,30}$/gi, "") // Theo VnExpress, Theo Dân Trí...
    .trim();
  
  console.log(`Extracted content: ${bestContent.length} chars from ${maxScore} score`);
  return bestContent;
}

function splitSentencesNoLookbehind(text) {
  const parts = text.match(/[^.!?…]+(?:[.!?…]+|$)/g) || [];
  return parts.map(s => s.trim()).filter(Boolean);
}

// BỎ GIỚI HẠN + CẢI THIỆN: Tóm tắt thông minh hơn
function summarizeToBullets(fullText) {
  // Nếu text quá ngắn, cố gắng trả về ít nhất phần có được
  if (!fullText || fullText.length < 30) {
    console.log(`Text too short: ${fullText?.length || 0} chars`);
    return [`(Không thể trích xuất nội dung từ trang này - vui lòng xem bài gốc)`];
  }
  
  // Nếu text ngắn (30-200 ký tự), trả về nguyên văn
  if (fullText.length < 200) {
    return [fullText];
  }
  
  const sentences = splitSentencesNoLookbehind(fullText);
  
  // Nếu ít câu, trả về từng câu
  if (sentences.length <= 3) {
    return sentences.filter(s => s.length > 20);
  }
  
  const bullets = [];
  let buf = "";
  
  // Gộp câu thành bullets tự nhiên
  for (const s of sentences) {
    // Bỏ qua câu quá ngắn (có thể là tiêu đề phụ)
    if (s.length < 30 && !buf) continue;
    
    const next = (buf ? buf + " " : "") + s;
    
    // Logic gộp câu thông minh
    if (next.length < 150) {
      // Câu ngắn, tiếp tục gộp
      buf = next;
    } else if (next.length < 350 && (
      // Gộp nếu câu có liên kết logic
      s.startsWith("Tuy nhiên") ||
      s.startsWith("Ngoài ra") ||
      s.startsWith("Theo đó") ||
      s.startsWith("Cụ thể") ||
      s.startsWith("Đồng thời") ||
      s.startsWith("Bên cạnh") ||
      s.match(/^(Ông|Bà|Anh|Chị|PGS|TS|BS|Luật sư)/i)
    )) {
      buf = next;
    } else {
      // Tạo bullet point
      if (buf.length > 40) bullets.push(buf.trim());
      buf = s;
    }
  }
  
  // Thêm bullet cuối
  if (buf && buf.length > 40) bullets.push(buf.trim());
  
  // Nếu không có bullets, cố gắng tạo từ sentences
  if (bullets.length === 0) {
    return sentences.slice(0, Math.min(10, sentences.length))
      .filter(s => s.length > 30)
      .map(s => s.length > 400 ? s.slice(0, 397) + "..." : s);
  }
  
  // Loại bỏ bullets trùng lặp
  const uniqueBullets = [];
  const seen = new Set();
  for (const b of bullets) {
    const key = b.toLowerCase().slice(0, 50);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueBullets.push(b);
    }
  }
  
  return uniqueBullets.length ? uniqueBullets : [`(Nội dung: ${sentences.length} câu, ${fullText.length} ký tự)`];
}

app.get("/api/summary", async (req,res) => {
  const raw = String(req.query.url || "").trim();
  try {
    if (!raw) return res.status(400).json({ error: "Missing url" });
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol)) return res.status(400).json({ error: "Only http/https allowed" });
    const cached = cacheGet(raw); if (cached) return res.json({ cached:true, ...cached });

    const resp = await fetch(raw, { headers: { "User-Agent": "VN News Aggregator/1.0" }, redirect: "follow" });
    if (!resp.ok) return res.status(502).json({ error: `Fetch failed: ${resp.status}` });
    const html = await resp.text();
    const $ = cheerio.load(html);
    const title = ($("meta[property='og:title']").attr("content") || $("title").text() || "").trim();
    const site = $("meta[property='og:site_name']").attr("content") || (new URL(raw)).hostname;
    const mainText = extractMainContent($);
    const bullets = summarizeToBullets(mainText);
    
    // Tính phần trăm tóm tắt
    const originalLength = mainText.length;
    const summaryLength = bullets.join(" ").length;
    const percentage = originalLength > 0 ? Math.round((summaryLength / originalLength) * 100) : 0;
    
    const data = { url: raw, title, site, bullets, percentage, originalLength, summaryLength };
    cacheSet(raw, data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || "Summary error" });
  }
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`News aggregator running at http://localhost:${PORT}`));