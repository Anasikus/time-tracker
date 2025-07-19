// server/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import playerRoutes from './routes/players.js'
import playtimeRoutes from './routes/playtime.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to Time Tracker API');
});

app.use('/api/players', playerRoutes)
app.use('/api/playtime', playtimeRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
