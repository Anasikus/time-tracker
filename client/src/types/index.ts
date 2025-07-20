export interface Player {
  id: number;
  nickname: string;
  status?: Status;
  position?: Position;
  server?: Server;
  createdAt: string;
}

export interface Status {
  id: number;
  label: string;
}

export interface Position {
  id: number;
  title: string;
}

export interface Server {
  id: number;
  name: string;
}

export interface PlaytimeEntry {
  id: number;
  playerId: number;
  date: string;
  duration: number;
  player: Player & {
    status: Status;
    position: Position;
  };
}
