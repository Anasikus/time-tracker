import { useEffect, useState } from 'react';
import { getPlaytimeByWeek } from '../services/api';
import type { Player } from '../types';
import dayjs from 'dayjs';
import Modal from './Modal';
import PlayerDetails from './PlayerDetails';
import PlaytimeTable from './PlaytimeTable';

type TimeLogEntry = {
  id: number;
  playerId: number;
  date: string;
  duration: number; // в минутах
  createdAt: string;
};

type PlayerWithTimeLogs = {
  player: Player;
  timeLog: TimeLogEntry[];
};

type PlayerWithTimeLog = Player & {
  timeLog: Record<string, number>; // ключ — дата, значение — минуты
};

const PlayerListWithPlaytime = () => {
  // Период (старт — начало недели по умолчанию)
  const [startDate, setStartDate] = useState(dayjs().startOf('week'));
  const [endDate, setEndDate] = useState(dayjs().startOf('week').add(6, 'day'));

  // Массив дней для таблицы
  const [days, setDays] = useState(() =>
    Array.from({ length: endDate.diff(startDate, 'day') + 1 }).map((_, i) =>
      startDate.add(i, 'day')
    )
  );

  const [data, setData] = useState<PlayerWithTimeLogs[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithTimeLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPlaytimeTable, setShowPlaytimeTable] = useState(false);

  // Загрузка данных при изменении периода
  useEffect(() => {
    const load = async () => {
      const start = startDate.format('YYYY-MM-DD');
      const end = endDate.format('YYYY-MM-DD');
      const res = await getPlaytimeByWeek(start, end);
      console.log('Полученные данные:', res.data);
      setData(res.data);

      // Обновляем массив дней
      const countDays = endDate.diff(startDate, 'day') + 1;
      setDays(
        Array.from({ length: countDays }).map((_, i) =>
          startDate.add(i, 'day')
        )
      );
    };
    load();
  }, [startDate, endDate]);

  // Формируем сгруппированные данные для быстрого доступа
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

  // Функция для определения цвета квадратика
  // По условию:
  // - красный: > 1ч (то есть > 60 мин)
  // - зелёный: < 1ч (0 < min <= 60)
  // - синий: < 2ч (0 < min <= 120) — здесь логика конфликтует с зелёным,
  //   я считаю, что надо так: красный > 2ч, синий >1ч до 2ч, зелёный <=1ч
  // - жёлтый: отпуск (поясни, как определяется отпуск, например если duration = -1 или отдельный флаг?)
const getSquareColor = (duration: number): string => {
  if (duration === -1) return 'yellow'; // отпуск
  if (duration > 120) return 'blue'; // больше 2 часов — красный
  if (duration > 60) return 'green'; // от 1 до 2 часов — синий
  if (duration > 0) return 'red'; // меньше или равно 1 часа — зелёный
  return 'gray'; // нет времени — серый
};

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Отчёт по игрокам</h2>

      {/* Выбор периода */}
      <div className="mb-4 flex gap-4 items-center">
        <label>
          С:{' '}
          <input
            type="date"
            value={startDate.format('YYYY-MM-DD')}
            onChange={e => {
              const newStart = dayjs(e.target.value);
              if (newStart.isAfter(endDate)) {
                // не даём start быть позже end
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

            // Расчёт часов и минут только для подсчёта итого (текст останется)
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
                      className="cursor-pointer select-none"
                      style={{
                        textAlign: 'center',
                        verticalAlign: 'middle',
                      }}
                    >
                      {/* Квадратик */}
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

      {/* Детали игрока */}
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
          />
        </Modal>
      )}

      {/* Детали времени */}
      {showPlaytimeTable && (
        <Modal onClose={() => setShowPlaytimeTable(false)}>
          <PlaytimeTable onClose={() => setShowPlaytimeTable(false)} playerId={selectedPlayer?.id ?? 0} />
        </Modal>
      )}
    </div>
  );
};

export default PlayerListWithPlaytime;
