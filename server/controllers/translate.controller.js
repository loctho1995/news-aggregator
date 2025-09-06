import { TranslationService } from '../services/translation.service.js';

export class TranslateController {
  static async translate(req, res) {
    try {
      const isPost = req.method === 'POST';
      
      let params;
      if (isPost) {
        params = {
          text: req.body.text,
          texts: req.body.texts,
          target: req.body.target || 'vi'
        };
      } else {
        params = {
          text: req.query.q,
          target: req.query.target || 'vi'
        };
      }

      const result = await TranslationService.translate(params);
      res.json(result);
    } catch (error) {
      console.error('Translation error:', error);
      
      // Always return original text on error
      const original = req.body?.text || req.query?.q || '';
      res.json({
        translatedText: original,
        fallback: true,
        error: error.message
      });
    }
  }
}