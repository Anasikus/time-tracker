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
  statusId: number;
  positionId: number;
  serverId: number;
}) => {
  await API.post('/players', data);
};