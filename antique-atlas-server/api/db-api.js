import { fetchPaginatedItems, fetchItemCount } from '../functions/database-operations.js';
import express from 'express';

export const dbRouter = express.Router();

dbRouter.post('/fetch-paginated-items', async (req, res) => {
  const fetchType = req.query.fetchType;
  const pageNum = req.query.pageNum;
  const {searchId, prev, next, direction} = req.body;
  const resp = await fetchPaginatedItems(searchId, prev, next, direction, fetchType, pageNum);
  res.json(resp);
});

dbRouter.get('/fetch-item-count', async (req, res) => {
  const resp = await fetchItemCount(req.query.searchId);
  res.json(resp);
});