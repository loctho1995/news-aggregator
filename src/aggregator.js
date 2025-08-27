import Parser from "rss-parser";
import * as cheerio from "cheerio";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import tz from "dayjs/plugin/timezone.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import { SOURCES } from "./sources.js";

dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(relativeTime);

const parser = new Parser({ timeout: 10000, headers: { "User-Agent": "VN News Aggregator/1.0 (+https://example.com)" } });
const DEFAULT_TZ = "Asia/Bangkok";

const toArray = (v) => Array.isArray(v) ? v : (v ? [v] : []);

function cleanText(htmlOrText, maxLen = 240) {
  if (!htmlOrText) return "";
  const text = String(htmlOrText).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}

function toISO(dateLike) {
  if (!dateLike) return null;
  const d = dayjs(dateLike);
  return d.isValid() ? d.toISOString() : null;
}

function deriveCategoriesFromURL(href) {
  try {
    const u = new URL(href);
    const segs = u.pathname.split("/").filter(Boolean);
    // lấy 1–2 segment chữ làm thể loại
    const cat = segs.filter(s => !/^\d/.test(s)).slice(0, 2).map(s => s.replace(/[-_]/g, " "));
    return cat;
  } catch { return []; }
}

async function fetchRSS(source) {
  const feed = await parser.parseURL(source.url);
  const items = (feed.items || []).map((it) => {
    const cats = toArray(it.categories || it.category).map(c => String(c).trim()).filter(Boolean);
    const derived = cats.length ? cats : deriveCategoriesFromURL(it.link || "");
    return {
      sourceId: source.id,
      sourceName: source.name,
      title: cleanText(it.title, 280),
      link: it.link,
      summary: cleanText(it.contentSnippet || it.content || it.summary, 280),
      publishedAt: toISO(it.isoDate || it.pubDate),
      image: it.enclosure?.url || null,
      categories: derived
    };
  });
  return items;
}

// Adapter HTML tổng quát cho các trang không RSS chuẩn
async function fetchGenericHTML(source) {
  const res = await fetch(source.url, { headers: { "User-Agent": "VN News Aggregator/1.0" } });
  const html = await res.text();
  const $ = cheerio.load(html);
  const items = [];
  const host = (new URL(source.url)).hostname;

  const containers = $("article, .article, .post, .post-item, .news-item, .story, .story__item, .box-category, .list-news li, li.news, .list-item");
  containers.each((_, el) => {
    const a = $(el).find("a").filter((i, x) => {
      const href = $(x).attr("href") || "";
      return /^https?:\/\//.test(href) && href.includes(host);
    }).first();

    const titleRaw = a.text() || $(el).find("h3, h2, .title, .story__title, .post-title").first().text();
    const title = cleanText(titleRaw, 200);
    const link = a.attr("href");

    if (title && link) {
      let img = $(el).find("img").attr("src") || null;
      if (img && img.startsWith("//")) img = "https:" + img;
      const summary = cleanText($(el).find("p, .summary, .desc, .sapo, .lead").first().text(), 240);
      const categories = deriveCategoriesFromURL(link);

      items.push({
        sourceId: source.id,
        sourceName: source.name,
        title, link, summary,
        publishedAt: null, image: img || null,
        categories
      });
    }
  });

  // fallback: nếu trang layout lạ
  if (items.length < 5) {
    $("a").each((_, x) => {
      const href = $(x).attr("href") || "";
      const txt  = cleanText($(x).text(), 180);
      if (!/^https?:\/\//.test(href) || !href.includes(host)) return;
      if (txt.length < 25) return;
      const categories = deriveCategoriesFromURL(href);
      items.push({ sourceId: source.id, sourceName: source.name, title: txt, link: href, summary: "", publishedAt: null, image: null, categories });
    });
  }

  // dedupe theo link
  const seen = new Set();
  const out = [];
  for (const it of items) {
    if (seen.has(it.link)) continue;
    seen.add(it.link);
    out.push(it);
    if (out.length >= 25) break;
  }
  return out;
}

async function fetchFromSource(sourceId) {
  const source = SOURCES[sourceId];
  if (!source) throw new Error("Unknown source: " + sourceId);
  if (source.type === "rss") return await fetchRSS(source);
  if (source.type === "html") return await fetchGenericHTML(source);
  throw new Error("No adapter for type: " + source.type);
}

export async function fetchAll({ include = [], hours = 24, limitPerSource = 30 } = {}) {
  const ids = include.length ? include : Object.keys(SOURCES);
  const since = dayjs().tz(DEFAULT_TZ).subtract(hours, "hour");
  const tasks = ids.map(async (id) => {
    try {
      const items = await fetchFromSource(id);
      const filtered = items
        .filter((it) => {
          if (!it.publishedAt) return true;
          const t = dayjs(it.publishedAt);
          return t.isValid() ? t.isAfter(since) : true;
        })
        .slice(0, limitPerSource);
      return filtered;
    } catch (e) {
      return [{ error: true, sourceId: id, message: e.message }];
    }
  });
  const results = (await Promise.allSettled(tasks)).flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const seen = new Set();
  const deduped = [];
  for (const it of results) {
    if (!it.link || seen.has(it.link)) continue;
    seen.add(it.link);
    it.categories = (it.categories || []).map(x => String(x).trim()).filter(Boolean);
    deduped.push(it);
  }
  deduped.sort((a, b) => {
    const ta = a.publishedAt ? +new Date(a.publishedAt) : 0;
    const tb = b.publishedAt ? +new Date(b.publishedAt) : 0;
    return tb - ta;
  });
  return deduped;
}

export function listSources() {
  return Object.values(SOURCES).map(({ id, name, homepage, url, type }) => ({ id, name, homepage, url, type }));
}