export interface Player {
  id: number;
  nickname: string;
  statusId: number;
  positionId: number;
  serverId?: number;
  createdAt: string;
  status?: {
    label: string;
  };
  position?: {
    title: string;
  };
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
