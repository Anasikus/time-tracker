import React from 'react';

type ServerHeaderProps = {
  servers: string[];
  selectedServer: string | null;
  onSelectServer: (server: string | null) => void;
};

const ServerHeader: React.FC<ServerHeaderProps> = ({ servers, selectedServer, onSelectServer }) => {
  return (
    <header className="mb-6 p-4 bg-[#2a2a2a] rounded-lg shadow flex flex-wrap gap-4 justify-between items-center">
      <h1 className="text-xl font-bold">Серверы:</h1>
      <div className="flex gap-2 flex-wrap">
        {servers.map(server => (
          <button
            key={server}
            onClick={() => onSelectServer(server === selectedServer ? null : server)}
            className={`px-3 py-1 rounded ${
              selectedServer === server ? 'bg-purple-700' : 'bg-gray-700'
            } hover:bg-purple-600 transition`}
          >
            {server}
          </button>
        ))}
      </div>
    </header>
  );
};

export default ServerHeader;
