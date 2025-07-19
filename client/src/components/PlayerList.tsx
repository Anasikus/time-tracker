import { useEffect, useState } from 'react';
import { getPlaytimeByWeek } from '../services/api';
import type { PlaytimeEntry, Player } from '../types';
import dayjs from 'dayjs';
import Modal from './Modal';
import PlayerDetails from './PlayerDetails';
import PlaytimeTable from './PlaytimeTable';

const days = Array.from({ length: 7 }).map((_, i) => dayjs().startOf('week').add(i, 'day'));

type PlayerWithTimeLog = Player & {
  timeLog: Record<string, number>;
};

const PlayerListWithPlaytime = () => {
  const [data, setData] = useState<PlaytimeEntry[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithTimeLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPlaytimeTable, setShowPlaytimeTable] = useState(false);

  useEffect(() => {
    const load = async () => {
      const start = days[0].format('YYYY-MM-DD');
      const end = days[6].format('YYYY-MM-DD');
      const res = await getPlaytimeByWeek(start, end);
      console.log('Полученные данные:', res.data);
      setData(res.data);
    };
    load();
  }, []);

  const grouped: Record<number, PlayerWithTimeLog> = data.reduce((acc, entry) => {
    const id = entry.player.id;
    const dateStr = dayjs(entry.date).format('YYYY-MM-DD');
    if (!acc[id]) {
      acc[id] = { ...entry.player, timeLog: {} };
    }
    acc[id].timeLog[dateStr] = entry.duration;
    return acc;
  }, {} as Record<number, PlayerWithTimeLog>);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Отчёт по игрокам</h2>
      <table className="w-full border">
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
          {Object.values(grouped).map((player) => {
            const total = Object.values(player.timeLog).reduce(
              (sum, min) => sum + min,
              0
            );

            return (
              <tr key={player.id}>
                <td>{player.id}</td>
                <td
                  className="cursor-pointer hover:underline"
                  onClick={() => {
                    console.log('Выбранный игрок:', player);
                    setSelectedPlayer(player);
                    setShowDetails(true);
                  }}
                >
                  <div>{player.nickname}</div>
                  <div className="text-sm text-gray-500">{player.position?.title ?? "—"}</div>
                  <div className="text-sm text-gray-500">{player.status?.label ?? "—"}</div>
                </td>
                {days.map(d => {
                  const dateStr = d.format('YYYY-MM-DD');
                  const min = player.timeLog[dateStr] || 0;
                  const h = Math.floor(min / 60);
                  const m = min % 60;
                  return (
                    <td key={dateStr}>
                      <div
                        className="w-5 h-5 rounded bg-purple-400 hover:bg-purple-600 tooltip"
                        title={`${h} ч ${m} мин\n${d.format('DD.MM')}`}
                        onClick={() => setShowPlaytimeTable(true)}
                      ></div>
                    </td>
                  );
                })}
                <td>{Math.floor(total / 60)} ч {total % 60} мин</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Детали игрока */}
      {showDetails && selectedPlayer && (
        <Modal onClose={() => {
          setShowDetails(false);
          setSelectedPlayer(null);
        }}>
          <PlayerDetails player={selectedPlayer} onClose={() => {
            setShowDetails(false);
            setSelectedPlayer(null);
          }} />
        </Modal>
      )}

      {/* Детали времени */}
      {showPlaytimeTable && (
        <Modal onClose={() => setShowPlaytimeTable(false)}>
          <PlaytimeTable onClose={() => setShowPlaytimeTable(false)} />

        </Modal>
      )}
    </div>
  );
};

export default PlayerListWithPlaytime;
