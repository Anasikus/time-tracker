import { useEffect, useState, useCallback } from 'react';
import { getPlaytimeByWeek } from '../services/api';
import type { Player } from '../types';
import dayjs from 'dayjs';
import Modal from './Modal';
import PlayerDetails from './PlayerDetails';
import PlaytimeTable from './PlaytimeTable';
import axios from 'axios';

type TimeLogEntry = {
  id: number;
  playerId: number;
  date: string;
  duration: number;
  createdAt: string;
};

type PlayerWithTimeLogs = {
  player: Player;
  timeLog: TimeLogEntry[];
};

type PlayerWithTimeLog = Player & {
  timeLog: Record<string, number>;
};

const PlayerListWithPlaytime = () => {
  const [startDate, setStartDate] = useState(dayjs().startOf('week'));
  const [endDate, setEndDate] = useState(dayjs().startOf('week').add(6, 'day'));

  const [days, setDays] = useState(() =>
    Array.from({ length: endDate.diff(startDate, 'day') + 1 }).map((_, i) =>
      startDate.add(i, 'day')
    )
  );

  const [data, setData] = useState<PlayerWithTimeLogs[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithTimeLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPlaytimeTable, setShowPlaytimeTable] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);

  // Обновление времени
  const fetchData = useCallback(async () => {
    try {
      const start = startDate.format('YYYY-MM-DD');
      const end = endDate.format('YYYY-MM-DD');
      const res = await getPlaytimeByWeek(start, end);
      setData(res.data);

      const countDays = endDate.diff(startDate, 'day') + 1;
      setDays(Array.from({ length: countDays }).map((_, i) => startDate.add(i, 'day')));
    } catch (error) {
      console.error('Ошибка при загрузке времени:', error);
    }
  }, [startDate, endDate]);

  // Загрузка игроков
  const fetchPlayers = useCallback(async () => {
    try {
      const res = await axios.get('/api/players');
      setPlayers(res.data);
    } catch (error) {
      console.error('Ошибка при загрузке игроков:', error);
    }
  }, []);

  // Загрузка данных при изменении дат
  useEffect(() => {
    fetchData();
    fetchPlayers();
  }, [fetchData, fetchPlayers]);

  // Обновление при редактировании
  const handleUpdated = () => {
    fetchPlayers();
    fetchData();
  };

  // Группировка
  const grouped: Record<number, PlayerWithTimeLog> = {};
  data.forEach(({ player, timeLog }) => {
    if (!grouped[player.id]) {
      grouped[player.id] = { ...player, timeLog: {} };
    }
    timeLog.forEach(log => {
      const dateStr = dayjs(log.date).format('YYYY-MM-DD');
      grouped[player.id].timeLog[dateStr] = log.duration;
    });
  });

  const getSquareColor = (duration: number): string => {
    if (duration === -1) return 'yellow';
    if (duration > 120) return 'blue';
    if (duration > 60) return 'green';
    if (duration > 0) return 'red';
    return 'gray';
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Отчёт по игрокам</h2>

      <div className="mb-4 flex gap-4 items-center">
        <label>
          С:{' '}
          <input
            type="date"
            value={startDate.format('YYYY-MM-DD')}
            onChange={e => {
              const newStart = dayjs(e.target.value);
              if (newStart.isAfter(endDate)) {
                alert('Дата начала не может быть позже даты окончания');
                return;
              }
              setStartDate(newStart);
            }}
            className="border p-1 rounded"
          />
        </label>

        <label>
          По:{' '}
          <input
            type="date"
            value={endDate.format('YYYY-MM-DD')}
            onChange={e => {
              const newEnd = dayjs(e.target.value);
              if (newEnd.isBefore(startDate)) {
                alert('Дата окончания не может быть раньше даты начала');
                return;
              }
              setEndDate(newEnd);
            }}
            className="border p-1 rounded"
          />
        </label>
      </div>

      <table className="w-full border border-collapse">
        <thead>
          <tr>
            <th>Код</th>
            <th>Игрок</th>
            {days.map(d => (
              <th key={d.format('YYYY-MM-DD')}>{d.format('dd')}</th>
            ))}
            <th>Итого</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(grouped).map(player => {
            const total = Object.values(player.timeLog || {}).reduce(
              (sum, min) => sum + min,
              0
            );

            const hours = isNaN(total) ? 0 : Math.floor(total / 60);
            const minutes = isNaN(total) ? 0 : total % 60;

            return (
              <tr key={player.id}>
                <td>{player.id}</td>
                <td
                  className="cursor-pointer hover:underline"
                  onClick={() => {
                    setSelectedPlayer(player);
                    setShowDetails(true);
                  }}
                >
                  <div>{player.nickname}</div>
                  <div className="text-sm text-gray-500">{player.position?.title ?? '—'}</div>
                  <div className="text-sm text-gray-500">{player.server?.name ?? '—'}</div>
                </td>

                {days.map(d => {
                  const dateStr = d.format('YYYY-MM-DD');
                  const min = player.timeLog[dateStr] ?? 0;
                  const color = getSquareColor(min);
                  return (
                    <td
                      key={dateStr}
                      title={min > 0 ? `${Math.floor(min / 60)} ч ${min % 60} мин\n${d.format('DD.MM')}` : d.format('DD.MM')}
                      onClick={() => {
                        setSelectedPlayer(player);
                        setShowPlaytimeTable(true);
                      }}
                      className="cursor-pointer select-none text-center"
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          margin: '0 auto',
                          backgroundColor: color,
                          borderRadius: 4,
                        }}
                      />
                    </td>
                  );
                })}

                <td>{hours} ч {minutes} мин</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {showDetails && selectedPlayer && (
        <Modal
          onClose={() => {
            setShowDetails(false);
            setSelectedPlayer(null);
          }}
        >
          <PlayerDetails
            player={selectedPlayer}
            onClose={() => {
              setShowDetails(false);
              setSelectedPlayer(null);
            }}
            onUpdated={handleUpdated}
          />
        </Modal>
      )}

      {showPlaytimeTable && (
        <Modal onClose={() => setShowPlaytimeTable(false)}>
        <PlaytimeTable
          onClose={() => setShowPlaytimeTable(false)}
          playerId={selectedPlayer?.id ?? 0}
          onSave={() => {
            setShowPlaytimeTable(false);
            handleUpdated(); // обновим данные
          }}
        />

        </Modal>
      )}
    </div>
  );
};

export default PlayerListWithPlaytime;
