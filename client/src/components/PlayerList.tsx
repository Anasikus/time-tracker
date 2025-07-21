import { useEffect, useState, useCallback } from 'react';
import { getPlaytimeByWeek } from '../services/api';
import type { Player } from '../types';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import * as XLSX from 'xlsx';
import ServerHeader from './ServerHeader';
import Modal from './Modal';
import PlayerDetails from './PlayerDetails';
import PlaytimeTable from './PlaytimeTable';
import PlayerForm from './PlayerForm';


dayjs.extend(isBetween);

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
  const today = dayjs();
  const [month, setMonth] = useState(today.month());
  const [year, setYear] = useState(today.year());
  const [weekIndex, setWeekIndex] = useState(0);
  const [servers, setServers] = useState<string[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);


  const weekStart = dayjs()
    .year(year)
    .month(month)
    .startOf('month')
    .startOf('week')
    .add(weekIndex * 7, 'day');
  const weekEnd = weekStart.add(6, 'day');

  const [days, setDays] = useState(() =>
    Array.from({ length: 7 }).map((_, i) => weekStart.add(i, 'day'))
  );

  const [data, setData] = useState<PlayerWithTimeLogs[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithTimeLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPlaytimeTable, setShowPlaytimeTable] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const start = weekStart.format('YYYY-MM-DD');
    const end = weekEnd.format('YYYY-MM-DD');
    try {
      const res = await getPlaytimeByWeek(start, end);
      setData(res.data);

      const serverNames = Array.from(
        new Set(
          res.data
            .map((item: PlayerWithTimeLogs) => item.player.server?.name)
            .filter(Boolean)
        )
      ) as string[];
      setServers(serverNames);

      setDays(Array.from({ length: 7 }).map((_, i) => weekStart.add(i, 'day')));
    } catch (err) {
      console.error('Ошибка при загрузке:', err);
    }
  }, [weekStart, weekEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPlayers = data
    .filter(p => !selectedServer || p.player.server?.name === selectedServer)
    .filter(
      p =>
        !searchTerm ||
        p.player.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.player.id.toString().includes(searchTerm)
    );

  const grouped: Record<number, PlayerWithTimeLog> = {};
  filteredPlayers.forEach(({ player, timeLog }) => {
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

    if (inVacation) {
      if (duration > 0) return '#f97316'; // orange-500
      return '#fde68a'; // yellow-300
    }

    if (duration > 120) return '#3b82f6'; // blue-500
    if (duration > 60) return '#22c55e'; // green-500
    if (duration > 0) return '#ef4444'; // red-500
    return '#6b7280'; // gray-500
  };

  const monthOptions = Array.from({
    length: year === today.year() ? today.month() + 1 : 12,
  }).map((_, i) => i);
  const yearOptions = Array.from({ length: 5 }, (_, i) => today.year() - i);

  const exportToExcel = () => {
    const rows = Object.values(grouped).map(player => {
      const row: any = {
        ID: player.id,
        Ник: player.nickname,
        Сервер: player.server?.name ?? '',
        Должность: player.position?.title ?? '',
      };

      days.forEach(day => {
        const d = day.format('YYYY-MM-DD');
        row[d] = player.timeLog[d]
          ? `${Math.floor(player.timeLog[d] / 60)}ч ${player.timeLog[d] % 60}м`
          : '';
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Игроки');
    XLSX.writeFile(wb, `отчёт_${year}_${month + 1}.xlsx`);
  };

  return (
    <div className="bg-[#1a1a1a] text-white p-4 min-h-screen flex flex-col">
      <h2 className="text-3xl font-extrabold mb-6 underline decoration-[#5e00bd]">
        Отчёт по игрокам
      </h2>

      <ServerHeader
        servers={servers}
        selectedServer={selectedServer}
        onSelectServer={setSelectedServer}
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <select
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
          className="bg-gray-800 text-white border border-gray-700 p-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-purple-600"
        >
          {yearOptions.map(y => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={month}
          onChange={e => {
            setMonth(parseInt(e.target.value));
            setWeekIndex(0);
          }}
          className="bg-gray-800 text-white border border-gray-700 p-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-purple-600"
        >
          {monthOptions.map(m => (
            <option key={m} value={m}>
              {dayjs().month(m).format('MMMM')}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setWeekIndex(i)}
              className={`px-3 py-1 rounded-md font-medium transition ${
                weekIndex === i
                  ? 'bg-purple-700 shadow-md'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={`${i + 1} неделя`}
            >
              {i + 1} неделя
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Поиск по нику или ID"
          className="bg-gray-800 text-white border border-gray-700 p-2 rounded-md flex-grow max-w-xs transition focus:outline-none focus:ring-2 focus:ring-purple-600"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        <button
          onClick={exportToExcel}
          className="bg-purple-700 hover:bg-purple-800 transition px-4 py-2 rounded-md font-semibold"
        >
          Экспорт в Excel
        </button>
          <button
            onClick={() => setShowAddPlayerModal(true)}
            className="bg-purple-700 text-white px-3 py-1 rounded hover:bg-purple-800"
          >
            Добавить игрока
          </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-700 text-center text-sm md:text-base">
          <thead className="bg-gray-900">
            <tr>
              <th className="border border-gray-700 px-2 py-1">Код</th>
              <th className="border border-gray-700 px-3 py-1 text-left">Игрок</th>
              {days.map(d => (
                <th key={d.format('YYYY-MM-DD')} className="border border-gray-700 px-1 py-1 min-w-[30px]">
                  {d.format('dd')}
                </th>
              ))}
              <th className="border border-gray-700 px-3 py-1">Итого</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(grouped).map(player => {
              const total = Object.values(player.timeLog || {}).reduce((sum, min) => sum + min, 0);
              const hours = Math.floor(total / 60);
              const minutes = total % 60;

              return (
                <tr
                  key={player.id}
                  className="even:bg-gray-800 hover:bg-gray-700 cursor-pointer transition"
                >
                  <td className="border border-gray-700 px-2 py-1">{player.id}</td>
                  <td
                    className="border border-gray-700 px-3 py-1 text-left"
                    onClick={() => {
                      setSelectedPlayer(player);
                      setShowDetails(true);
                    }}
                    title="Открыть подробности игрока"
                  >
                    <div className="font-semibold text-purple-300">{player.nickname}</div>
                    <div className="text-xs text-gray-400">{player.position?.title ?? '—'}</div>
                    <div className="text-xs text-gray-400">{player.server?.name ?? '—'}</div>
                  </td>

                  {days.map(d => {
                    const dateStr = d.format('YYYY-MM-DD');
                    const min = player.timeLog[dateStr] ?? 0;
                    const color = getSquareColor(d, player);

                    return (
                      <td
                        key={dateStr}
                        title={min > 0 ? `${Math.floor(min / 60)} ч ${min % 60} мин` : ''}
                        onClick={() => {
                          setSelectedPlayer(player);
                          setSelectedDate(dateStr);
                          setShowPlaytimeTable(true);
                        }}
                        className="px-1 py-1"
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            margin: '0 auto',
                            backgroundColor: color,
                            borderRadius: 6,
                            boxShadow:
                              color !== '#6b7280' ? `0 0 8px ${color}` : undefined,
                            transition: 'background-color 0.3s ease',
                          }}
                        />
                      </td>
                    );
                  })}

                  <td className="border border-gray-700 px-3 py-1 font-semibold">
                    {hours} ч {minutes} мин
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showDetails && selectedPlayer && (
        <Modal onClose={() => setShowDetails(false)}>
          <PlayerDetails player={selectedPlayer} onClose={() => setShowDetails(false)} onUpdated={fetchData} />
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
              fetchData();
            }}
            vacationStart={selectedPlayer.vacationStart}
            vacationEnd={selectedPlayer.vacationEnd}
          />
        </Modal>
      )}

      {showAddPlayerModal && (
        <Modal onClose={() => setShowAddPlayerModal(false)}>
          <div className="max-w-md w-full p-6 bg-gray-900 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">Добавить нового игрока</h3>
            <PlayerForm
              onCreated={() => {
                setShowAddPlayerModal(false);
                fetchData();
              }}
            />
            <button
              onClick={() => setShowAddPlayerModal(false)}
              className="mt-4 w-full bg-gray-700 hover:bg-gray-800 text-white py-2 rounded"
            >
              Отмена
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default PlayerListWithPlaytime;
