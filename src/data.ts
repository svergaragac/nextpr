import { Exercise, LiftLog } from './types';

// ==========================================
// MOCK DATA DE EJEMPLO (COHERENTE Y REALISTA)
// ==========================================
// Este archivo contiene los datos de entrenamiento ficticios para el MVP.
// El progreso es gradual y refleja escenarios reales de entrenamiento.

export const INITIAL_EXERCISES: Exercise[] = [
  {
    id: 'squat',
    name: 'Sentadilla',
    category: 'primary',
    pattern: 'pierna',
    current1RM: 140,
    target1RM: 150,
    baseline1RM: 115,
    unit: 'kg',
    lastImprovementDate: '2026-07-13', // Semana actual, progresando constante
    logs: [
      { week: 1, date: '2026-04-27', weight: 115, reps: 5, sets: 3, volume: 1725 },
      { week: 2, date: '2026-05-04', weight: 115, reps: 5, sets: 4, volume: 2300 },
      { week: 3, date: '2026-05-11', weight: 120, reps: 5, sets: 3, volume: 1800 },
      { week: 4, date: '2026-05-18', weight: 120, reps: 5, sets: 4, volume: 2400 },
      { week: 5, date: '2026-05-25', weight: 123, reps: 5, sets: 3, volume: 1845 },
      { week: 6, date: '2026-06-01', weight: 125, reps: 5, sets: 3, volume: 1875 },
      { week: 7, date: '2026-06-08', weight: 128, reps: 4, sets: 3, volume: 1536 },
      { week: 8, date: '2026-06-15', weight: 130, reps: 4, sets: 3, volume: 1560 },
      { week: 9, date: '2026-06-22', weight: 133, reps: 3, sets: 3, volume: 1197 },
      { week: 10, date: '2026-06-29', weight: 135, reps: 3, sets: 3, volume: 1215 },
      { week: 11, date: '2026-07-06', weight: 138, reps: 2, sets: 3, volume: 828 },
      { week: 12, date: '2026-07-13', weight: 140, reps: 2, sets: 3, volume: 840 },
    ]
  },
  {
    id: 'bench',
    name: 'Press Banca',
    category: 'primary',
    pattern: 'empuje',
    current1RM: 100,
    target1RM: 110,
    baseline1RM: 85,
    unit: 'kg',
    lastImprovementDate: '2026-05-18', // Estancado desde la semana 4 (8 semanas sin subir peso)
    logs: [
      { week: 1, date: '2026-04-27', weight: 85, reps: 5, sets: 3, volume: 1275 },
      { week: 2, date: '2026-05-04', weight: 90, reps: 5, sets: 3, volume: 1350 },
      { week: 3, date: '2026-05-11', weight: 95, reps: 4, sets: 3, volume: 1140 },
      { week: 4, date: '2026-05-18', weight: 100, reps: 3, sets: 3, volume: 900 },
      { week: 5, date: '2026-05-25', weight: 100, reps: 3, sets: 3, volume: 900 },
      { week: 6, date: '2026-06-01', weight: 100, reps: 3, sets: 3, volume: 900 },
      { week: 7, date: '2026-06-08', weight: 100, reps: 3, sets: 3, volume: 900 },
      { week: 8, date: '2026-06-15', weight: 100, reps: 3, sets: 3, volume: 900 },
      { week: 9, date: '2026-06-22', weight: 100, reps: 3, sets: 3, volume: 900 },
      { week: 10, date: '2026-06-29', weight: 100, reps: 4, sets: 3, volume: 1200 }, // Intento con más reps, pero el peso no sube
      { week: 11, date: '2026-07-06', weight: 100, reps: 4, sets: 3, volume: 1200 },
      { week: 12, date: '2026-07-13', weight: 100, reps: 4, sets: 3, volume: 1200 },
    ]
  },
  {
    id: 'deadlift',
    name: 'Peso Muerto',
    category: 'primary',
    pattern: 'jalon',
    current1RM: 180,
    target1RM: 190,
    baseline1RM: 150,
    unit: 'kg',
    lastImprovementDate: '2026-07-13', // Nuevo récord personal en la semana actual (+5kg respecto al anterior)
    logs: [
      { week: 1, date: '2026-04-27', weight: 150, reps: 5, sets: 3, volume: 2250 },
      { week: 2, date: '2026-05-04', weight: 155, reps: 5, sets: 3, volume: 2325 },
      { week: 3, date: '2026-05-11', weight: 160, reps: 5, sets: 3, volume: 2400 },
      { week: 4, date: '2026-05-18', weight: 160, reps: 5, sets: 4, volume: 3200 },
      { week: 5, date: '2026-05-25', weight: 165, reps: 5, sets: 3, volume: 2475 },
      { week: 6, date: '2026-06-01', weight: 168, reps: 4, sets: 3, volume: 2016 },
      { week: 7, date: '2026-06-08', weight: 170, reps: 4, sets: 3, volume: 2040 },
      { week: 8, date: '2026-06-15', weight: 170, reps: 4, sets: 4, volume: 2720 },
      { week: 9, date: '2026-06-22', weight: 173, reps: 3, sets: 3, volume: 1557 },
      { week: 10, date: '2026-06-29', weight: 175, reps: 3, sets: 3, volume: 1575 },
      { week: 11, date: '2026-07-06', weight: 175, reps: 3, sets: 3, volume: 1575 },
      { week: 12, date: '2026-07-13', weight: 180, reps: 2, sets: 3, volume: 1080 }, // Nuevo récord!
    ]
  },
  {
    id: 'overhead',
    name: 'Press Militar',
    category: 'secondary',
    pattern: 'empuje',
    current1RM: 71,
    target1RM: 80,
    baseline1RM: 56,
    unit: 'kg',
    lastImprovementDate: '2026-06-29',
    logs: [
      { week: 1, date: '2026-04-27', weight: 48, reps: 5, sets: 3, volume: 720 },
      { week: 2, date: '2026-05-04', weight: 50, reps: 5, sets: 3, volume: 750 },
      { week: 3, date: '2026-05-11', weight: 52, reps: 5, sets: 3, volume: 780 },
      { week: 4, date: '2026-05-18', weight: 54, reps: 5, sets: 3, volume: 810 },
      { week: 5, date: '2026-05-25', weight: 55, reps: 5, sets: 3, volume: 825 },
      { week: 6, date: '2026-06-01', weight: 56, reps: 5, sets: 3, volume: 840 },
      { week: 7, date: '2026-06-08', weight: 58, reps: 4, sets: 3, volume: 696 },
      { week: 8, date: '2026-06-15', weight: 60, reps: 4, sets: 3, volume: 720 },
      { week: 9, date: '2026-06-22', weight: 60, reps: 4, sets: 3, volume: 720 },
      { week: 10, date: '2026-06-29', weight: 63, reps: 4, sets: 3, volume: 756 },
      { week: 11, date: '2026-07-06', weight: 63, reps: 4, sets: 3, volume: 756 },
      { week: 12, date: '2026-07-13', weight: 63, reps: 4, sets: 3, volume: 756 },
    ]
  },
  {
    id: 'row',
    name: 'Remo con Barra',
    category: 'secondary',
    pattern: 'jalon',
    current1RM: 105,
    target1RM: 115,
    baseline1RM: 84,
    unit: 'kg',
    lastImprovementDate: '2026-07-13',
    logs: [
      { week: 1, date: '2026-04-27', weight: 70, reps: 6, sets: 3, volume: 1260 },
      { week: 2, date: '2026-05-04', weight: 72, reps: 6, sets: 3, volume: 1296 },
      { week: 3, date: '2026-05-11', weight: 74, reps: 6, sets: 3, volume: 1332 },
      { week: 4, date: '2026-05-18', weight: 76, reps: 6, sets: 3, volume: 1368 },
      { week: 5, date: '2026-05-25', weight: 78, reps: 6, sets: 3, volume: 1404 },
      { week: 6, date: '2026-06-01', weight: 80, reps: 6, sets: 3, volume: 1440 },
      { week: 7, date: '2026-06-08', weight: 82, reps: 6, sets: 3, volume: 1476 },
      { week: 8, date: '2026-06-15', weight: 84, reps: 6, sets: 3, volume: 1512 },
      { week: 9, date: '2026-06-22', weight: 84, reps: 6, sets: 3, volume: 1512 },
      { week: 10, date: '2026-06-29', weight: 85, reps: 6, sets: 4, volume: 2040 },
      { week: 11, date: '2026-07-06', weight: 88, reps: 5, sets: 4, volume: 1760 },
      { week: 12, date: '2026-07-13', weight: 90, reps: 5, sets: 4, volume: 1800 },
    ]
  },
  {
    id: 'pullup',
    name: 'Dominadas (Lastre)',
    category: 'secondary',
    pattern: 'jalon',
    current1RM: 20,
    target1RM: 28,
    baseline1RM: 10,
    unit: 'kg',
    lastImprovementDate: '2026-06-22', // Declinando o estancado
    logs: [
      { week: 1, date: '2026-04-27', weight: 5, reps: 5, sets: 3, volume: 75 },
      { week: 2, date: '2026-05-04', weight: 5, reps: 5, sets: 3, volume: 75 },
      { week: 3, date: '2026-05-11', weight: 7.5, reps: 5, sets: 3, volume: 112.5 },
      { week: 4, date: '2026-05-18', weight: 7.5, reps: 5, sets: 3, volume: 112.5 },
      { week: 5, date: '2026-05-25', weight: 10, reps: 5, sets: 3, volume: 150 },
      { week: 6, date: '2026-06-01', weight: 10, reps: 5, sets: 3, volume: 150 },
      { week: 7, date: '2026-06-08', weight: 12.5, reps: 5, sets: 3, volume: 187.5 },
      { week: 8, date: '2026-06-15', weight: 12.5, reps: 5, sets: 3, volume: 187.5 },
      { week: 9, date: '2026-06-22', weight: 15, reps: 5, sets: 3, volume: 225 },
      { week: 10, date: '2026-06-29', weight: 15, reps: 5, sets: 3, volume: 225 },
      { week: 11, date: '2026-07-06', weight: 15, reps: 4, sets: 3, volume: 180 },
      { week: 12, date: '2026-07-13', weight: 15, reps: 3, sets: 3, volume: 135 },
    ]
  },
  {
    id: 'bicep_curl',
    name: 'Curl de Bíceps (Mancuernas)',
    category: 'secondary',
    pattern: 'jalon',
    current1RM: 20,
    target1RM: 25,
    baseline1RM: 16,
    unit: 'kg',
    lastImprovementDate: '2026-06-22',
    logs: [
      { week: 1, date: '2026-04-27', weight: 12.5, reps: 10, sets: 3, volume: 375 },
      { week: 2, date: '2026-05-04', weight: 12.5, reps: 10, sets: 3, volume: 375 },
      { week: 3, date: '2026-05-11', weight: 14, reps: 10, sets: 3, volume: 420 },
      { week: 4, date: '2026-05-18', weight: 14, reps: 10, sets: 3, volume: 420 },
      { week: 5, date: '2026-05-25', weight: 15, reps: 8, sets: 3, volume: 360 },
      { week: 6, date: '2026-06-01', weight: 15, reps: 8, sets: 3, volume: 360 },
      { week: 7, date: '2026-06-08', weight: 15, reps: 9, sets: 3, volume: 405 },
      { week: 8, date: '2026-06-15', weight: 15, reps: 10, sets: 3, volume: 450 },
      { week: 9, date: '2026-06-22', weight: 15, reps: 10, sets: 3, volume: 450 },
      { week: 10, date: '2026-06-29', weight: 15, reps: 10, sets: 3, volume: 450 },
      { week: 11, date: '2026-07-06', weight: 15, reps: 10, sets: 3, volume: 450 },
      { week: 12, date: '2026-07-13', weight: 15, reps: 10, sets: 3, volume: 450 },
    ]
  },
];

// Helper para guardar en localStorage
export const saveExercisesToStorage = (exercises: Exercise[]) => {
  localStorage.setItem('nextpr_exercises', JSON.stringify(exercises));
};

// Helper para cargar de localStorage o usar el mock predeterminado
export const loadExercisesFromStorage = (): Exercise[] => {
  const stored = localStorage.getItem('nextpr_exercises');
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Exercise[];
      // If the cache is an older version missing our new bicep_curl, auto-upgrade to the new set!
      if (parsed.length > 0 && !parsed.some(e => e.id === 'bicep_curl')) {
        saveExercisesToStorage(INITIAL_EXERCISES);
        return INITIAL_EXERCISES;
      }
      return parsed;
    } catch (e) {
      console.error("Error parsing stored exercises, using mock data", e);
    }
  }
  return INITIAL_EXERCISES;
};

// Calcula el % de progreso basado en: (actual - base) / (objetivo - base) * 100
// Si es menor que 0 se ajusta a 0. Si es mayor a 100, se limita a 100.
export const calculateProgressPercentage = (exercise: Exercise): number => {
  const numerator = exercise.current1RM - exercise.baseline1RM;
  const denominator = exercise.target1RM - exercise.baseline1RM;
  if (denominator <= 0) return 100;
  
  const percentage = Math.round((numerator / denominator) * 100);
  return Math.max(0, Math.min(percentage, 100));
};

// Detecta estancamiento (retorna semanas transcurridas desde el último aumento de peso)
// Si lleva 4 o más semanas sin registrar aumento, se considera estancado.
export const getStagnationWeeks = (exercise: Exercise): { weeks: number; isStagnant: boolean } => {
  if (!exercise.logs || exercise.logs.length === 0) return { weeks: 0, isStagnant: false };
  
  // Encontramos el log con el peso máximo absoluto en el historial
  const maxWeight = Math.max(...exercise.logs.map(l => l.weight));
  
  // Encontramos el índice de la primera semana donde se alcanzó ese peso máximo
  const firstMaxLog = exercise.logs.find(l => l.weight === maxWeight);
  if (!firstMaxLog) return { weeks: 0, isStagnant: false };
  
  // El último log registrado en el historial representa el estado actual
  const lastLog = exercise.logs[exercise.logs.length - 1];
  
  // Contamos cuántas semanas han pasado desde la primera vez que se logró el peso actual
  // O desde que no hay progreso.
  // Vamos a usar una regla de negocio robusta:
  // Evaluamos las últimas semanas consecutivas donde el peso registrado es menor o igual al peso actual
  // sin ningún aumento.
  // Si analizamos el historial, veamos de atrás hacia adelante cuántas semanas consecutivas el peso ha sido <= actual
  let consecutiveNoProgressWeeks = 0;
  for (let i = exercise.logs.length - 1; i >= 0; i--) {
    if (exercise.logs[i].weight <= exercise.current1RM) {
      consecutiveNoProgressWeeks++;
    } else {
      break;
    }
  }
  
  // Para Press Banca en los mocks: el peso llegó a 100 kg en la semana 4 (y se quedó ahí hasta la semana 12).
  // Es decir, lleva 9 semanas consecutivas en 100 kg o menos (del total 12).
  // Si medimos semanas sin mejorar, en el mock son 8 semanas completas (Semana 4 a Semana 12).
  // Retornemos un cálculo dinámico o basado en las fechas del mock.
  // Vamos a calcular la diferencia en semanas entre la última fecha de mejora (lastImprovementDate) y la última fecha de log.
  const lastLogDate = new Date(lastLog.date);
  const improvementDate = new Date(exercise.lastImprovementDate);
  
  const diffTime = Math.abs(lastLogDate.getTime() - improvementDate.getTime());
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  
  return {
    weeks: diffWeeks,
    isStagnant: diffWeeks >= 4
  };
};

// Calcula las métricas globales resumidas
export const calculateGlobalMetrics = (exercises: Exercise[]): {
  totalTonnageThisMonth: number;
  tonnageChangePercent: number;
  currentStreakDays: number;
  bestStreakDays: number;
  averageProgressPercent: number;
} => {
  // Sumamos volumen del último mes (últimas 4 semanas) de todos los ejercicios
  let currentMonthVolume = 0;
  let previousMonthVolume = 0;
  
  exercises.forEach(ex => {
    const totalLogs = ex.logs.length;
    // Últimas 4 semanas (mes actual)
    const currentMonthLogs = ex.logs.slice(Math.max(0, totalLogs - 4));
    currentMonthLogs.forEach(l => currentMonthVolume += l.volume);
    
    // Mes anterior (semanas de la 5 a la 8 de atrás hacia adelante)
    const prevMonthLogs = ex.logs.slice(Math.max(0, totalLogs - 8), Math.max(0, totalLogs - 4));
    prevMonthLogs.forEach(l => previousMonthVolume += l.volume);
  });
  
  // Porcentaje de cambio
  let changePercent = 0;
  if (previousMonthVolume > 0) {
    changePercent = Math.round(((currentMonthVolume - previousMonthVolume) / previousMonthVolume) * 1000) / 10;
  } else {
    changePercent = 5.2; // fallback mock coherente si no hay datos suficientes
  }

  // Progreso promedio de los ejercicios primarios hacia su objetivo
  const primaries = exercises.filter(e => e.category === 'primary');
  let totalProgSum = 0;
  primaries.forEach(ex => {
    totalProgSum += calculateProgressPercentage(ex);
  });
  const avgProgress = primaries.length > 0 ? Math.round((totalProgSum / primaries.length) * 10) / 10 : 0;

  return {
    totalTonnageThisMonth: currentMonthVolume,
    tonnageChangePercent: changePercent,
    currentStreakDays: 14, // Racha actual fijada/local
    bestStreakDays: 21,
    averageProgressPercent: avgProgress
  };
};
