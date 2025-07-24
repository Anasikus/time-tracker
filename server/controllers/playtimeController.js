import prisma from '../db/client.js';
import dayjs from 'dayjs';

export const addPlaytime = async (req, res) => {
  try {
    const { playerId, date, duration } = req.body;

    console.log('[addPlaytime] Called with:', req.body);

    const result = await prisma.timeLog.upsert({
      where: {
        playerId_date: {
          playerId,
          date: new Date(date),
        },
      },
      update: { duration },
      create: {
        playerId,
        date: new Date(date),
        duration,
      },
    });

    console.log('[addPlaytime] Upserted entry:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error('[addPlaytime] Ошибка при создании:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const getPlaytimeByWeek = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'Missing start or end date' });
    }

    const startDate = new Date(dayjs(start).startOf('day').toISOString());
    const endDate = new Date(dayjs(end).endOf('day').toISOString());

    const [players, timeLogs] = await Promise.all([
      prisma.player.findMany({
        include: {
          position: true,
          status: true,
          server: true,
        },
      }),
      prisma.timeLog.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    const groupedLogs = timeLogs.reduce((acc, log) => {
      if (!acc[log.playerId]) acc[log.playerId] = [];
      acc[log.playerId].push(log);
      return acc;
    }, {});

    const result = players.map(player => ({
      player: {
        id: player.id,
        nickname: player.nickname,
        status: player.status,
        position: player.position,
        server: player.server,
        vacationStart: player.vacationStart,
        vacationEnd: player.vacationEnd,
        comment: player.comment,
      },
      timeLog: groupedLogs[player.id] || [],
    }));

    res.json(result);
  } catch (error) {
    console.error('[getPlaytimeByWeek] Ошибка:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении данных' });
  }
};

export const getPlaytimeByDate = async (req, res) => {
  try {
    const { playerId, date } = req.query;
    if (!playerId || !date) {
      return res.status(400).json({ error: 'Missing playerId or date' });
    }

    const entry = await prisma.timeLog.findFirst({
      where: {
        playerId: parseInt(playerId),
        date: new Date(date),
      },
    });

    if (!entry) return res.status(404).json({});

    res.json({ duration: entry.duration });
  } catch (error) {
    console.error('[getPlaytimeByDate] Ошибка:', error);
    res.status(500).json({ error: 'Ошибка при получении записи' });
  }
};
