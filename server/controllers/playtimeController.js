import prisma from '../db/client.js';

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
      update: {
        duration,
      },
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
            gte: new Date(start),
            lte: new Date(end),
          },
        },
      }),
    ]);

    const groupedLogs = timeLogs.reduce((acc, log) => {
      if (!acc[log.playerId]) {
        acc[log.playerId] = [];
      }
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
      },
      timeLog: groupedLogs[player.id] || [],
    }));

    res.json(result);
  } catch (error) {
    console.error('[getPlaytimeByWeek] Ошибка:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении данных' });
  }
};
