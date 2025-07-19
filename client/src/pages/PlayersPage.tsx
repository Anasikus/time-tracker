import PlayerList from '../components/PlayerList';
import PlayerForm from '../components/PlayerForm';
import { useState } from 'react';

const PlayersPage = () => {
  const [reload, setReload] = useState(false);

  const refreshList = () => setReload(!reload);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Игроки</h1>
      <PlayerForm onCreated={refreshList} />
      <PlayerList key={reload.toString()} />
    </div>
  );
};

export default PlayersPage;
