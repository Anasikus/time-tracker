export interface Player {
  id: number;
  nickname: string;
  status?: Status;
  position?: Position;
  server?: Server;
  createdAt: string;
  vacationStart?: string | null;
  vacationEnd?: string | null;
  comment?: string | null;
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
