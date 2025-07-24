import prisma from '../db/client.js';
import dayjs from 'dayjs';
import axios from 'axios';

const jwt_token = process.env.METALABS_JWT_TOKEN;
const url = "https://panel.metalabs.work/api/v1/rest/proxy?rest=meta&method=v3%2Fplaytime%2Fgribland%2Fhitech%2Flist";

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

function getDateList(min, max) {
  const start = new Date(min);
  const end = new Date(max);
  const dates = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // Клонируем дату, иначе mutates
    dates.push(new Date(d).toISOString().slice(0, 10));
  }

  return dates;
}

export const syncPlaytimeFromPanel = async (req, res) => {
  const { start, end, preview } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'Missing start or end date' });
  }

  try {
    const playersWithUuid = await prisma.player.findMany({
      where: { uuid: { not: null } },
    });

    const uuidToPlayerMap = Object.fromEntries(
      playersWithUuid.map(p => [p.uuid, p])
    );

    const payload = {
      min: start,
      max: end,
      uuids: playersWithUuid.map(p => p.uuid),
    };

    const headers = {
      accept: 'application/json',
      'content-type': 'application/json',
      referer: 'https://panel.metalabs.work/gribland/hitech/online',
      cookie: `metapanel_accessToken=${process.env.METALABS_JWT_TOKEN}`,
    };

    const response = await axios.post(url, payload, { headers });
    const data = response.data.body;
    const dateList = getDateList(start, end);

    const previewData = [];

    for (const [uuid, logs] of Object.entries(data)) {
      const player = uuidToPlayerMap[uuid];
      if (!player) continue;

      for (const date of dateList) {
        const seconds = logs.onlinePoints?.[date] ?? 0;
        const minutes = Math.round(seconds / 60);
        previewData.push({
          playerId: player.id,
          nickname: player.nickname,
          uuid: player.uuid,
          date,
          duration: minutes,
        });
      }
    }

    if (preview === 'true') {
      return res.status(200).json({ preview: previewData });
    }

    // Сохраняем в БД, если не preview
    const upserts = previewData.map(entry =>
      prisma.timeLog.upsert({
        where: {
          playerId_date: {
            playerId: entry.playerId,
            date: new Date(entry.date),
          },
        },
        update: { duration: entry.duration },
        create: {
          playerId: entry.playerId,
          date: new Date(entry.date),
          duration: entry.duration,
        },
      })
    );

    await prisma.$transaction(upserts);
    res.status(200).json({ message: 'Данные синхронизированы', count: upserts.length });

  } catch (err) {
    console.error('[syncPlaytimeFromPanel] Ошибка:', err);
    res.status(500).json({ error: 'Ошибка при синхронизации данных' });
  }
};

