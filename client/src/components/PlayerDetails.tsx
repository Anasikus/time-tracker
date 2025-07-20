import { useEffect, useState } from 'react';
import type { Player } from '../types';
import axios from 'axios';

interface PlayerDetailsProps {
  player: Player;
  onClose: () => void;
  onUpdated?: () => void;
}

const PlayerDetails = ({ player: initialPlayer, onClose, onUpdated }: PlayerDetailsProps) => {
  const [player, setPlayer] = useState(initialPlayer);
  const [isEditing, setIsEditing] = useState(false);

  const [nickname, setNickname] = useState(player.nickname ?? '');
  const [statusId, setStatusId] = useState(player.status?.id ?? '');
  const [positionId, setPositionId] = useState(player.position?.id ?? '');
  const [serverId, setServerId] = useState(player.server?.id ?? '');

  const [statuses, setStatuses] = useState([]);
  const [positions, setPositions] = useState([]);
  const [servers, setServers] = useState([]);

  useEffect(() => {
    setPlayer(initialPlayer);
    setNickname(initialPlayer.nickname ?? '');
    setStatusId(initialPlayer.status?.id ?? '');
    setPositionId(initialPlayer.position?.id ?? '');
    setServerId(initialPlayer.server?.id ?? '');
  }, [initialPlayer]);

  useEffect(() => {
    if (isEditing) {
      axios.get('/api/players/statuses').then(res => setStatuses(res.data));
      axios.get('/api/players/positions').then(res => setPositions(res.data));
      axios.get('/api/players/servers').then(res => setServers(res.data));
    }
  }, [isEditing]);

  const refetchPlayer = async () => {
    try {
      const res = await axios.get(`/api/players/${player.id}`);
      setPlayer(res.data);
    } catch (error) {
      console.error('Ошибка при повторной загрузке игрока:', error);
    }
  };

  const handleSave = async () => {
    try {
      await axios.put(`/api/players/${player.id}`, {
        nickname,
        statusId: Number(statusId),
        positionId: Number(positionId),
        serverId: Number(serverId),
      });
      setIsEditing(false);
      onUpdated?.();
      refetchPlayer(); // 🔁 Обновить данные игрока
    } catch (error) {
      console.error('Ошибка при обновлении игрока:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить игрока?')) return;
    try {
      await axios.delete(`/api/players/${player.id}`);
      onUpdated?.();
      onClose();
    } catch (error) {
      console.error('Ошибка при удалении игрока:', error);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Информация об игроке</h3>

      <p><strong>Код:</strong> {player.id}</p>

      {isEditing ? (
        <>
          <p><strong>Ник:</strong> <input value={nickname} onChange={e => setNickname(e.target.value)} className="border p-1 rounded" /></p>

          <p><strong>Статус:</strong>
            <select value={statusId} onChange={e => setStatusId(e.target.value)} className="border p-1 rounded ml-2">
              <option value="">—</option>
              {statuses.map((s: any) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </p>

          <p><strong>Должность:</strong>
            <select value={positionId} onChange={e => setPositionId(e.target.value)} className="border p-1 rounded ml-2">
              <option value="">—</option>
              {positions.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </p>

          <p><strong>Сервер:</strong>
            <select value={serverId} onChange={e => setServerId(e.target.value)} className="border p-1 rounded ml-2">
              <option value="">—</option>
              {servers.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </p>
        </>
      ) : (
        <>
          <p><strong>Ник:</strong> {player.nickname ?? '—'}</p>
          <p><strong>Статус:</strong> {player.status?.label ?? '—'}</p>
          <p><strong>Должность:</strong> {player.position?.title ?? '—'}</p>
          <p><strong>Сервер:</strong> {player.server?.name ?? '—'}</p>
        </>
      )}

      <div className="mt-4 flex gap-2">
        {isEditing ? (
          <button
            onClick={handleSave}
            className="bg-purple-600 text-white px-4 py-1 rounded hover:bg-purple-700"
          >
            Сохранить
          </button>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-purple-600 text-white px-4 py-1 rounded hover:bg-purple-700"
            >
              Редактировать
            </button>
            <button
              onClick={handleDelete}
              className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500"
            >
              Удалить
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-600 ml-auto"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default PlayerDetails;
