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
    <div>
      <h3 className="text-lg font-semibold mb-2">Информация об игроке</h3>

      <p><strong>Код:</strong> {localPlayer.id}</p>

      {isEditing ? (
        <>
          <p>
            <strong>Ник:</strong>{' '}
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="border p-1 rounded"
            />
          </p>

          <p>
            <strong>Статус:</strong>{' '}
            <select
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              className="border p-1 rounded ml-2"
            >
              <option value="">—</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </p>

          {isVacationStatus && (
            <div className="mb-3 ml-6">
              <p><strong>Период отпуска (необязательно):</strong></p>
              <label className="mr-2">
                С:{' '}
                <input
                  type="date"
                  value={vacationStart}
                  onChange={(e) => setVacationStart(e.target.value)}
                  className="border p-1 rounded"
                />
              </label>
              <label>
                По:{' '}
                <input
                  type="date"
                  value={vacationEnd}
                  onChange={(e) => setVacationEnd(e.target.value)}
                  className="border p-1 rounded"
                />
              </label>
            </div>
          )}

          <p>
            <strong>Должность:</strong>{' '}
            <select
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              className="border p-1 rounded ml-2"
            >
              <option value="">—</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </p>

          <p>
            <strong>Сервер:</strong>{' '}
            <select
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              className="border p-1 rounded ml-2"
            >
              <option value="">—</option>
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </p>

          <p>
            <strong>Комментарий:</strong><br />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="border p-1 rounded w-full"
              rows={3}
              placeholder="Комментарий к игроку"
            />
          </p>
        </>
      ) : (
        <>
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
