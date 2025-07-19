import prisma from '../db/client.js';

// Получить всех игроков
export const getAllPlayers = async (req, res) => {
  try {
    const players = await prisma.player.findMany({
      include: {
        status: true,
        position: true,
        server: true,
      },
    });
    res.json(players);
  } catch (error) {
    console.error('Error getting players:', error);
    res.status(500).json({ error: 'Failed to get players' });
  }
};

// Получить игрока по ID
export const getPlayerById = async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  try {
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        status: true,
        position: true,
        server: true,
      },
    });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
};

// Создать игрока
export const createPlayer = async (req, res) => {
  const { nickname, statusId, positionId, serverId } = req.body;
  if (!nickname || !statusId || !positionId || !serverId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const newPlayer = await prisma.player.create({
      data: {
        nickname,
        statusId,
        positionId,
        serverId,
      },
    });
    res.status(201).json(newPlayer);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
};

// Обновить игрока
export const updatePlayer = async (req, res) => {
  const id = Number(req.params.id);
  const { nickname, statusId, positionId, serverId } = req.body;

  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  try {
    const existing = await prisma.player.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Player not found' });

    const updated = await prisma.player.update({
      where: { id },
      data: {
        nickname,
        statusId,
        positionId,
        serverId,
      },
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
};

// Удалить игрока
export const deletePlayer = async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  try {
    await prisma.player.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
};

export const getStatuses = async (req, res) => {
  try {
    const statuses = await prisma.status.findMany();
    res.json(statuses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get statuses' });
  }
};

export const getPositions = async (req, res) => {
  const positions = await prisma.position.findMany();
  res.json(positions);
};

export const getServers = async (req, res) => {
  const data = await prisma.server.findMany();
  res.json(data);
};