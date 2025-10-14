// Zentrale Game-Types für Store

export type Difficulty = 'Leicht' | 'Mittel' | 'Schwer';

export interface Statistics {
  totalResolved: number;
  totalFailed: number;
  totalResponseTimes: number[];
  incidentsByType: Record<string, number>;
  currentStreak: number;
  bestStreak: number;
  totalDistance: number;
}
