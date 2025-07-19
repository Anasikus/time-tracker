import { useEffect, useState } from 'react';
import { getPlaytimeByWeek } from '../services/api';
import type { PlaytimeEntry } from '../types';
import dayjs from 'dayjs';

const days = Array.from({ length: 7 }).map((_, i) => dayjs().startOf('week').add(i, 'day'));

const PlaytimeTable = () => {
  const [data, setData] = useState<PlaytimeEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      const start = days[0].format('YYYY-MM-DD');
      const end = days[6].format('YYYY-MM-DD');
      const res = await getPlaytimeByWeek(start, end);
      setData(res.data);
    };
    load();
  }, []);

  const grouped = data.reduce((acc, entry) => {
    const id = entry.player.id;
    const dateStr = dayjs(entry.date).format('YYYY-MM-DD');
    if (!acc[id]) acc[id] = { ...entry.player, timeLog: {} };
    acc[id].timeLog[dateStr] = entry.duration;
    return acc;
  }, {} as Record<number, any>);

  return (
    <table className="w-full border">
      <thead>
        <tr>
          <th>Код</th>
          <th>Ник / Должность / Статус</th>
          {days.map(d => (
            <th key={d.format('YYYY-MM-DD')}>{d.format('dd')}</th>
          ))}
          <th>Итого</th>
        </tr>
      </thead>
      <tbody>
        {Object.values(grouped).map((player: any) => {
        const total = Object.values(player.timeLog as Record<string, number>).reduce(
            (sum, min) => sum + min,
            0
        );

          return (
            <tr key={player.id}>
              <td>{player.id}</td>
              <td className="cursor-pointer hover:underline" title="Кликните для деталей">
                <div>{player.nickname}</div>
                <div className="text-sm text-gray-500">{player.position?.title ?? '—'}</div>
                <div className="text-sm text-gray-500">{player.status?.label ?? '—'}</div>
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
  );
};

export default PlaytimeTable;
