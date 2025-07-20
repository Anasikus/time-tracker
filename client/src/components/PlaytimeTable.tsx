// PlaytimeTable.tsx
import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';

type TimeEntry = {
  id: number;
  date: string;
  hours: string;
  minutes: string;
};

type Mode = 'day' | 'range';

type Props = {
  onClose: () => void;
  playerId: number;
  onSave?: (entries: TimeEntry[]) => void;
};

const PlaytimeTable = ({ onClose, onSave, playerId }: Props) => {
  const [mode, setMode] = useState<Mode>('day');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    if (mode === 'range' && rangeStart && rangeEnd) {
      const start = dayjs(rangeStart);
      const end = dayjs(rangeEnd);
      if (end.isBefore(start)) return;

      const diff = end.diff(start, 'day') + 1;
      const newEntries: TimeEntry[] = Array.from({ length: diff }).map((_, i) => ({
        id: nextId.current++,
        date: start.add(i, 'day').format('YYYY-MM-DD'),
        hours: '',
        minutes: '',
      }));
      setEntries(newEntries);
    } else if (mode === 'day') {
      setEntries([{ id: nextId.current++, date: '', hours: '', minutes: '' }]);
    }
  }, [mode, rangeStart, rangeEnd]);

  const updateEntry = (id: number, key: keyof TimeEntry, value: string) => {
    setEntries(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, [key]: value } : entry
      )
    );
  };

  const addEntry = () => {
    setEntries(prev => [
      ...prev,
      { id: nextId.current++, date: '', hours: '', minutes: '' },
    ]);
  };

  const removeEntry = (id: number) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const allValid = entries.every(e => e.date && e.hours && e.minutes);

  const handleSave = async () => {
    for (const entry of entries) {
      const duration =
        parseInt(entry.hours || '0', 10) * 60 +
        parseInt(entry.minutes || '0', 10);

      if (duration <= 0) continue;

      const payload = {
        playerId,
        date: entry.date,
        duration,
      };

      console.log('Отправка данных:', payload);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/playtime`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const text = await response.text();
        console.log('Ответ от сервера:', response.status, text);

        if (!response.ok) {
          console.error('Ошибка при сохранении:', response.statusText);
        }
      } catch (err) {
        console.error('Ошибка запроса:', err);
      }
    }

    if (onSave) onSave(entries);
    onClose();
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Добавление времени</h2>

      <div className="mb-4">
        <label className="mr-4">
          <input
            type="radio"
            value="day"
            checked={mode === 'day'}
            onChange={() => setMode('day')}
          /> День
        </label>
        <label>
          <input
            type="radio"
            value="range"
            checked={mode === 'range'}
            onChange={() => setMode('range')}
          /> Период
        </label>
      </div>

      {mode === 'range' && (
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm">С</label>
            <input
              type="date"
              value={rangeStart}
              onChange={e => setRangeStart(e.target.value)}
              className="border p-1 rounded"
            />
          </div>
          <div>
            <label className="block text-sm">По</label>
            <input
              type="date"
              value={rangeEnd}
              onChange={e => setRangeEnd(e.target.value)}
              className="border p-1 rounded"
            />
          </div>
        </div>
      )}

      {entries.map(entry => (
        <div key={entry.id} className="flex items-center gap-4 mb-2 relative border p-2 rounded">
          <button
            onClick={() => removeEntry(entry.id)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
            title="Удалить"
          >
            ×
          </button>
          <div className="flex-1">
            <label className="block text-xs text-gray-500">Дата</label>
            <input
              type="date"
              value={entry.date}
              onChange={e => updateEntry(entry.id, 'date', e.target.value)}
              className="border p-1 rounded w-full"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs text-gray-500">Часы</label>
            <input
              type="number"
              min="0"
              value={entry.hours}
              onChange={e => updateEntry(entry.id, 'hours', e.target.value)}
              className="border p-1 rounded w-full"
              placeholder="0–24"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs text-gray-500">Минуты</label>
            <input
              type="number"
              min="0"
              max="59"
              value={entry.minutes}
              onChange={e => updateEntry(entry.id, 'minutes', e.target.value)}
              className="border p-1 rounded w-full"
              placeholder="0–59"
            />
          </div>
        </div>
      ))}

      {allValid && (
        <button
          onClick={addEntry}
          className="mt-4 px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Добавить запись
        </button>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={onClose}
          className="px-4 py-1 border border-gray-400 rounded hover:bg-gray-100"
        >
          Отмена
        </button>
        <button
          onClick={handleSave}
          disabled={!allValid}
          className={`px-4 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 ${
            !allValid ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Сохранить
        </button>
      </div>
    </div>
  );
};

export default PlaytimeTable;
