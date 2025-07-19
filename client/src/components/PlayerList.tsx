import { useEffect, useState } from 'react';
import { getPlayers, deletePlayer } from '../services/api';
import type { Player } from '../types/index.ts';

const PlayerList = () => {
  const [players, setPlayers] = useState<Player[]>([]);

  const loadPlayers = async () => {
    const res = await getPlayers();
    setPlayers(res.data);
  };

  const handleDelete = async (id: number) => {
    await deletePlayer(id);
    loadPlayers();
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Список игроков</h2>
      <table className="w-full border">
        <thead>
          <tr>
            <th>ID</th>
            <th>Никнейм</th>
            <th>Статус</th>
            <th>Позиция</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {players.map(player => (
            <tr key={player.id}>
              <td>{player.id}</td>
              <td>{player.nickname}</td>
              <td>{player.statusId}</td>
              <td>{player.positionId}</td>
              <td>
                <button className="text-red-500" onClick={() => handleDelete(player.id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerList;
