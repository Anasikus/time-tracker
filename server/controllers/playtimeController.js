import prisma from '../db/client.js';

export const addPlaytime = async (req, res) => {
  const { playerId, date, duration } = req.body;

  try {
    const existing = await prisma.timeLog.findUnique({
      where: { playerId_date: { playerId, date: new Date(date) } },
    });

    if (existing) {
      await prisma.timeLog.update({
        where: { playerId_date: { playerId, date: new Date(date) } },
        data: { duration },
      });
    } else {
      await prisma.timeLog.create({
        data: {
          playerId,
          date: new Date(date),
          duration,
        },
      });
    }

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка записи времени' });
  }
};

export const getPlaytimeByWeek = async (req, res) => {
  const { start, end } = req.query;

  const [players, timeLogs] = await Promise.all([
    prisma.player.findMany({
      include: { position: true } // <--- добавили
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
      name: player.name,
      status: player.status,
    },
    timeLog: groupedLogs[player.id] || [],
  }));

  res.json(result);
};
