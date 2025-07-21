// server/routes/moderation.js
import express from 'express';
import { getModerationStats, saveModerationStat, getAllPlayersBasic } from '../controllers/moderationController.js';

const router = express.Router();

router.get('/', getModerationStats);
router.post('/', saveModerationStat);
router.get('/players-basic', getAllPlayersBasic);

export default router;
