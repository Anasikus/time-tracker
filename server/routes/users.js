// server/routes/users.js
import express from 'express';
import { getAllUsers, createUser } from '../models/userModel.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const users = await getAllUsers();
  res.json(users);
});

router.post('/', async (req, res) => {
  const newUser = await createUser(req.body);
  res.json(newUser);
});

export default router;
