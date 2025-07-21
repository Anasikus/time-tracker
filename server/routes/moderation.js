// server/routes/moderation.js
import express from 'express';
import { getModerationStats, saveModerationStat } from '../controllers/moderationController.js';

const router = express.Router();

router.get('/', getModerationStats);
router.post('/', saveModerationStat);

export default router;
