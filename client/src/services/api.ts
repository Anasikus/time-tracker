import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:4000/api' });

// players
export const getPlayers = () => API.get('/players');
export const getPlayer = (id: number) => API.get(`/players/${id}`);
export const updatePlayer = (id: number, data: any) => API.put(`/players/${id}`, data);
export const deletePlayer = (id: number) => API.delete(`/players/${id}`);

// справочники
export const getStatuses = async () => {
  const res = await API.get('/players/statuses'); // ✅ исправлено
  return res.data;
};

export const getPositions = async () => {
  const res = await API.get('/players/positions'); // ✅ исправлено
  return res.data;
};

export const getServers = async () => {
  const res = await API.get('/players/servers'); // ✅ исправлено
  return res.data;
};


export const createPlayer = async (data: {
  nickname: string;
  uuid?: string;
  statusId: number;
  positionId: number;
  serverId: number;
}) => {
  await API.post('/players', data);
};

export const getPlaytimeByWeek = async (start: string, end: string) => {
  return await API.get(`/playtime?start=${start}&end=${end}`);
};

export const addPlaytime = async (entry: { playerId: number; date: string; duration: number }) => {
  return await API.post('/playtime', entry);
};
