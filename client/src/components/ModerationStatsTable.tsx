import { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Устанавливаем русскую локаль для dayjs
dayjs.locale('ru');

interface ModerationStat {
  playerId: number;
  nickname: string;
  complaints: number;
  appeals: number;
  modComplaints: number;
  trainees: number;
  moderators: number;
  serverName?: string;
}

export default function ModerationStatsTable({ selectedServer }: { selectedServer?: string }) {
  const [stats, setStats] = useState<ModerationStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = dayjs();
    return now.format('YYYY-MM');
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Массив месяцев (0-11)
  const months = Array.from({ length: 12 }, (_, i) => i);
  // Текущий и прошлый год для селекта
  const currentYear = dayjs().year();
  const years = [currentYear, currentYear - 1];

  useEffect(() => {
    fetchStats();
  }, [selectedMonth, selectedServer]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [modRes, playersRes] = await Promise.all([
        axios.get('/api/moderation', { params: { month: selectedMonth, server: selectedServer } }),
        axios.get('/api/moderation/players-basic'),
      ]);

      const moderationData = modRes.data as ModerationStat[];
      const allPlayers = playersRes.data as { id: number; nickname: string; serverName?: string }[];

      const mergedStats: ModerationStat[] = allPlayers.map(player => {
        const existing = moderationData.find(m => m.playerId === player.id);
        return existing ?? {
          playerId: player.id,
          nickname: player.nickname,
          complaints: 0,
          appeals: 0,
          modComplaints: 0,
          trainees: 0,
          moderators: 0,
          serverName: player.serverName,
        };
      });

      setStats(mergedStats);
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (id: number, field: keyof ModerationStat, value: string) => {
    setStats(prev =>
      prev.map(stat =>
        stat.playerId === id ? { ...stat, [field]: Number(value) || 0 } : stat
      )
    );
  };

  const handleSave = async (stat: ModerationStat) => {
    try {
      setSavingId(stat.playerId);
      await axios.post('/api/moderation', { ...stat, month: selectedMonth });
    } catch (err) {
      console.error('Ошибка сохранения:', err);
    } finally {
      setSavingId(null);
    }
  };

  // Фильтрация по нику и ID
  const filteredStats = stats.filter(s =>
    s.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.playerId.toString().includes(searchTerm)
  );

  // Экспорт в Excel
  const exportToExcel = () => {
    const dataToExport = filteredStats.map(stat => ({
      ID: stat.playerId,
      Ник: stat.nickname,
      ЖБ: stat.complaints,
      ОБ: stat.appeals,
      ЖНМ: stat.modComplaints,
      Стажёры: stat.trainees,
      Модераторы: stat.moderators,
      Сервер: stat.serverName ?? '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Статистика модерации");

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `moderation_stats_${selectedMonth}.xlsx`);
  };

  return (
    <div className="p-4 text-white min-h-[400px]">
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <select
          value={selectedMonth.split('-')[1]}
          onChange={e =>
            setSelectedMonth(
              `${selectedMonth.split('-')[0]}-${e.target.value.padStart(2, '0')}`
            )
          }
          className="bg-gray-800 text-white border border-gray-600 px-2 py-1 rounded"
        >
          {months.map(m => (
            <option key={m} value={(m + 1).toString().padStart(2, '0')}>
              {dayjs().month(m).format('MMMM')}
            </option>
          ))}
        </select>

        <select
          value={selectedMonth.split('-')[0]}
          onChange={e => setSelectedMonth(`${e.target.value}-${selectedMonth.split('-')[1]}`)}
          className="bg-gray-800 text-white border border-gray-600 px-2 py-1 rounded"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Поиск по нику или ID"
          className="bg-gray-800 text-white border border-gray-600 px-2 py-1 rounded w-64"
        />

        <button
          onClick={exportToExcel}
          className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded transition"
        >
          Экспорт в Excel
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-700 rounded">
        <table className="min-w-full border-collapse border border-gray-700 bg-gray-900 text-white">
          <thead>
            <tr className="bg-gray-800">
              <th className="p-2 border border-gray-700">ID</th>
              <th className="p-2 border border-gray-700">Ник</th>
              <th className="p-2 border border-gray-700">ЖБ</th>
              <th className="p-2 border border-gray-700">ОБ</th>
              <th className="p-2 border border-gray-700">ЖНМ</th>
              <th className="p-2 border border-gray-700">Стажёры</th>
              <th className="p-2 border border-gray-700">Модераторы</th>
              <th className="p-2 border border-gray-700">Сохранить</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-4">Загрузка...</td></tr>
            ) : (
              filteredStats.map(stat => (
                <tr key={stat.playerId} className="text-center">
                  <td className="p-2 border border-gray-700">{stat.playerId}</td>
                  <td className="p-2 border border-gray-700">{stat.nickname}</td>
                  {(['complaints', 'appeals', 'modComplaints', 'trainees', 'moderators'] as const).map(field => (
                    <td key={field} className="p-1 border border-gray-700">
                      <input
                        type="number"
                        className="w-16 px-1 py-0.5 text-black rounded"
                        value={stat[field]}
                        onChange={(e) => handleChange(stat.playerId, field, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="p-2 border border-gray-700">
                    <button
                      onClick={() => handleSave(stat)}
                      className="bg-purple-700 hover:bg-purple-800 text-white px-2 py-1 rounded"
                      disabled={savingId === stat.playerId}
                    >
                      {savingId === stat.playerId ? '...' : '💾'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
