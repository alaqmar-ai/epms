export interface User {
  name: string;
  role: 'PIC' | 'Lead' | 'Admin' | 'Viewer';
}

export interface Stage {
  stageIndex: number;
  stageName: string;
  planStart: string;
  planFinish: string;
  actualStart: string;
  actualFinish: string;
  checked: boolean;
}

export interface Project {
  id: string;
  pic: string;
  name: string;
  code: string;
  group: string;
  source: string;
  duration: number;
  stages: Stage[];
  createdAt: string;
  updatedAt: string;
}

export type StageStatus = 'COMPLETED' | 'IN PROGRESS' | 'DELAY' | 'UPCOMING' | 'NOT STARTED';
export type ProjectStatus = 'COMPLETED' | 'IN PROGRESS' | 'DELAY' | 'NOT STARTED';
