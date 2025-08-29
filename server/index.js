// server/index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import pino from "pino";
import path from "path";
import { fileURLToPath } from "url";

import newsRouter from "./routes/news.js";
import sourcesRouter from "./routes/sources.js";
import summaryRouter from "./routes/summary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || "info" });

app.use(cors());
app.use(express.json());

// Static files (public)
const PUBLIC_DIR = path.resolve(__dirname, "../public");
app.use("/public", express.static(PUBLIC_DIR));

// Health
app.get("/api/healthz", (req, res) => res.json({ ok: true }));

// API routes
app.use("/api", sourcesRouter);
app.use("/api", newsRouter);
app.use("/api", summaryRouter);

// Root -> serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`News aggregator running at http://localhost:${PORT}`));