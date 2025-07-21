import { useEffect, useState } from 'react';
import axios from 'axios';

type ModerationStat = {
  playerId: number;
  nickname: string;
  complaints: number;
  appeals: number;
  modComplaints: number;
  trainees: number;
  moderators: number;
};

export default function ModerationStatsTable() {
  const [stats, setStats] = useState<ModerationStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/moderation');
      setStats(res.data);
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (id: number, field: keyof ModerationStat, value: string) => {
    setStats((prev) =>
      prev.map((stat) =>
        stat.playerId === id ? { ...stat, [field]: Number(value) || 0 } : stat
      )
    );
  };

  const handleSave = async (stat: ModerationStat) => {
    try {
      setSavingId(stat.playerId);
      await axios.post('/api/moderation', stat);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p className="text-white">Загрузка...</p>;

  return (
    <div className="overflow-x-auto p-4">
      <table className="min-w-full border border-gray-700 bg-gray-900 text-white">
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
          {stats.map((stat) => (
            <tr key={stat.playerId} className="text-center">
              <td className="p-2 border border-gray-700">{stat.playerId}</td>
              <td className="p-2 border border-gray-700">{stat.nickname}</td>
              {(['complaints', 'appeals', 'modComplaints', 'trainees', 'moderators'] as const).map((field) => (
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
