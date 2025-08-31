// server/routes/summary.js
// Updated to pass request object for mobile detection

import express from "express";
import { summarizeUrl, aiSummarizeUrl } from "../services/summary.js";

const router = express.Router();

router.get("/summary", async (req, res) => {
  const url = String(req.query.url || "");
  const percent = parseInt(req.query.percent || "70", 10);
  const fallback = String(req.query.fallback || "");

  try {
    // Pass req object for mobile detection
    const data = await summarizeUrl({ 
      url, 
      percent, 
      fallbackSummary: fallback,
      req // Pass full request object for headers
    });
    
    // Set cache headers for mobile
    if (data.mobile) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache for mobile
    } else {
      res.setHeader('Cache-Control', 'public, max-age=1800'); // 30 min for desktop
    }
    
    res.json(data);
  } catch (e) {
    console.error("Summary error:", e);
    res.status(500).json({ 
      error: e.message || "Summary failed",
      fallback: fallback || null
    });
  }
});

router.get("/ai-summary", async (req, res) => {
  const url = String(req.query.url || "");
  const language = String(req.query.language || "vi");
  const targetLength = req.query.targetLength ? parseInt(req.query.targetLength, 10) : null;
  const percent = parseInt(req.query.percent || "70", 10);

  try {
    const data = await aiSummarizeUrl({ 
      url, 
      language, 
      targetLength, 
      percent,
      req // Pass request object
    });
    
    // Set cache headers
    if (data.mobile) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=1800');
    }
    
    res.json(data);
  } catch (e) {
    console.error("AI Summary error:", e);
    res.status(500).json({ 
      error: e.message || "AI Summary failed" 
    });
  }
});

export default router;