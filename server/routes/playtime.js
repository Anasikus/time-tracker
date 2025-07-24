import express from 'express';
import {
  addPlaytime,
  getPlaytimeByWeek,
  getPlaytimeByDate,
  syncPlaytimeFromPanel,
} from '../controllers/playtimeController.js';

const router = express.Router();

router.post('/', addPlaytime);
router.get('/', getPlaytimeByWeek);
router.get('/date', getPlaytimeByDate);
router.post('/sync', syncPlaytimeFromPanel);

export default router; // ✅ это важно для ES-модулей
