import express from 'express';
import { analyzeItems } from '../functions/ai-service-requests.js';

export const aiServiceRouter = express.Router();

aiServiceRouter.post('/analyze-items', async(req, res) => {
  const analyzedItems = await analyzeItems(req.body)
  res.json(analyzedItems);
});