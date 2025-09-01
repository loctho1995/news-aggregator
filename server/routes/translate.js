// server/routes/translate.js
import express from "express";

const router = express.Router();

// Simple in-memory cache to reduce duplicate translations
const cache = new Map();
const MAX_CACHE = 500;

function setCache(key, value) {
  if (cache.size >= MAX_CACHE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, value);
}

router.post("/translate", async (req, res) => {
  try {
    const { text, target = "vi" } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text" });
    }

    const key = `${target}::${text.slice(0, 1000)}`; // cap key length
    if (cache.has(key)) {
      return res.json({ translatedText: cache.get(key), cached: true });
    }

    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "auto");
    url.searchParams.set("tl", target);
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", text);

    const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Translate HTTP ${resp.status}` });
    }
    const data = await resp.json();
    const translated = Array.isArray(data) && Array.isArray(data[0])
      ? data[0].map((seg) => (Array.isArray(seg) ? seg[0] : "")).join("")
      : "";

    if (!translated) {
      return res.status(502).json({ error: "Translate empty response" });
    }

    setCache(key, translated);
    res.json({ translatedText: translated });
  } catch (e) {
    console.error("POST /api/translate failed:", e);
    res.status(500).json({ error: e.message || "Internal error" });
  }
});

export default router;
