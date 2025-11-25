export interface Skill {
  code: string;
  name: string;
  icon: string;
  currentPoints: number;
  level: number;
  progress: number; // 0-100
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  points: number;
  skillCode: string;
}

export interface HistoryRecord {
  id: string;
  skillCode: string;
  activityId?: string;
  activityName: string;
  points: number;
  notes?: string;
  timestamp: number; // Unix timestamp
}

export interface SkillDetails extends Skill {
  history: HistoryRecord[];
}

export type ViewState = 
  | { name: 'dashboard' }
  | { name: 'skill_details'; skillCode: string };

export const LEVELS_THRESHOLD = 100;