
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
  $("script,style,noscript,header,footer,nav,aside").remove();
  const candidates = ["article","[class*='content']","[id*='content']","[class*='detail']","[class*='body']",".article-body",".entry-content",".post-content",".news-content"];
  let best = null;
  for (const sel of candidates) {
    const el = $(sel).first();
    if (el && el.length) { best = el; break; }
  }
  if (!best) best = $("main").first().length ? $("main").first() : $("body");
  return best.text().replace(/\s+/g, " ").trim();
}

function splitSentencesNoLookbehind(text) {
  const parts = text.match(/[^.!?…]+(?:[.!?…]+|$)/g) || [];
  return parts.map(s => s.trim()).filter(Boolean);
}

function summarizeToBullets(fullText) {
  if (!fullText || fullText.length < 60) return ["(Bài quá ngắn để tóm tắt)"];
  const target = Math.max(400, Math.min(1800, Math.floor(fullText.length / 3)));
  const sentences = splitSentencesNoLookbehind(fullText);
  const bullets = []; let buf = "";
  for (const s of sentences) {
    const next = (buf ? buf + " " : "") + s;
    if (next.length < 160) { buf = next; }
    else { bullets.push((buf || s).trim()); buf = ""; if (bullets.length >= 10) break; }
  }
  if (buf && bullets.length < 10) bullets.push(buf.trim());
  const trimmed = bullets.map(b => (b.length > 220 ? b.slice(0,219) + "…" : b));
  const out = []; let total = 0;
  for (const b of trimmed) { if (total + b.length > target && out.length >= 3) break; out.push(b); total += b.length; if (out.length >= 10) break; }
  return out.length ? out : trimmed.slice(0, Math.min(5, trimmed.length));
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
    const data = { url: raw, title, site, bullets };
    cacheSet(raw, data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || "Summary error" });
  }
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`News aggregator running at http://localhost:${PORT}`));
