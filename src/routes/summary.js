// server/routes/summary.js
// Enhanced with SSE progress streaming

import express from "express";
import { summarizeUrl, aiSummarizeUrl, summarizeUrlWithProgress } from "../services/summary.js";

const router = express.Router();

// New endpoint for progress streaming
router.get("/summary-stream", async (req, res) => {
  const url = String(req.query.url || "");
  const percent = parseInt(req.query.percent || "70", 10);
  const fallback = String(req.query.fallback || "");

  // Setup SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  try {
    await summarizeUrlWithProgress({
      url,
      percent,
      fallbackSummary: fallback,
      req,
      onProgress: (progress) => {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      }
    });
    
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
});

// Original endpoint (keep for backward compatibility)
router.get("/summary", async (req, res) => {
  const url = String(req.query.url || "");
  const percent = parseInt(req.query.percent || "70", 10);
  const fallback = String(req.query.fallback || "");

  try {
    const data = await summarizeUrl({ 
      url, 
      percent, 
      fallbackSummary: fallback,
      req
    });
    
    if (data.mobile) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=1800');
    }
    
    res.json(data);
  } catch (e) {
    console.error("Summary error:", e);
    if (fallback) { return res.status(200).json({ bullets: [], paragraphs: [], fullSummary: fallback, fallbackText: fallback, error: e.message }); }
    res.status(500).json({ error: e.message || 'Summary failed', fallback: fallback || null });
  }
});

export default router;