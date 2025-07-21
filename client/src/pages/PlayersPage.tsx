import PlayerList from '../components/PlayerList';
import { useState } from 'react';

const PlayersPage = () => {
  const [reload] = useState(false);
  return (  
    <div className="bg-[#1a1a1a] text-white p-4 min-h-screen">
      <PlayerList key={reload.toString()} />
    </div>
  );
};

export default PlayersPage;
