import type { Player } from '../types/index.ts';

interface PlayerDetailsProps {
  player: Player;
  onClose: () => void;
  
}

const PlayerDetails = ({ player, onClose }: PlayerDetailsProps) => {
  console.log('Player в модалке:', player);
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Информация об игроке</h3>
      <p><strong>Код:</strong> {player.id}</p>
      <p><strong>Ник:</strong> {player.nickname}</p>
      <p><strong>Статус:</strong> {player.status?.label ?? '—'}</p>
      <p><strong>Должность:</strong> {player.position?.title ?? '—'}</p>
      <button
        onClick={onClose}
        className="mt-4 bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
      >
        Закрыть
      </button>
    </div>
  );
};

export default PlayerDetails;
