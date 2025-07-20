import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllPlayers = async (req, res) => {
  try {
    const players = await prisma.player.findMany({
      include: {
        status: true,
        position: true,
        server: true,
        timeLogs: true,
      },
    });
    res.json(players);
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({ error: "Failed to fetch players." });
  }
};

export const createPlayer = async (req, res) => {
  try {
    const { nickname, statusId, positionId, serverId } = req.body;

    if (!nickname || !statusId || !positionId) {
      return res.status(400).json({ error: "nickname, statusId, and positionId are required." });
    }

    const newPlayer = await prisma.player.create({
      data: {
        nickname,
        statusId,
        positionId,
        serverId: serverId || null,
      },
    });

    res.status(201).json(newPlayer);
  } catch (error) {
    console.error("Error creating player:", error);
    res.status(500).json({ error: "Failed to create player." });
  }
};

export const updatePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, statusId, positionId, serverId } = req.body;

    if (!nickname || !statusId || !positionId) {
      return res.status(400).json({ error: "nickname, statusId, and positionId are required." });
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: Number(id) },
      data: {
        nickname,
        statusId,
        positionId,
        serverId: serverId || null,
      },
    });

    res.json(updatedPlayer);
  } catch (error) {
    console.error("Error updating player:", error);
    res.status(500).json({ error: "Failed to update player." });
  }
};

export const deletePlayer = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.timeLog.deleteMany({
      where: { playerId: Number(id) },
    });

    await prisma.player.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: "Player deleted successfully." });
  } catch (error) {
    console.error("Error deleting player:", error);
    res.status(500).json({ error: "Failed to delete player." });
  }
};

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
  try {
    const positions = await prisma.position.findMany();
    res.json(positions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get positions' });
  }
};

export const getServers = async (req, res) => {
  try {
    const data = await prisma.server.findMany();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get servers' });
  }
};
