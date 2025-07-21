import { useEffect, useState } from 'react';
import type { Player, Status, Position, Server } from '../types';
import axios from 'axios';
import dayjs from 'dayjs';

interface PlayerDetailsProps {
  player: Player;
  onClose: () => void;
  onUpdated?: () => void;
}

const PlayerDetails = ({ player, onClose, onUpdated }: PlayerDetailsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localPlayer, setLocalPlayer] = useState<Player>(player);

  const [nickname, setNickname] = useState(player.nickname ?? '');
  const [statusId, setStatusId] = useState(player.status?.id ?? '');
  const [positionId, setPositionId] = useState(player.position?.id ?? '');
  const [serverId, setServerId] = useState(player.server?.id ?? '');
  const [vacationStart, setVacationStart] = useState(
    player.vacationStart ? dayjs(player.vacationStart).format('YYYY-MM-DD') : ''
  );
  const [vacationEnd, setVacationEnd] = useState(
    player.vacationEnd ? dayjs(player.vacationEnd).format('YYYY-MM-DD') : ''
  );
  const [comment, setComment] = useState(player.comment ?? '');

  const [statuses, setStatuses] = useState<Status[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [servers, setServers] = useState<Server[]>([]);

  const [isVacationStatus, setIsVacationStatus] = useState(false);

  useEffect(() => {
    if (isEditing) {
      axios.get('/api/players/statuses').then((res) => setStatuses(res.data));
      axios.get('/api/players/positions').then((res) => setPositions(res.data));
      axios.get('/api/players/servers').then((res) => setServers(res.data));
    }
  }, [isEditing]);

  useEffect(() => {
    const status = statuses.find((s) => Number(s.id) === Number(statusId));
    setIsVacationStatus(status?.label.toLowerCase() === 'в отпуске');
  }, [statusId, statuses]);

  const handleSave = async () => {
    try {
      await axios.put(`/api/players/${localPlayer.id}`, {
        nickname,
        statusId: Number(statusId),
        positionId: Number(positionId),
        serverId: serverId ? Number(serverId) : null,
        vacationStart: vacationStart || null,
        vacationEnd: vacationEnd || null,
        comment,
      });

      const updated = await axios.get(`/api/players/${localPlayer.id}`);
      setLocalPlayer(updated.data);
      setIsEditing(false);
      onUpdated?.();
    } catch (error) {
      console.error('Failed to update player:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить игрока?')) return;
    try {
      await axios.delete(`/api/players/${localPlayer.id}`);
      onUpdated?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete player:', error);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-[#1a1a1a] p-6 rounded-xl shadow-lg text-white flex flex-col gap-4">
      <h3 className="text-2xl font-semibold border-b border-purple-700 pb-2 mb-4">Информация об игроке</h3>

      {isEditing ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSave();
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-300">Ник</label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full p-2 rounded bg-[#121212] border border-transparent focus:border-purple-600 focus:ring-2 focus:ring-purple-600 text-gray-300 transition"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-300">Статус</label>
            <select
              value={statusId}
              onChange={e => setStatusId(e.target.value)}
              className="w-full p-2 rounded bg-[#121212] border border-transparent focus:border-purple-600 focus:ring-2 focus:ring-purple-600 text-gray-300 transition"
              required
            >
              <option value="">—</option>
              {statuses.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {isVacationStatus && (
            <div className="flex gap-4 items-center text-gray-400">
              <div className="flex flex-col flex-1">
                <label className="text-sm mb-1">Период отпуска — с</label>
                <input
                  type="date"
                  value={vacationStart}
                  onChange={e => setVacationStart(e.target.value)}
                  className="p-2 rounded bg-[#121212] border border-transparent focus:border-purple-600 focus:ring-2 focus:ring-purple-600 text-gray-300 transition"
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-sm mb-1">по</label>
                <input
                  type="date"
                  value={vacationEnd}
                  onChange={e => setVacationEnd(e.target.value)}
                  className="p-2 rounded bg-[#121212] border border-transparent focus:border-purple-600 focus:ring-2 focus:ring-purple-600 text-gray-300 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-300">Должность</label>
            <select
              value={positionId}
              onChange={e => setPositionId(e.target.value)}
              className="w-full p-2 rounded bg-[#121212] border border-transparent focus:border-purple-600 focus:ring-2 focus:ring-purple-600 text-gray-300 transition"
              required
            >
              <option value="">—</option>
              {positions.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-300">Сервер</label>
            <select
              value={serverId}
              onChange={e => setServerId(e.target.value)}
              className="w-full p-2 rounded bg-[#121212] border border-transparent focus:border-purple-600 focus:ring-2 focus:ring-purple-600 text-gray-300 transition"
            >
              <option value="">—</option>
              {servers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-300">Комментарий</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Комментарий к игроку"
              className="w-full p-2 rounded bg-[#121212] border border-transparent focus:border-purple-600 focus:ring-2 focus:ring-purple-600 text-gray-300 transition resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded font-semibold transition"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded transition"
            >
              Отмена
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 text-gray-300">
          <p><strong>Ник:</strong> {localPlayer.nickname ?? '—'}</p>
          <p><strong>Статус:</strong> {localPlayer.status?.label ?? '—'}</p>

          {localPlayer.status?.label.toLowerCase() === 'в отпуске' && (
            <p>
              <strong>Период отпуска:</strong>{' '}
              {localPlayer.vacationStart
                ? dayjs(localPlayer.vacationStart).format('DD.MM.YYYY')
                : '—'}{' '}
              —{' '}
              {localPlayer.vacationEnd
                ? dayjs(localPlayer.vacationEnd).format('DD.MM.YYYY')
                : 'по настоящее время'}
            </p>
          )}

          <p><strong>Должность:</strong> {localPlayer.position?.title ?? '—'}</p>
          <p><strong>Сервер:</strong> {localPlayer.server?.name ?? '—'}</p>
          <p><strong>Комментарий:</strong><br />{localPlayer.comment || '—'}</p>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded font-semibold transition"
            >
              Редактировать
            </button>
            <button
              onClick={handleDelete}
              className="bg-gray-600 hover:bg-gray-700 px-5 py-2 rounded transition"
            >
              Удалить
            </button>
            <button
              onClick={onClose}
              className="ml-auto bg-gray-600 hover:bg-gray-700 px-5 py-2 rounded transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerDetails;
