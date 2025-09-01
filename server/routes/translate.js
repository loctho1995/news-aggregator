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

// Single translation endpoint (existing)
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

// NEW: Batch translation endpoint - GỌI 1 LẦN CHO NHIỀU TEXT
router.post("/translate-batch", async (req, res) => {
  try {
    const { texts, target = "vi" } = req.body || {};
    
    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({ error: "Missing texts array" });
    }
    
    // Filter empty texts but keep track of original positions
    const nonEmptyTexts = [];
    const indexMap = [];
    texts.forEach((text, index) => {
      if (text && text.trim()) {
        nonEmptyTexts.push(text);
        indexMap.push(index);
      }
    });
    
    if (nonEmptyTexts.length === 0) {
      return res.json({ translatedTexts: texts });
    }
    
    // Use a unique delimiter that won't appear in normal text
    const delimiter = "\n<<<DELIMITER>>>\n";
    const combined = nonEmptyTexts.join(delimiter);
    
    // Check cache for combined text
    const cacheKey = `batch:${target}::${combined.slice(0, 300)}`;
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      // Map back to original positions
      const result = [...texts];
      indexMap.forEach((originalIndex, i) => {
        result[originalIndex] = cached[i] || texts[originalIndex];
      });
      return res.json({ translatedTexts: result, cached: true });
    }
    
    try {
      // Translate all at once
      const url = new URL("https://translate.googleapis.com/translate_a/single");
      url.searchParams.set("client", "gtx");
      url.searchParams.set("sl", "auto");
      url.searchParams.set("tl", target);
      url.searchParams.set("dt", "t");
      url.searchParams.set("q", combined);
      
      const resp = await fetch(url, { 
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(15000) // 15s timeout for batch
      });
      
      if (!resp.ok) {
        throw new Error(`Translate API returned ${resp.status}`);
      }
      
      const data = await resp.json();
      const translatedCombined = Array.isArray(data) && Array.isArray(data[0])
        ? data[0].map((seg) => (Array.isArray(seg) ? seg[0] : "")).join("")
        : "";
      
      if (!translatedCombined) {
        throw new Error("Empty translation response");
      }
      
      // Split back to array
      let translatedTexts = translatedCombined.split(delimiter).map(t => t.trim());
      
      // Validate count matches
      if (translatedTexts.length !== nonEmptyTexts.length) {
        console.warn(`Batch translate count mismatch: ${nonEmptyTexts.length} → ${translatedTexts.length}`);
        // If mismatch, try to salvage what we can
        if (translatedTexts.length < nonEmptyTexts.length) {
          // Pad with original texts
          while (translatedTexts.length < nonEmptyTexts.length) {
            translatedTexts.push(nonEmptyTexts[translatedTexts.length]);
          }
        } else {
          // Truncate excess
          translatedTexts = translatedTexts.slice(0, nonEmptyTexts.length);
        }
      }
      
      // Cache the result
      setCache(cacheKey, translatedTexts);
      
      // Map back to original positions
      const result = [...texts];
      indexMap.forEach((originalIndex, i) => {
        result[originalIndex] = translatedTexts[i] || texts[originalIndex];
      });
      
      res.json({ translatedTexts: result });
      
    } catch (batchError) {
      console.error("Batch translation failed, falling back to individual:", batchError.message);
      
      // Fallback: translate one by one
      const fallbackResults = [...texts];
      
      for (let i = 0; i < indexMap.length; i++) {
        const originalIndex = indexMap[i];
        const text = nonEmptyTexts[i];
        
        try {
          const singleUrl = new URL("https://translate.googleapis.com/translate_a/single");
          singleUrl.searchParams.set("client", "gtx");
          singleUrl.searchParams.set("sl", "auto");
          singleUrl.searchParams.set("tl", target);
          singleUrl.searchParams.set("dt", "t");
          singleUrl.searchParams.set("q", text);
          
          const singleResp = await fetch(singleUrl, { 
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(5000)
          });
          
          if (singleResp.ok) {
            const singleData = await singleResp.json();
            const singleTranslated = Array.isArray(singleData) && Array.isArray(singleData[0])
              ? singleData[0].map((seg) => (Array.isArray(seg) ? seg[0] : "")).join("")
              : text;
            
            if (singleTranslated) {
              fallbackResults[originalIndex] = singleTranslated;
              // Cache individual result
              const individualKey = `${target}::${text.slice(0, 1000)}`;
              setCache(individualKey, singleTranslated);
            }
          }
        } catch (e) {
          console.error(`Failed to translate item ${i}:`, e.message);
        }
      }
      
      res.json({ translatedTexts: fallbackResults, fallback: true });
    }
    
  } catch (e) {
    console.error("POST /api/translate-batch failed:", e);
    res.status(500).json({ error: e.message || "Internal error" });
  }
});

export default router;