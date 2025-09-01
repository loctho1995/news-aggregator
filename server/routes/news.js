// server/routes/news.js
import express from "express";
import { newsStore } from "../services/news-cache-store.js";
import { fetchAll, fetchAllStreaming } from "../services/aggregator.js";

const router = express.Router();

router.get("/news", async (req, res) => {
  const include = String(req.query.sources || "").split(",").map(s => s.trim()).filter(Boolean);
  const hours = parseInt(req.query.hours || "48", 10); // Changed default to 48
  const limitPerSource = parseInt(req.query.limit || "30", 10);
  const group = req.query.group && req.query.group !== "all" ? String(req.query.group) : 'all';
  const streaming = req.query.stream === "true";
  const forceRefresh = req.query.refresh === "true";
  const useCache = req.query.cache !== "false"; // Default to use cache

  try {
    // If force refresh requested
    if (forceRefresh) {
      console.log('🔄 Force refresh requested');
      await newsStore.updateNewsForGroup(group, include, true);
    }

    // For streaming mode, always fetch fresh (backward compatibility)
    if (streaming) {
      res.setHeader("Content-Type", "application/x-ndjson");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      
      await fetchAllStreaming({
        include,
        hours,
        limitPerSource,
        group: group === 'all' ? null : group,
        onItem: (item) => {
          res.write(JSON.stringify(item) + "\n");
        }
      });
      
      res.end();
      return;
    }

    // Use cache by default
    if (useCache) {
      const cached = newsStore.getCachedNews(group, include);
      
      if (cached.items.length > 0) {
        // Return cached data
        return res.json({
          items: cached.items,
          cached: true,
          lastUpdated: cached.lastUpdated,
          cacheAge: cached.cacheAge,
          totalItems: cached.items.length
        });
      } else {
        // No cache, queue update and return empty with message
        newsStore.queueUpdate(group, include);
        
        return res.json({
          items: [],
          cached: false,
          message: 'Cache is being populated, please try again in a few moments',
          status: 'updating'
        });
      }
    }

    // Direct fetch without cache (old behavior)
    const items = await fetchAll({ include, hours, limitPerSource, group: group === 'all' ? null : group });
    res.json({ items, cached: false });

  } catch (e) {
    console.error("GET /api/news failed:", e);
    
    // Try to return cached data on error
    const cached = newsStore.getCachedNews(group, include);
    if (cached.items.length > 0) {
      return res.json({
        items: cached.items,
        cached: true,
        lastUpdated: cached.lastUpdated,
        fallback: true,
        error: 'Using cached data due to fetch error'
      });
    }
    
    res.status(500).json({ error: e.message || "Internal error" });
  }
});

// New endpoint for cache stats
router.get("/news/stats", (req, res) => {
  res.json(newsStore.getStats());
});

// Manual trigger endpoint (protected in production)
router.post("/news/refresh", async (req, res) => {
  const { group = 'all', sources = [] } = req.body || {};
  
  // Add auth check here in production
  // if (!req.headers.authorization) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    newsStore.queueUpdate(group, sources);
    res.json({ 
      message: 'Refresh queued',
      group,
      sources,
      stats: newsStore.getStats()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;