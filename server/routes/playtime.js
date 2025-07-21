import express from 'express';
import { addPlaytime, getPlaytimeByWeek, getPlaytimeByDate } from '../controllers/playtimeController.js';

const router = express.Router();

router.post('/', addPlaytime);
router.get('/', getPlaytimeByWeek);
router.get('/date', getPlaytimeByDate);

export default router;
