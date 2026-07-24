export interface LiftLog {
  week: number;
  date: string;
  weight: number; // Best weight of the week (kg)
  reps: number;   // Reps at best weight
  sets: number;   // Sets performed
  volume: number; // Volume = weight * reps * sets (tonnage)
}

export interface Exercise {
  id: string;
  name: string;
  category: 'primary' | 'secondary';
  pattern?: 'empuje' | 'jalon' | 'pierna'; // Movimiento patrón: empuje, jalón o pierna
  current1RM: number; // Calculated or tested 1RM
  target1RM: number;  // Goal milestone
  baseline1RM: number; // Starting point of progress measurement
  logs: LiftLog[];
  lastImprovementDate: string; // YYYY-MM-DD
  unit: string;
}

export interface MetricSummary {
  totalTonnageThisMonth: number;
  tonnageChangePercent: number; // vs previous month
  currentStreakDays: number;
  bestStreakDays: number;
  averageProgressPercent: number;
}
