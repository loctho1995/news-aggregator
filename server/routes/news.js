// server/routes/news.js
import express from "express";
import { fetchAll, fetchAllStreaming } from "../services/aggregator.js";

const router = express.Router();

router.get("/news", async (req, res) => {
  const include = String(req.query.sources || "").split(",").map(s => s.trim()).filter(Boolean);
  const hours = parseInt(req.query.hours || "24", 10);
  const limitPerSource = parseInt(req.query.limit || "30", 10);
  const group = req.query.group && req.query.group !== "all" ? String(req.query.group) : null;
  const streaming = req.query.stream === "true";

  try {
    if (streaming) {
      res.setHeader("Content-Type", "application/x-ndjson");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      await fetchAllStreaming({
        include,
        hours,
        limitPerSource,
        group,
        onItem: (item) => {
          res.write(JSON.stringify(item) + "\n");
        }
      });
      res.end();
    } else {
      const items = await fetchAll({ include, hours, limitPerSource, group });
      res.json({ items });
    }
  } catch (e) {
    console.error("GET /api/news failed:", e);
    res.status(500).json({ error: e.message || "Internal error" });
  }
});

export default router;