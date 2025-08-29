// server/routes/summary.js
import express from "express";
import { summarizeUrl, aiSummarizeUrl } from "../services/summary.js";

const router = express.Router();

router.get("/summary", async (req, res) => {
  const url = String(req.query.url || "");
  const percent = parseInt(req.query.percent || "70", 10);
  const fallback = String(req.query.fallback || "");

  try {
    const data = await summarizeUrl({ url, percent, fallbackSummary: fallback });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || "Summary failed" });
  }
});

router.get("/ai-summary", async (req, res) => {
  const url = String(req.query.url || "");
  const language = String(req.query.language || "vi");
  const targetLength = req.query.targetLength ? parseInt(req.query.targetLength, 10) : null;
  const percent = parseInt(req.query.percent || "70", 10);

  try {
    const data = await aiSummarizeUrl({ url, language, targetLength, percent });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || "AI Summary failed" });
  }
});

export default router;