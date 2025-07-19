export interface Player {
  id: number;
  nickname: string;
  statusId: number;
  positionId: number;
  serverId?: number;
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
