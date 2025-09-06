import express from 'express';
import { NewsController } from '../controllers/news.controller.js';
import { SummaryController } from '../controllers/summary.controller.js';
import { TranslateController } from '../controllers/translate.controller.js';
import { SOURCES } from '../config/sources.js';

const router = express.Router();

// Health check
router.get('/healthz', (req, res) => res.json({ ok: true }));

// News endpoints
router.get('/news', NewsController.getNews);

// Summary endpoints
router.get('/summary', SummaryController.getSummary);

// Translation endpoints
router.get('/translate', TranslateController.translate);
router.post('/translate', TranslateController.translate);

// Sources endpoint
router.get('/sources', (req, res) => {
  const sources = Object.values(SOURCES).map(({ id, name, homepage, url, type, group }) => ({
    id, name, homepage, url, type, group: group || 'vietnam'
  }));
  res.json({ sources });
});

export default router;