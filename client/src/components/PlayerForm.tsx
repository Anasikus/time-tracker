import { useEffect, useState } from 'react';
import { createPlayer, getPositions, getServers, getStatuses } from '../services/api';
import type { Status, Position, Server } from '../types';

const PlayerForm = ({ onCreated }: { onCreated: () => void }) => {
  const [nickname, setNickname] = useState('');
  const [statusId, setStatusId] = useState<number>();
  const [positionId, setPositionId] = useState<number>();
  const [serverId, setServerId] = useState<number>();

  const [statuses, setStatuses] = useState<Status[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [servers, setServers] = useState<Server[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, p, srv] = await Promise.all([
          getStatuses(),
          getPositions(),
          getServers(),
        ]);
        setStatuses(s);
        setPositions(p);
        setServers(srv);

        // Устанавливаем значения по умолчанию
        if (s.length > 0) setStatusId(s[0].id);
        if (p.length > 0) setPositionId(p[0].id);
        if (srv.length > 0) setServerId(srv[0].id);
      } catch (error) {
        console.error('Ошибка при загрузке справочников:', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !statusId || !positionId || !serverId) return;

    try {
      await createPlayer({ nickname, statusId, positionId, serverId });
      setNickname('');
      onCreated();
    } catch (error) {
      console.error('Ошибка при создании игрока:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2 max-w-md">
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Никнейм"
        required
        className="p-2 border rounded text-gray-300 bg-black/60 border-2"
        style={{
          borderImage: 'linear-gradient(90deg, #5e00bd, #ca46fa) 1',
          borderImageSlice: 1
        }}
      />

      <select
        value={statusId}
        onChange={(e) => setStatusId(+e.target.value)}
        className="p-2 border rounded text-gray-300 bg-black/60 border-2"
        style={{
          borderImage: 'linear-gradient(90deg, #5e00bd, #ca46fa) 1',
          borderImageSlice: 1
        }}
        required
      >
        {statuses.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={positionId}
        onChange={(e) => setPositionId(+e.target.value)}
        className="p-2 border rounded text-gray-300 bg-black/60 border-2"
        style={{
          borderImage: 'linear-gradient(90deg, #5e00bd, #ca46fa) 1',
          borderImageSlice: 1
        }}
        required
      >
        {positions.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>

      <select
        value={serverId}
        onChange={(e) => setServerId(+e.target.value)}
        className="p-2 border rounded text-gray-300 bg-black/60 border-2"
        style={{
          borderImage: 'linear-gradient(90deg, #5e00bd, #ca46fa) 1',
          borderImageSlice: 1
        }}
        required
      >
        {servers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded shadow">
        Добавить игрока
      </button>
    </form>
  );
};

export default PlayerForm;
