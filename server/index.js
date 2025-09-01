// server/index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import pino from "pino";
import path from "path";
import { fileURLToPath } from "url";

import newsRouter from "./routes/news.js";
import translateRouter from "./routes/translate.js";
import sourcesRouter from "./routes/sources.js";
import summaryRouter from "./routes/summary.js";

// Import scheduler and cache store
import { scheduler } from "./services/scheduler.js";
import { newsStore } from "./services/news-cache-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins in dev, configure for production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn({
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        status: res.statusCode
      }, 'Slow request');
    }
  });
  
  next();
});

// Static files (public)
const PUBLIC_DIR = path.resolve(__dirname, "../public");
app.use("/public", express.static(PUBLIC_DIR, {
  maxAge: '1h', // Cache static files for 1 hour
  etag: true
}));

// Health endpoint with detailed status
app.get("/api/healthz", (req, res) => {
  const stats = newsStore.getStats();
  const schedulerStatus = scheduler.getStatus();
  const loadingProgress = newsStore.getLoadingProgress();
  
  res.json({ 
    status: 'ok',
    server: {
      uptime: schedulerStatus.uptime,
      memory: process.memoryUsage(),
      nodeVersion: process.version
    },
    cache: {
      initialized: stats.initialized,
      totalItems: stats.totalCached,
      groups: Object.keys(stats.groups).length,
      loadingProgress: `${loadingProgress.loaded}/${loadingProgress.total}`,
      isReady: newsStore.isReady()
    },
    scheduler: {
      running: schedulerStatus.isRunning,
      jobs: schedulerStatus.jobs,
      nextRuns: schedulerStatus.nextRuns
    },
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use("/api", sourcesRouter);
app.use("/api", newsRouter);
app.use("/api", translateRouter);
app.use("/api", summaryRouter);

// Root -> serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    path: req.path 
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error' 
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Start server
const server = app.listen(PORT, HOST, () => {
  logger.info(`
╔════════════════════════════════════════════╗
║       NEWS AGGREGATOR SERVER STARTED       ║
╠════════════════════════════════════════════╣
║  🌐 Server: http://${HOST}:${PORT}              ║
║  📰 Mode: ${process.env.NODE_ENV || 'development'}                  ║
║  🕐 Time: ${new Date().toLocaleString('vi-VN')}   ║
╚════════════════════════════════════════════╝
  `);
  
  // Start scheduler after server is up
  logger.info('🚀 Starting scheduler and cache initialization...');
  scheduler.start();
  
  // Log initial status after 5 seconds
  setTimeout(() => {
    const progress = newsStore.getLoadingProgress();
    if (progress.percentage > 0) {
      logger.info(`📊 Initial load progress: ${progress.percentage}% (${progress.loaded}/${progress.total} groups)`);
    }
  }, 5000);
  
  // Log when fully loaded
  const checkInterval = setInterval(() => {
    if (newsStore.isReady()) {
      const stats = newsStore.getStats();
      logger.info(`
✅ CACHE FULLY LOADED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total items: ${stats.totalCached}
  Groups: ${Object.keys(stats.groups).map(g => `${g}: ${stats.groups[g].itemCount}`).join(', ')}
  Ready to serve cached content!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
      clearInterval(checkInterval);
    }
  }, 10000); // Check every 10 seconds
});

// Graceful shutdown
let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  logger.info(`
╔════════════════════════════════════════════╗
║         SHUTTING DOWN GRACEFULLY           ║
╠════════════════════════════════════════════╣
║  Signal: ${signal.padEnd(35)}║
║  Time: ${new Date().toLocaleString('vi-VN').padEnd(37)}║
╚════════════════════════════════════════════╝
  `);
  
  // Stop scheduler first
  logger.info('🛑 Stopping scheduler...');
  scheduler.stop();
  
  // Log cache stats before shutdown
  const stats = newsStore.getStats();
  logger.info(`📊 Final cache stats: ${stats.totalCached} items cached across ${Object.keys(stats.groups).length} groups`);
  
  // Close server
  server.close(() => {
    logger.info('✅ Server closed successfully');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle various shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Nodemon restart

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception');
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
});

// Memory usage monitoring (every 5 minutes)
setInterval(() => {
  const usage = process.memoryUsage();
  const stats = newsStore.getStats();
  
  logger.info({
    memory: {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`
    },
    cache: {
      totalItems: stats.totalCached,
      queueLength: stats.queueLength
    }
  }, 'System stats');
}, 5 * 60 * 1000);

export default app;