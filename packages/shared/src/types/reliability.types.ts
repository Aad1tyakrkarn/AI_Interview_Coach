export enum ConnectionStatus {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  POOR = 'POOR',
  OFFLINE = 'OFFLINE',
}

export interface IAutoSave {
  interviewId: string;
  sessionId: string;
  state: string;
  currentQuestionIndex: number;
  answers: string[];
  timestamp: Date;
}

export interface IConnectionQuality {
  latency: number;
  bandwidth: number;
  status: ConnectionStatus;
}

export interface IHeartbeat {
  interviewId: string;
  timestamp: Date;
  clientTime: Date;
}
