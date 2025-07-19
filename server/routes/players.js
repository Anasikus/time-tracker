import express from 'express'
import {
  getAllPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
  getStatuses,
  getPositions,
  getServers,
} from '../controllers/playerController.js'

const router = express.Router()

// routes/players.js
router.get('/statuses', getStatuses);
router.get('/positions', getPositions);
router.get('/servers', getServers);

router.get('/', getAllPlayers)
router.get('/:id', getPlayerById)
router.post('/', createPlayer)
router.put('/:id', updatePlayer)
router.delete('/:id', deletePlayer)



export default router
