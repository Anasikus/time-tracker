import { useState } from 'react';
import PlayerList from '../components/PlayerList';
import TokenModal from '../components/TokenModal';
import dayjs from 'dayjs';

const PlayersPage = () => {
  const [reload, setReload] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [tokenToSend, setTokenToSend] = useState<string | null>(null);

  const handleTokenSubmit = (token: string) => {
    setTokenModalOpen(false);
    setTokenToSend(token);
    handleSync(token); // запустить синхронизацию с токеном
  };

  const handleSync = async (token: string) => {
    const start = dayjs().startOf('month').format('YYYY-MM-DD');
    const end = dayjs().endOf('month').format('YYYY-MM-DD');

    try {
      const res = await fetch(`http://localhost:4000/api/playtime/sync?start=${start}&end=${end}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Ошибка синхронизации');

      setSyncMessage(`✅ Синхронизировано ${data.count} записей`);
      setReload(prev => !prev);
    } catch (err) {
      console.error(err);
      setSyncMessage('❌ Ошибка при синхронизации');
    }
  };

  return (
    <div className="bg-[#1a1a1a] text-white p-4 min-h-screen">
      {tokenModalOpen && (
        <TokenModal
          onSubmit={handleTokenSubmit}
          onClose={() => setTokenModalOpen(false)}
        />
      )}


      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold"></h1>
        <button
          onClick={() => setTokenModalOpen(true)}
          className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"
        >
          Синхронизировать месяц
        </button>
      </div>

      {syncMessage && <p className="mb-2 text-sm">{syncMessage}</p>}
      <PlayerList key={reload.toString()} />
    </div>
  );
};

export default PlayersPage;
