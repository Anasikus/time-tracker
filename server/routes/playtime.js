import express from 'express';
import { addPlaytime, getPlaytimeByWeek } from '../controllers/playtimeController.js';

const router = express.Router();

router.post('/', addPlaytime);
router.get('/', getPlaytimeByWeek);

export default router;
