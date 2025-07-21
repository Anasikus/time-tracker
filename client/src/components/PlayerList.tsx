import { useEffect, useState, useCallback } from 'react';
import { getPlaytimeByWeek } from '../services/api';
import type { Player } from '../types';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

import Modal from './Modal';
import PlayerDetails from './PlayerDetails';
import PlaytimeTable from './PlaytimeTable';

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdated = () => {
    fetchData();
  };

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

  const getSquareColor = (date: dayjs.Dayjs, player: PlayerWithTimeLog): string => {
    const start = player.vacationStart ? dayjs(player.vacationStart) : null;
    const end = player.vacationEnd ? dayjs(player.vacationEnd) : null;

    const inVacation =
      start &&
      (end ? date.isBetween(start, end, 'day', '[]') : date.isSame(start) || date.isAfter(start));

    const duration = player.timeLog[date.format('YYYY-MM-DD')] ?? 0;

    if (inVacation){
      if (duration > 0){
        return 'orange';
      }
      return 'yellow'
    };

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

      <table className="w-full border border-collapse text-center">
        <thead>
          <tr>
            <th className="text-center align-middle">Код</th>
            <th className="text-center align-middle">Игрок</th>
            {days.map(d => (
              <th key={d.format('YYYY-MM-DD')} className="text-center align-middle">
                {d.format('dd')}
              </th>
            ))}
            <th className="text-center align-middle">Итого</th>
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
              <tr key={player.id} className="text-center align-middle">
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
                  const color = getSquareColor(d, player);

                  // Формируем подсказку с датой и временем
                  const hoursDay = Math.floor(min / 60);
                  const minutesDay = min % 60;
                  const title =
                    min > 0
                      ? `${d.format('DD.MM.YYYY')}\n${hoursDay} ч ${minutesDay} мин`
                      : d.format('DD.MM.YYYY');

                  return (
                    <td
                      key={dateStr}
                      title={title}
                      onClick={() => {
                        setSelectedPlayer(player);
                        setSelectedDate(dateStr);
                        setShowPlaytimeTable(true);
                      }}
                      className="cursor-pointer select-none"
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

                <td>
                  {hours} ч {minutes} мин
                </td>
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

      {showPlaytimeTable && selectedPlayer && selectedDate && (
        <Modal onClose={() => setShowPlaytimeTable(false)}>
          <PlaytimeTable
            onClose={() => setShowPlaytimeTable(false)}
            playerId={selectedPlayer.id}
            initialDate={selectedDate}
            onSave={() => {
              setShowPlaytimeTable(false);
              handleUpdated();
            }}
            vacationStart={selectedPlayer.vacationStart}
            vacationEnd={selectedPlayer.vacationEnd}
          />
        </Modal>
      )}
    </div>
  );
};

export default PlayerListWithPlaytime;
