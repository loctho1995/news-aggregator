import { NewsService } from '../services/news.service.js';

export class NewsController {
  static async getNews(req, res) {
    try {
      const params = {
        sources: req.query.sources?.split(',').filter(Boolean) || [],
        hours: parseInt(req.query.hours || '24'),
        limit: parseInt(req.query.limit || '30'),
        group: req.query.group !== 'all' ? req.query.group : null,
        stream: req.query.stream === 'true'
      };

      if (params.stream) {
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Cache-Control', 'no-cache');
        
        await NewsService.streamNews(params, (item) => {
          res.write(JSON.stringify(item) + '\n');
        });
        
        res.end();
      } else {
        const items = await NewsService.fetchNews(params);
        res.json({ items });
      }
    } catch (error) {
      console.error('News controller error:', error);
      res.status(500).json({ 
        error: error.message || 'Internal server error' 
      });
    }
  }
}