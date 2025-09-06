// server/routes/translate.js
import express from "express";
const router = express.Router();

// In-memory cache
const cache = new Map();
const MAX_CACHE = 1000;
function setCache(key, val) {
  if (cache.size >= MAX_CACHE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, val);
}
const getCache = (k) => cache.get(k);
const hasCache = (k) => cache.has(k);

// --- Helpers ---
async function fetchWithTimeout(url, opts = {}, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...opts, signal: ctrl.signal });
    return resp;
  } finally {
    clearTimeout(t);
  }
}

async function tryTranslateOnce(text, target, endpoint) {
  const q = encodeURIComponent(text || "");
  const ua = { "User-Agent": "Mozilla/5.0 (Node; Aggregator)" };

  if (endpoint === "google_gtx") {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${q}`;
    const resp = await fetchWithTimeout(url, { headers: ua });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const translated = Array.isArray(data) && Array.isArray(data[0])
      ? data[0].map(seg => (Array.isArray(seg) ? seg[0] : "")).join("")
      : "";
    return translated;
  }

  if (endpoint === "google_clients5") {
    // A lightweight endpoint used by Chrome dictionary extension
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=${target}&q=${q}`;
    const resp = await fetchWithTimeout(url, { headers: ua });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    // data may be an object with "sentences": [{trans:"..."}]
    if (data && Array.isArray(data.sentences)) {
      return data.sentences.map(s => s.trans || "").join("");
    }
    return "";
  }

  throw new Error("Unknown endpoint");
}

async function doTranslate(text, target) {
  // Validate input
  if (!text || text.trim().length < 2) {
    return text;
  }
  
  const endpoints = ["google_gtx", "google_clients5"];
  let lastErr = null;
  
  for (const ep of endpoints) {
    // small retry loop per endpoint
    for (let i = 0; i < 2; i++) {
      try {
        const out = await tryTranslateOnce(text, target, ep);
        
        // Validate output
        if (typeof out === "string" && out.trim().length > 0) {
          // Nếu kết quả chỉ có dấu câu, thử endpoint khác
          if (/^[.,!?;:\-–—\s]+$/.test(out)) {
            console.warn(`Endpoint ${ep} returned only punctuation`);
            continue;
          }
          
          // Nếu kết quả quá ngắn, thử endpoint khác
          if (out.length < text.length * 0.3 && text.length > 10) {
            console.warn(`Endpoint ${ep} returned too short result`);
            continue;
          }
          
          return out;
        }
      } catch (e) {
        lastErr = e;
        console.warn(`Translation attempt ${i+1} failed for ${ep}:`, e.message);
      }
    }
  }
  
  // Nếu tất cả đều thất bại, trả về text gốc
  console.error('All translation attempts failed, returning original');
  return text;
}

// --- Routes ---
// GET /api/translate?q=...&target=vi
router.get("/translate", async (req, res) => {
  try {
    const t = typeof req.query.q === "string" ? req.query.q : "";
    const target = typeof req.query.target === "string" ? req.query.target : "vi";
    const key = `${target}:${t}`;
    if (hasCache(key)) return res.json({ translatedText: getCache(key) });
    const out = await doTranslate(t, target);
    setCache(key, out);
    return res.json({ translatedText: out });
  } catch (e) {
    // Graceful fallback
    return res.json({ translatedText: String(req.query.q || ""), fallback: true, error: String(e?.message || "fetch failed") });
  }
});

// POST /api/translate  (accepts { text } or { texts: [] })
router.post("/translate", async (req, res) => {
  let { text, texts, target = "vi" } = req.body || {};
  const hasText = typeof text !== "undefined";
  const hasTexts = Array.isArray(texts);

  try {
    if (hasTexts) {
      const clean = texts.map(t => (t == null) ? "" : String(t));
      // Serve from cache or translate with retries
      const results = [];
      for (const t of clean) {
        const key = `${target}:${t}`;
        if (hasCache(key)) {
          results.push(getCache(key));
        } else {
          try {
            const out = await doTranslate(t, target);
            setCache(key, out);
            results.push(out);
          } catch (e) {
            // fallback per item: return original
            results.push(t);
          }
        }
      }
      return res.json({ translatedTexts: results });
    }

    // Single text (allow empty string)
    const t = (text == null) ? "" : String(text);
    const key = `${target}:${t}`;
    if (hasCache(key)) return res.json({ translatedText: getCache(key) });

    try {
      const out = await doTranslate(t, target);
      setCache(key, out);
      return res.json({ translatedText: out });
    } catch (e) {
      // Graceful fallback
      return res.json({ translatedText: t, fallback: true, error: String(e?.message || "fetch failed") });
    }
  } catch (e) {
    // Never 500 to the client for translate; return original input
    if (hasTexts) {
      const clean = (texts || []).map(t => (t == null) ? "" : String(t));
      return res.json({ translatedTexts: clean, fallback: true, error: String(e?.message || "fetch failed") });
    } else {
      const t = (text == null) ? "" : String(text);
      return res.json({ translatedText: t, fallback: true, error: String(e?.message || "fetch failed") });
    }
  }
});

export default router;
