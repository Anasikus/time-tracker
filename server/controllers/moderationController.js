// server/controllers/moderationController.js
import prisma from '../db/client.js';

// Получить всю модераторскую статистику
export const getModerationStats = async (req, res) => {
  const { month } = req.query;

  try {
    const dateObj = new Date(month); // Пример: "2025-07-01"

    const stats = await prisma.moderationStats.findMany({
      where: { month: dateObj },
      include: {
        player: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    const result = stats.map((stat) => ({
      playerId: stat.player.id,
      nickname: stat.player.nickname,
      complaints: stat.complaints,
      appeals: stat.appeals,
      modComplaints: stat.modComplaints,
      trainees: stat.trainees,
      moderators: stat.moderators,
    }));

    res.json(result);
  } catch (error) {
    console.error('Ошибка при получении модераторской статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Создать или обновить статистику
export const saveModerationStat = async (req, res) => {
  const {
    playerId,
    complaints,
    appeals,
    modComplaints,
    trainees,
    moderators,
    month,
  } = req.body;

  try {
    const dateObj = new Date(month); // month приходит как строка YYYY-MM-01

    const updated = await prisma.moderationStats.upsert({
      where: {
        playerId_month: {
          playerId,
          month: dateObj,
        },
      },
      update: {
        complaints,
        appeals,
        modComplaints,
        trainees,
        moderators,
      },
      create: {
        playerId,
        month: dateObj,
        complaints,
        appeals,
        modComplaints,
        trainees,
        moderators,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Ошибка при сохранении модераторской статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};


// Получить всех игроков (id + nickname)
export const getAllPlayersBasic = async (req, res) => {
  try {
    const players = await prisma.player.findMany({
      select: {
        id: true,
        nickname: true,
      },
      orderBy: {
        nickname: 'asc', // по желанию
      },
    });

    res.json(players);
  } catch (error) {
    console.error('Ошибка при получении списка игроков:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
