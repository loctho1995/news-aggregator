import { SummaryService } from '../services/summary.service.js';

export class SummaryController {
  static async getSummary(req, res) {
    try {
      const params = {
        url: req.query.url,
        percent: parseInt(req.query.percent || '70'),
        fallback: req.query.fallback || '',
        isMobile: SummaryController.isMobileRequest(req)
      };

      const result = await SummaryService.summarize(params);
      
      // Set cache headers
      const cacheTime = params.isMobile ? 3600 : 1800;
      res.setHeader('Cache-Control', `public, max-age=${cacheTime}`);
      
      res.json(result);
    } catch (error) {
      console.error('Summary controller error:', error);
      
      // Try to return fallback
      if (req.query.fallback) {
        res.json({
          error: error.message,
          fallback: true,
          fullSummary: req.query.fallback,
          bullets: [`• ${req.query.fallback.substring(0, 300)}`]
        });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  static isMobileRequest(req) {
    const ua = req.headers['user-agent'] || '';
    return /mobile|android|iphone/i.test(ua) ||
           req.headers['x-mobile'] === 'true' ||
           req.headers['x-client-type'] === 'mobile';
  }
}