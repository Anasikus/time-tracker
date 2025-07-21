import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';

type TimeEntry = {
  id: number;
  date: string;
  hours: string;
  minutes: string;
  isVacation?: boolean;
};

type Mode = 'day' | 'range';

type Props = {
  onClose: () => void;
  playerId: number;
  onSave?: (entries: TimeEntry[]) => void;
  initialDate?: string;
  vacationStart?: string | null;
  vacationEnd?: string | null;
};

const isDateInVacation = (date: string, vacationStart?: string | null, vacationEnd?: string | null) => {
  if (!vacationStart) return false;
  const target = dayjs(date);
  const start = dayjs(vacationStart);
  const end = vacationEnd ? dayjs(vacationEnd) : dayjs(); // если отпуск открыт — до сегодня
  return target.isSame(start) || target.isSame(end) || (target.isAfter(start) && target.isBefore(end));
};

const PlaytimeTable = ({ onClose, onSave, playerId, initialDate, vacationStart, vacationEnd }: Props) => {
  const [mode, setMode] = useState<Mode>('day');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    const generateEntry = async (date: string): Promise<TimeEntry> => {
      const vacation = isDateInVacation(date, vacationStart, vacationEnd);

      let existing: TimeEntry | null = null;

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/playtime/date?playerId=${playerId}&date=${date}`
        );

        if (res.ok) {
          const data = await res.json();
          if (data?.duration) {
            const minutes = data.duration % 60;
            const hours = Math.floor(data.duration / 60);
            existing = {
              id: nextId.current++,
              date,
              hours: String(hours),
              minutes: String(minutes),
              isVacation: vacation,
            };
          }
        }
      } catch (e) {
        console.error('Ошибка загрузки времени:', e);
      }

      return (
        existing || {
          id: nextId.current++,
          date,
          hours: vacation ? '0' : '',
          minutes: vacation ? '0' : '',
          isVacation: vacation,
        }
      );
    };

    const init = async () => {
      if (mode === 'range' && rangeStart && rangeEnd) {
        const start = dayjs(rangeStart);
        const end = dayjs(rangeEnd);
        if (!start.isValid() || !end.isValid() || end.isBefore(start)) return;

        const diff = end.diff(start, 'day') + 1;
        const newEntries: TimeEntry[] = await Promise.all(
          Array.from({ length: diff }).map((_, i) =>
            generateEntry(start.add(i, 'day').format('YYYY-MM-DD'))
          )
        );
        setEntries(newEntries);
      } else if (mode === 'day' && initialDate) {
        const entry = await generateEntry(initialDate);
        setEntries([entry]);
      }
    };

    init();
  }, [mode, rangeStart, rangeEnd, initialDate, vacationStart, vacationEnd]);

  const updateEntry = (id: number, key: keyof TimeEntry, value: string | boolean) => {
    setEntries(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, [key]: value } : entry
      )
    );
  };

  const addEntry = () => {
    setEntries(prev => [
      ...prev,
      {
        id: nextId.current++,
        date: '',
        hours: '',
        minutes: '',
        isVacation: false,
      }
    ]);
  };

  const removeEntry = (id: number) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const allValid = entries.every(e => e.date && (e.hours !== '' || e.minutes !== ''));

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

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/playtime`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.error('Ошибка при сохранении:', response.statusText);
        }
      } catch (err) {
        console.error('Ошибка запроса:', err);
      }
    }

    if (onSave) onSave(entries);
    else onClose();
  };

  return (
    <>
      {/* Затенённый фон модалки */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-40"
      />

      {/* Модальное окно */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-auto">
        <div className="bg-[#1a1a1a] text-white rounded-xl shadow-lg max-w-3xl w-full sm:w-[600px] mx-auto p-6
          flex flex-col
          animate-fadeIn
          border border-transparent hover:border-[#5e00bd] transition
          ">
          <h2 className="text-2xl font-bold mb-6 border-b border-[#5e00bd] pb-2">Добавление времени</h2>

          {/* Режим выбора */}
          <div className="mb-6 flex gap-6 text-sm select-none">
            <label className={`cursor-pointer flex items-center gap-2 ${mode === 'day' ? 'text-purple-400' : 'text-gray-400'}`}>
              <input
                type="radio"
                value="day"
                checked={mode === 'day'}
                onChange={() => setMode('day')}
                className="accent-purple-600"
              />
              День
            </label>
            <label className={`cursor-pointer flex items-center gap-2 ${mode === 'range' ? 'text-purple-400' : 'text-gray-400'}`}>
              <input
                type="radio"
                value="range"
                checked={mode === 'range'}
                onChange={() => setMode('range')}
                className="accent-purple-600"
              />
              Период
            </label>
          </div>

          {/* Период выбора дат */}
          {mode === 'range' && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex flex-col w-full sm:w-1/2">
                <label className="mb-1 text-sm text-gray-400">С</label>
                <input
                  type="date"
                  value={rangeStart}
                  onChange={e => setRangeStart(e.target.value)}
                  className="p-2 rounded bg-[#121212] border border-[#5e00bd] text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div className="flex flex-col w-full sm:w-1/2">
                <label className="mb-1 text-sm text-gray-400">По</label>
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={e => setRangeEnd(e.target.value)}
                  className="p-2 rounded bg-[#121212] border border-[#5e00bd] text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
          )}

          {/* Записи времени */}
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto mb-6">
            {entries.map(entry => (
              <div
                key={entry.id}
                className={`flex flex-col sm:flex-row items-center gap-3 relative p-3 rounded-md
                  ${entry.isVacation ? 'bg-yellow-400/20' : 'bg-[#222222] hover:bg-[#2e2e2e]'}
                `}
              >
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="absolute top-1 right-1 text-white bg-red-600 hover:bg-red-700 rounded-full w-6 h-6 flex items-center justify-center text-lg leading-none"
                  title="Удалить"
                  type="button"
                >
                  &times;
                </button>

                {/* Дата */}
                <div className="flex flex-col flex-1 min-w-[130px]">
                  <label className="text-xs text-gray-400 mb-1 select-none">Дата</label>
                  <input
                    type="date"
                    value={entry.date}
                    onChange={e => {
                      const date = e.target.value;
                      const vacation = isDateInVacation(date, vacationStart, vacationEnd);
                      updateEntry(entry.id, 'date', date);
                      updateEntry(entry.id, 'isVacation', vacation);
                      if (vacation) {
                        updateEntry(entry.id, 'hours', '0');
                        updateEntry(entry.id, 'minutes', '0');
                      }
                    }}
                    className="rounded border border-[#5e00bd] bg-[#121212] p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Часы */}
                <div className="flex flex-col w-[80px]">
                  <label className="text-xs text-gray-400 mb-1 select-none">Часы</label>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={entry.hours}
                    onChange={e => updateEntry(entry.id, 'hours', e.target.value)}
                    className="rounded border border-[#5e00bd] bg-[#121212] p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600 text-center"
                    placeholder="0–24"
                  />
                </div>

                {/* Минуты */}
                <div className="flex flex-col w-[80px]">
                  <label className="text-xs text-gray-400 mb-1 select-none">Минуты</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={entry.minutes}
                    onChange={e => updateEntry(entry.id, 'minutes', e.target.value)}
                    className="rounded border border-[#5e00bd] bg-[#121212] p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600 text-center"
                    placeholder="0–59"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addEntry}
            className="self-start mb-6 px-4 py-2 bg-purple-700 hover:bg-purple-800 rounded transition"
            type="button"
          >
            Добавить запись
          </button>

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-5 py-2 border border-gray-600 rounded hover:bg-gray-700 transition"
              type="button"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={!allValid}
              className={`px-5 py-2 rounded text-white transition
                ${allValid ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-900 cursor-not-allowed opacity-50'}`}
              type="button"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {opacity: 0; transform: translateY(10px);}
          to {opacity: 1; transform: translateY(0);}
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease forwards;
        }
      `}</style>
    </>
  );
};

export default PlaytimeTable;
