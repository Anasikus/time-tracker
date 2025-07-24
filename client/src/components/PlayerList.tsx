import { useEffect, useState, useCallback, useMemo } from 'react';
import { getPlaytimeByWeek } from '../services/api';
import type { Player } from '../types';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import * as XLSX from 'xlsx';
import ServerHeader from './ServerHeader';
import Modal from './Modal';
import PlayerDetails from './PlayerDetails';
import PlaytimeTable from './PlaytimeTable';
import PlayerForm from './PlayerForm';
import ModerationStatsTable from './ModerationStatsTable';

dayjs.extend(isBetween);
dayjs.extend(isoWeek); // чтобы неделя начиналась с понедельника

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

type ViewMode = 'week' | 'monthDays' | 'monthWeeks';

const PlayerListWithPlaytime = () => {
  const today = dayjs();
  const [month, setMonth] = useState(today.month());
  const [year, setYear] = useState(today.year());
  const [weekIndex, setWeekIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('week'); // 'week' | 'monthDays' | 'monthWeeks'
  const [servers, setServers] = useState<string[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [mode, setMode] = useState<'playtime' | 'moderation'>('playtime');

  // Диапазон дат
const { startDate, endDate } = useMemo(() => {
  let start: dayjs.Dayjs;
  let end: dayjs.Dayjs;

  if (viewMode === 'week') {
    start = dayjs()
      .year(year)
      .month(month)
      .startOf('month')
      .add(weekIndex * 7, 'day');
    end = dayjs.min(start.add(6, 'day'), dayjs().year(year).month(month).endOf('month'));
  } else if (viewMode === 'monthWeeks' || viewMode === 'monthDays') {
    start = dayjs().year(year).month(month).startOf('month');
    end = dayjs().year(year).month(month).endOf('month');
  } else {
    start = dayjs().startOf('month');
    end = dayjs().endOf('month');
  }

    return { startDate: start, endDate: end };
  }, [year, month, weekIndex, viewMode]);

  const [days, setDays] = useState<dayjs.Dayjs[]>([]);
  const [monthWeeks, setMonthWeeks] = useState<{ start: dayjs.Dayjs; end: dayjs.Dayjs }[]>([]);

  const [data, setData] = useState<PlayerWithTimeLogs[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithTimeLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPlaytimeTable, setShowPlaytimeTable] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await getPlaytimeByWeek(startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'));
      setData(res.data);

      const serverNames = Array.from(
        new Set(
          res.data
            .map((item: PlayerWithTimeLogs) => item.player.server?.name)
            .filter(Boolean)
        )
      ) as string[];
      setServers(serverNames);

      if (viewMode === 'week') {
        setDays(Array.from({ length: 7 }).map((_, i) => startDate.add(i, 'day')));
        setMonthWeeks([]);
      } else if (viewMode === 'monthDays') {
        const daysCount = endDate.date();
        setDays(Array.from({ length: daysCount }).map((_, i) => startDate.add(i, 'day')));
        setMonthWeeks([]);
      } else if (viewMode === 'monthWeeks') {
        const weeks: { start: dayjs.Dayjs; end: dayjs.Dayjs }[] = [];

        let current = startDate;
        const lastDay = endDate;

        while (current.isBefore(lastDay) || current.isSame(lastDay, 'day')) {
          const weekStart = current;
          const weekEnd = current.add(8 - current.day(), 'day'); // до воскресенья

          const clippedEnd = weekEnd.isAfter(endDate) ? endDate : weekEnd;

          weeks.push({ start: weekStart, end: clippedEnd });

          current = weekEnd.add(1, 'day');
        }

        setMonthWeeks(weeks);

        setDays([]);
      }
    } catch (err) {
      console.error('Ошибка при загрузке:', err);
    }
  }, [startDate, endDate, viewMode]);


  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData();
    }, 300); // 300мс задержка

    return () => clearTimeout(timeout); // очистка на размонтирование или изменение зависимостей
  }, [fetchData]);


  // Фильтрация игроков
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

  const getWeekDuration = (weekDates: string[], timeLog: Record<string, number>): number => {
    return weekDates.reduce((sum, date) => sum + (timeLog[date] ?? 0), 0);
  };


  const getSquareColor = (
    date: dayjs.Dayjs,
    player: PlayerWithTimeLog,
    viewMode: 'week' | 'monthDays' | 'monthWeeks',
    weekDates: string[] | null = null
  ): string => {
    const start = player.vacationStart ? dayjs(player.vacationStart) : null;
    const end = player.vacationEnd ? dayjs(player.vacationEnd) : null;

    const inVacation =
      start &&
      (end ? date.isBetween(start, end, 'day', '[]') : date.isSame(start) || date.isAfter(start));

    const dateStr = date.format('YYYY-MM-DD');

    // 👇 Здесь будет суммарная продолжительность недели
    const durationMinutes =
      viewMode === 'monthWeeks' && weekDates
        ? getWeekDuration(weekDates, player.timeLog) / 60
        : (player.timeLog[dateStr] ?? 0) / 60;

    // 👇 Debug
    console.log('date:', dateStr);
    console.log('role:', player.position?.title);
    console.log('duration (hours):', durationMinutes);

    if (viewMode === 'monthWeeks') {
      const role = player.position?.title?.toLowerCase();

      if (role?.includes('старший модератор')) {
        if (durationMinutes > 14) return '#722ed1'; // > 14 ч
        if (durationMinutes >= 7) return '#52c41a'; // 7–14 ч
        return '#ff4d4f'; // < 7 ч
      } else if (role?.includes('модератор')) {
        if (durationMinutes > 28) return '#722ed1'; // > 28 ч
        if (durationMinutes >= 14) return '#52c41a'; // 14–28 ч
        return '#ff4d4f'; // < 14 ч
      }
    }

    if (inVacation) {
      return durationMinutes > 0 ? '#f97316' : '#fde68a'; // отпуск
    }

    if (durationMinutes > 2) return '#3b82f6'; // > 2 ч
    if (durationMinutes > 1) return '#22c55e';  // 1–2 ч
    if (durationMinutes > 0) return '#ef4444';   // < 1 ч

    return '#6b7280'; // нет активности
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

      if (viewMode === 'monthWeeks') {
        monthWeeks.forEach((week, idx) => {
          let total = 0;
          let day = week.start;
          for (let i = 0; i < 7; i++) {
            const dStr = day.format('YYYY-MM-DD');
            total += player.timeLog[dStr] ?? 0;
            day = day.add(1, 'day');
          }
          row[`Неделя ${idx + 1} (${week.start.format('DD.MM')}–${week.end.format('DD.MM')})`] = total
            ? `${Math.floor(total / 60)}ч ${total % 60}м`
            : '';
        });
      } else {
        days.forEach(day => {
          const d = day.format('YYYY-MM-DD');
          row[d] = player.timeLog[d]
            ? `${Math.floor(player.timeLog[d] / 60)}ч ${player.timeLog[d] % 60}м`
            : '';
        });
      }

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Игроки');
    XLSX.writeFile(wb, `отчёт_${year}_${month + 1}.xlsx`);
  };

  const onWeekHeaderClick = (weekStart: dayjs.Dayjs) => {
    setSelectedDate(weekStart.format('YYYY-MM-DD'));
    setShowPlaytimeTable(true);
  };

  return (
    <div className="bg-[#1a1a1a] text-white p-4 min-h-screen flex flex-col">
      <h2 className="text-3xl font-extrabold mb-6 underline decoration-[#5e00bd]">
        Отчёт по игрокам
      </h2>

      {/* Блок переключения режимов */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setMode('playtime')}
          className={`px-4 py-2 rounded-md font-semibold transition ${
            mode === 'playtime' ? 'bg-purple-700 shadow-md' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Время
        </button>
        <button
          onClick={() => setMode('moderation')}
          className={`px-4 py-2 rounded-md font-semibold transition ${
            mode === 'moderation' ? 'bg-purple-700 shadow-md' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Модерация
        </button>
      </div>

      {/* Серверы */}
      <ServerHeader
        servers={servers}
        selectedServer={selectedServer}
        onSelectServer={setSelectedServer}
      />

      {/* Если режим модерации - показываем таблицу модерации */}
      {mode === 'moderation' ? (
        <ModerationStatsTable />
      ) : (
        <>
          {/* Фильтры и управление отображением */}
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

            <div className="flex gap-2 items-center">
              <button
                onClick={() => {
                  setViewMode('week');
                  setWeekIndex(0);
                }}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  viewMode === 'week' ? 'bg-purple-700 shadow-md' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Неделя"
              >
                Неделя
              </button>

              <button
                onClick={() => setViewMode('monthDays')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  viewMode === 'monthDays' ? 'bg-purple-700 shadow-md' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Месяц по дням"
              >
                Месяц по дням
              </button>

              <button
                onClick={() => setViewMode('monthWeeks')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  viewMode === 'monthWeeks' ? 'bg-purple-700 shadow-md' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Месяц по неделям"
              >
                Месяц по неделям
              </button>
            </div>

            {viewMode === 'week' && (
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setWeekIndex(i)}
                    className={`px-3 py-1 rounded-md font-medium transition ${
                      weekIndex === i ? 'bg-purple-700 shadow-md' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={`${i + 1} неделя`}
                  >
                    {i + 1} неделя
                  </button>
                ))}
              </div>
            )}

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

          {/* Таблица игроков и времени */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-700 text-center text-sm md:text-base">
              <thead className="bg-gray-900">
                <tr>
                  <th className="border border-gray-700 px-2 py-1">Код</th>
                  <th className="border border-gray-700 px-3 py-1 text-left">Игрок</th>

                  {viewMode === 'monthWeeks'
                    ? monthWeeks.map((week, idx) => (
                        <th
                          key={idx}
                          className="border border-gray-700 px-3 py-1 cursor-pointer select-none"
                          title={`Период: ${week.start.format('DD.MM.YYYY')} - ${week.end.format('DD.MM.YYYY')}`}
                          onClick={() => onWeekHeaderClick(week.start)}
                        >
                          {`Неделя ${idx + 1}`}
                          <br />
                          <span className="text-xs">
                            {week.start.format('DD.MM')}–{week.end.format('DD.MM')}
                          </span>
                        </th>
                      ))
                    : days.map(d => (
                        <th
                          key={d.format('YYYY-MM-DD')}
                          className="border border-gray-700 px-1 py-1 min-w-[30px]"
                          title={d.format('DD.MM.YYYY')}
                        >
                          {d.format('DD.MM')}
                        </th>
                      ))}

                  <th className="border border-gray-700 px-3 py-1">Итого</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(grouped).map(player => {
                  let total = 0;

                  const getDurationForWeek = (week: { start: dayjs.Dayjs; end: dayjs.Dayjs }) => {
                    let sum = 0;
                    let day = week.start;
                    for (let i = 0; i < 7; i++) {
                      const dStr = day.format('YYYY-MM-DD');
                      sum += player.timeLog[dStr] ?? 0;
                      day = day.add(1, 'day');
                    }
                    return sum;
                  };

                  let weekDurations: number[] = [];
                  if (viewMode === 'monthWeeks') {
                    weekDurations = monthWeeks.map(w => getDurationForWeek(w));
                    total = weekDurations.reduce((a, b) => a + b, 0);
                  } else {
                    total = days.reduce(
                      (sum, d) => sum + (player.timeLog[d.format('YYYY-MM-DD')] ?? 0),
                      0
                    );
                  }

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

                      {viewMode === 'monthWeeks'
                        ? monthWeeks.map((week, i) => {
                            const weekDates = Array.from({ length: 7 }).map((_, d) =>
                              week.start.add(d, 'day').format('YYYY-MM-DD')
                            );
                            const weekDateObj = week.start;
                            const color = getSquareColor(weekDateObj, player, viewMode, weekDates);
                            const dur = weekDurations[i];

                            return (
                              <td
                                key={i}
                                title={`${Math.floor(dur / 60)} ч ${dur % 60} мин`}
                                onClick={() => {
                                  setSelectedPlayer(player);
                                  setSelectedDate(week.start.format('YYYY-MM-DD'));
                                  setShowPlaytimeTable(true);
                                }}
                                className="px-3 py-1"
                              >
                                <div
                                  style={{
                                    width: 34,
                                    height: 34,
                                    margin: '0 auto',
                                    backgroundColor: color,
                                    borderRadius: 6,
                                    boxShadow: dur ? `0 0 8px ${color}` : undefined,
                                    transition: 'background-color 0.3s ease',
                                  }}
                                />
                              </td>
                            );
                          })
                        : days.map(d => {
                            const dateStr = d.format('YYYY-MM-DD');
                            const min = player.timeLog[dateStr] ?? 0;
                            const weekDates =
                              viewMode === 'week' ? days.map(day => day.format('YYYY-MM-DD')) : null;
                            const color = getSquareColor(d, player, viewMode, weekDates);

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
                                    boxShadow: color !== '#6b7280' ? `0 0 8px ${color}` : undefined,
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
        </>
      )}

      {showDetails && selectedPlayer && (
        <Modal onClose={() => setShowDetails(false)}>
          <PlayerDetails
            player={selectedPlayer}
            onClose={() => setShowDetails(false)}
            onUpdated={fetchData}
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
