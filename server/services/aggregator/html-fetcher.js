// server/services/aggregator/html-fetcher.js
import * as cheerio from "cheerio";
import { cleanText, toISO, deriveCategoriesFromURL } from "./utils.js";
import { extractFullContent, createBulletPointSummary } from "./content-extractor.js";

export async function fetchHTMLWithFullContent(source) {
  console.log(`Fetching HTML from ${source.name}...`);
  const res = await fetch(source.url, { 
    headers: { "User-Agent": "VN News Aggregator/1.0" } 
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const items = [];
  const host = (new URL(source.url)).hostname;
  
  // Tìm các link bài viết
  const containers = $("article a, .article a, .post a, .news-item a, .story a, h3 a, h2 a");
  const links = new Set();
  
  containers.each((_, el) => {
    const href = $(el).attr("href");
    if (href && /^https?:\/\//.test(href) && href.includes(host)) {
      links.add(href);
    }
  });
  
  // Giới hạn số link
  const maxLinks = 10;
  const promises = Array.from(links).slice(0, maxLinks).map(async (link) => {
    try {
      const response = await fetch(link, {
        headers: { "User-Agent": "VN News Aggregator/1.0" },
        timeout: 5000
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const articleHtml = await response.text();
      const $article = cheerio.load(articleHtml);
      
      // Extract metadata và content
      const title = $article("meta[property='og:title']").attr("content") || 
                   $article("title").text() || 
                   $article("h1").first().text();
      
      const fullContent = extractFullContent($article);
      
      // Tạo bullet point summary thay vì paragraph
      const bulletSummary = createBulletPointSummary(fullContent, 3);
      
      const image = $article("meta[property='og:image']").attr("content") || 
                   $article("img").first().attr("src");
      
      const publishedTime = $article("meta[property='article:published_time']").attr("content") ||
                           $article("time").attr("datetime");
      
      return {
        sourceId: source.id,
        sourceName: source.name,
        title: cleanText(title, 280),
        link: link,
        summary: bulletSummary.text, // Text version for backward compatibility
        bullets: bulletSummary.bullets, // Array of bullet points
        fullContent: fullContent,
        publishedAt: toISO(publishedTime),
        image: image,
        categories: deriveCategoriesFromURL(link)
      };
    } catch (e) {
      console.error(`Error fetching ${link}: ${e.message}`);
      return null;
    }
  });
  
  const results = await Promise.allSettled(promises);
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value) {
      items.push(r.value);
    }
  });
  
  return items;
}