// server/controllers/moderationController.js
import prisma from '../db/client.js';

// Получить всю модераторскую статистику
export const getModerationStats = async (req, res) => {
  try {
    const stats = await prisma.moderationStats.findMany({
      include: {
        player: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Преобразуем для удобства на фронте
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
  const { playerId, complaints, appeals, modComplaints, trainees, moderators } = req.body;

  try {
    const updated = await prisma.moderationStats.upsert({
      where: { playerId },
      update: { complaints, appeals, modComplaints, trainees, moderators },
      create: { playerId, complaints, appeals, modComplaints, trainees, moderators },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Ошибка при сохранении модераторской статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
