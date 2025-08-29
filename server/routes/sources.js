// server/routes/sources.js
import express from "express";
import { listSources } from "../services/aggregator.js";

const router = express.Router();
router.get("/sources", (req, res) => {
  res.json({ sources: listSources() });
});

export default router;