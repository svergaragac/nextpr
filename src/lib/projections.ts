import { Exercise, LiftLog } from '../types';
import { getStagnationWeeks } from '../data';

export interface ProjectionResult {
  exerciseId: string;
  exerciseName: string;
  patternName: string;
  currentValue: number;
  unit: string;
  trend: 'lineal' | 'desacelerando' | 'estancado' | 'irregular';
  trendLabel: string;
  trendPercent: string;
  trendPeriod: string;
  confidence: 'alta' | 'media' | 'baja';
  projectionRange: [number, number] | null;
  note: string;
  shortHistory: boolean;
  totalSessions: number;
  recommendation: string;
}

/**
 * Calculates estimated 1RM using Epley's formula: weight * (1 + reps / 30)
 */
export function calculateEst1RM(weight: number, reps: number): number {
  if (reps === 1) return Math.round(weight);
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Calculates RM percentage change over the last month (30 days) or full history if shorter.
 */
export function calculateRMPercentageChange(exercise: Exercise): { percentStr: string; periodStr: string; text: string; value: number } {
  const logs = [...(exercise.logs || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const n = logs.length;
  if (n < 2) {
    return {
      percentStr: 'Estable',
      periodStr: 'sin datos suficientes',
      text: "Estable",
      value: 0
    };
  }

  const latestLog = logs[n - 1];
  const latestRM = calculateEst1RM(latestLog.weight, latestLog.reps);

  // Find a log closest to 30 days before the latest log
  const latestDate = new Date(latestLog.date);
  const targetDateMs = latestDate.getTime() - 30 * 24 * 60 * 60 * 1000;

  let baseLog = logs[0];
  let minDiff = Math.abs(new Date(baseLog.date).getTime() - targetDateMs);
  
  for (let i = 1; i < n - 1; i++) {
    const diff = Math.abs(new Date(logs[i].date).getTime() - targetDateMs);
    if (diff < minDiff) {
      minDiff = diff;
      baseLog = logs[i];
    }
  }

  const baseRM = calculateEst1RM(baseLog.weight, baseLog.reps);
  const percentChange = ((latestRM - baseRM) / baseRM) * 100;
  const formattedPercent = percentChange >= 0 ? `+${percentChange.toFixed(1)}%` : `${percentChange.toFixed(1)}%`;

  const daysDiff = Math.round((latestDate.getTime() - new Date(baseLog.date).getTime()) / (24 * 60 * 60 * 1000));
  
  if (daysDiff >= 25 && daysDiff <= 35) {
    return {
      percentStr: formattedPercent,
      periodStr: 'en el último mes',
      text: `${formattedPercent} en el último mes`,
      value: percentChange
    };
  } else {
    const weeksDiff = Math.max(1, Math.round(daysDiff / 7));
    const label = weeksDiff === 1 ? 'última semana' : `últimas ${weeksDiff} semanas`;
    const prep = weeksDiff === 1 ? 'la' : 'las';
    return {
      percentStr: formattedPercent,
      periodStr: `en ${prep} ${label} de datos`,
      text: `${formattedPercent} en ${prep} ${label} de datos`,
      value: percentChange
    };
  }
}

/**
 * Calculates confidence based on quantity, frequency, and variability.
 */
export function calculateConfidence(logs: LiftLog[]): 'alta' | 'media' | 'baja' {
  const n = logs.length;
  if (n < 4) return 'baja';
  
  // Calculate max gap in weeks
  const weeks = logs.map(l => l.week).sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 1; i < weeks.length; i++) {
    const gap = weeks[i] - weeks[i - 1];
    if (gap > maxGap) maxGap = gap;
  }
  
  // Calculate direction fluctuations
  const rms = logs.map(l => calculateEst1RM(l.weight, l.reps));
  let fluctuations = 0;
  for (let i = 2; i < rms.length; i++) {
    const d1 = rms[i] - rms[i - 1];
    const d2 = rms[i - 1] - rms[i - 2];
    if (d1 * d2 < 0) {
      fluctuations++;
    }
  }
  const fluctuationRatio = fluctuations / (n - 2 || 1);

  if (n >= 8 && maxGap <= 2 && fluctuationRatio < 0.35) {
    return 'alta';
  } else if (n >= 4 && maxGap <= 3 && fluctuationRatio < 0.6) {
    return 'media';
  } else {
    return 'baja';
  }
}

/**
 * Generates a dynamic narrative for Spanish coach feedback based on exact exercise stats.
 */
function generateCoachAnalysis(
  exercise: Exercise,
  trend: 'lineal' | 'desacelerando' | 'estancado' | 'irregular',
  latestRM: number,
  baseRM: number,
  totalSessions: number,
  stagnationWeeks: number,
  firstHalfVolume: number,
  secondHalfVolume: number,
  trendChangeValue: number,
  trendLabel: string
): string {
  const unit = exercise.unit || 'kg';
  
  // If there's 0% or negative progress overall or in the trend change
  if (trendChangeValue <= 0) {
    return `Para tu entrenamiento de ${exercise.name}, vemos que llevas un tiempo sin progreso neto registrado (tu cambio actual es de ${trendLabel}). Tu estimación actual se encuentra estancada en ${latestRM} ${unit}. Aunque tu constancia con Hevy es fantástica, para romper esta meseta necesitamos ajustar la estructura de tu rutina, variar los estímulos o revisar los tiempos de recuperación. Cada sesión cuenta; mantente firme y enfócate en la calidad de cada repetición.`;
  }
  
  if (trend === 'estancado') {
    return `Para tu entrenamiento de ${exercise.name}, registramos un estancamiento en las últimas ${stagnationWeeks || 4} semanas, con tu mejor estimación bloqueada en ${latestRM} ${unit}. Tu volumen de tonelaje promedio en la segunda mitad de tus sesiones (${Math.round(secondHalfVolume)} ${unit}) en comparación con la primera mitad (${Math.round(firstHalfVolume)} ${unit}) muestra que estás acumulando fatiga excesiva sin progreso en intensidad. Recomiendo modificar los tiempos de descanso.`;
  }
  
  if (trend === 'desacelerando') {
    const diff = latestRM - baseRM;
    return `En el caso de ${exercise.name}, tu ganancia neta acumulada es de +${Math.round(diff)} ${unit} tras ${totalSessions} entrenamientos, pero el ritmo ha comenzado a desacelerar. Tu volumen pasó de un promedio de ${Math.round(firstHalfVolume)} ${unit} a ${Math.round(secondHalfVolume)} ${unit}. Esto es normal a medida que te acercas a tus límites de adaptación biológica. Tu técnica es consistente, pero debes priorizar la recuperación neuromuscular.`;
  }
  
  if (trend === 'lineal') {
    const gain = latestRM - baseRM;
    return `Tu progresión en ${exercise.name} sigue una trayectoria impecable y saludable, con una ganancia de +${Math.round(gain)} ${unit} en ${totalSessions} sesiones registradas. Tu tonelaje promedio actual está en ${Math.round(secondHalfVolume)} ${unit} (frente a los ${Math.round(firstHalfVolume)} ${unit} iniciales), lo que valida que el estímulo hipertrófico y el reclutamiento de unidades motoras están perfectamente al día.`;
  }
  
  return `Tu historial en ${exercise.name} cuenta con solo ${totalSessions} registros con peso. Aunque vemos destellos prometedores de fuerza con tu mejor estimación actual en ${latestRM} ${unit}, la variabilidad estadística es alta. Sigue registrando marcas consecutivas para estabilizar tu proyección de fuerza y volumen semanal.`;
}

/**
 * Expresses frequency in natural, human-friendly terms
 */
function formatFrequencyHuman(freq: number): string {
  if (freq <= 0.2) return "una vez cada 4-5 semanas";
  if (freq <= 0.4) return "una vez cada 2-3 semanas";
  if (freq <= 0.6) return "una vez cada 10-12 días";
  if (freq <= 0.9) return "cada 8-9 días (unas 3 veces al mes)";
  if (freq >= 1.0 && freq < 1.3) return "al menos 1 vez por semana";
  if (freq >= 1.3 && freq < 1.7) return "3 veces cada 2 semanas";
  if (freq >= 1.7 && freq < 2.3) return "2 veces por semana";
  return `${Math.round(freq)} veces por semana`;
}

/**
 * Generates an actionable dynamic real-data recommendation.
 */
function generateRecommendation(
  exercise: Exercise,
  trend: 'lineal' | 'desacelerando' | 'estancado' | 'irregular',
  projectionRange: [number, number] | null,
  logs: LiftLog[]
): string {
  if (logs.length < 3 || !projectionRange) {
    return `No disponemos de suficiente historial en ${exercise.name} para prescribir una recomendación de carga confiable. Sigue registrando tus entrenamientos de forma constante.`;
  }

  const latestLog = logs[logs.length - 1];
  const latestDate = new Date(latestLog.date);
  const limit28Days = latestDate.getTime() - 28 * 24 * 60 * 60 * 1000;
  
  const last4WeeksLogs = logs.filter(l => new Date(l.date).getTime() >= limit28Days);
  const frequencyPerWeek = Math.round((last4WeeksLogs.length / 4) * 10) / 10;
  
  const projectionHigh = projectionRange[1];
  const unit = exercise.unit || 'kg';
  const humanFreq = formatFrequencyHuman(frequencyPerWeek);

  if (trend === 'estancado') {
    if (frequencyPerWeek < 1.0) {
      return `Para salir de este estancamiento y alcanzar el techo de ${projectionHigh} ${unit}, aumenta la frecuencia semanal de ${exercise.name} a al menos 1 vez por semana o 2 veces por semana (actualmente promedias ${humanFreq}) para acumular suficiente volumen de calidad.`;
    } else {
      return `Ya entrenas con regularidad (${humanFreq}). Para superar esta meseta hacia los ${projectionHigh} ${unit}, realiza una semana de descarga (deload) reduciendo el peso un 10%, o varía las repeticiones a rangos de 4-6 reps con mayor descanso.`;
    }
  }

  if (trend === 'desacelerando') {
    return `Tu ritmo de adaptación está bajando. Para inclinarte hacia el techo proyectado de ${projectionHigh} ${unit}, incrementa la intensidad relativa agregando +2.5 ${unit} en tu primera serie efectiva y extendiendo el descanso a 3-4 minutos.`;
  }

  if (trend === 'lineal') {
    const recommendedFreqStr = formatFrequencyHuman(frequencyPerWeek > 0 ? frequencyPerWeek : 1.0);
    return `Para mantener este excelente ritmo lineal hacia tu techo de ${projectionHigh} ${unit}, mantén tu frecuencia de ${recommendedFreqStr} e introduce incrementos micro-progresivos de +1.25 ${unit} en tu serie efectiva cada dos semanas.`;
  }

  return `Sigue registrando al menos una sesión semanal consistente de ${exercise.name} para acumular datos suficientes para una recomendación técnica y de progresión de cargas.`;
}

/**
 * Analyzes the lift history and generates 2-month strength projections.
 */
export function analyzeExerciseTrend(exercise: Exercise): ProjectionResult {
  const logs = [...(exercise.logs || [])].sort((a, b) => a.week - b.week);
  const n = logs.length;
  const unit = exercise.unit || 'kg';
  const patternName = 
    exercise.pattern === 'empuje' ? 'Empuje (Push)' : 
    exercise.pattern === 'jalon' ? 'Jalón (Pull)' : 
    exercise.pattern === 'pierna' ? 'Pierna (Legs)' : 'Auxiliar';

  // Calculate the monthly trend label
  const trendChange = calculateRMPercentageChange(exercise);
  const trendLabel = trendChange.text;

  // Calculate dynamic confidence
  const confidence = calculateConfidence(logs);

  if (n < 3) {
    const latest1RM = exercise.current1RM;
    const target1RM = exercise.target1RM;
    const projectedLow = Math.round(latest1RM);
    const projectedHigh = Math.round(Math.max(latest1RM + 5, target1RM));
    let range: [number, number] = [projectedLow, projectedHigh];
    
    // Apply standard minDelta logic
    const minDelta = Math.max(10, Math.round((latest1RM * 0.15) / 2.5) * 2.5);
    if (range[1] - range[0] < minDelta) {
      range[1] = Math.round((range[0] + minDelta) / 2.5) * 2.5;
    }

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      patternName,
      currentValue: exercise.current1RM,
      unit,
      trend: 'irregular',
      trendLabel,
      trendPercent: trendChange.percentStr,
      trendPeriod: trendChange.periodStr,
      confidence,
      projectionRange: range,
      note: `Tu historial de entrenamiento en ${exercise.name} es muy corto para proyectar con confianza. Registra al menos 3 sesiones de este ejercicio con peso para analizar tu patrón de fuerza.`,
      shortHistory: true,
      totalSessions: n,
      recommendation: `No disponemos de suficiente historial en ${exercise.name} para prescribir una recomendación de carga confiable. Sigue registrando tus entrenamientos de forma constante.`
    };
  }

  const calculated1RMs = logs.map(l => calculateEst1RM(l.weight, l.reps));
  const latest1RM = calculated1RMs[n - 1];
  const first1RM = calculated1RMs[0];
  
  const overallGain = latest1RM - first1RM;
  const lastIndex = n - 1;
  const totalWeeks = Math.max(1, logs[lastIndex].week - logs[0].week);
  const avgWeeklyGain = overallGain / totalWeeks;

  const stagnationInfo = getStagnationWeeks(exercise);
  // Force trend to stagnant if stagnation detected OR if percentage change is zero/negative
  const isStagnant = stagnationInfo.isStagnant || trendChange.value <= 0 || (n >= 4 && calculated1RMs.slice(-3).every(val => val <= calculated1RMs[n - 4] + 0.5));

  let trend: 'lineal' | 'desacelerando' | 'estancado' | 'irregular' = 'lineal';
  let projectionRange: [number, number] | null = null;

  // Calculate dynamic average volumes for first/second half
  const midPoint = Math.floor(n / 2);
  const firstHalfVolume = logs.slice(0, midPoint).reduce((sum, l) => sum + l.volume, 0) / Math.max(1, midPoint);
  const secondHalfVolume = logs.slice(midPoint).reduce((sum, l) => sum + l.volume, 0) / Math.max(1, n - midPoint);

  if (isStagnant) {
    trend = 'estancado';
    projectionRange = [
      Math.round(latest1RM),
      Math.round(latest1RM + 2.5)
    ];
  } else if (n >= 5) {
    const firstHalfRM = calculated1RMs[midPoint];
    const initialRM = calculated1RMs[0];
    const finalRM = calculated1RMs[n - 1];

    const firstHalfGain = firstHalfRM - initialRM;
    const secondHalfGain = finalRM - firstHalfRM;

    if (secondHalfGain > 0 && secondHalfGain < firstHalfGain * 0.35) {
      trend = 'desacelerando';
      const projectionLow = Math.round((latest1RM + secondHalfGain * 1.5) / 2.5) * 2.5;
      const projectionHigh = Math.round((latest1RM + secondHalfGain * 2.8) / 2.5) * 2.5;
      projectionRange = [projectionLow, projectionHigh];
    } else if (secondHalfGain <= 0 && firstHalfGain > 0) {
      trend = 'estancado';
      projectionRange = [
        Math.round(latest1RM),
        Math.round(latest1RM * 1.02)
      ];
    } else {
      trend = 'lineal';
      const projectedLow = Math.round((latest1RM + avgWeeklyGain * 8 * 0.75) / 2.5) * 2.5;
      const projectedHigh = Math.round((latest1RM + avgWeeklyGain * 8 * 1.25) / 2.5) * 2.5;
      projectionRange = [projectedLow, projectedHigh];
    }
  } else {
    trend = 'lineal';
    const projectedLow = Math.round((latest1RM + avgWeeklyGain * 8 * 0.65) / 2.5) * 2.5;
    const projectedHigh = Math.round((latest1RM + avgWeeklyGain * 8 * 1.35) / 2.5) * 2.5;
    projectionRange = [projectedLow, projectedHigh];
  }

  // Ensure non-zero width range with a scaling delta based on confidence and weight
  if (projectionRange) {
    let [low, high] = projectionRange;
    const minDelta = confidence === 'baja' 
      ? Math.max(7.5, Math.round((latest1RM * 0.15) / 2.5) * 2.5) 
      : confidence === 'media'
        ? Math.max(5.0, Math.round((latest1RM * 0.10) / 2.5) * 2.5)
        : Math.max(2.5, Math.round((latest1RM * 0.05) / 2.5) * 2.5);
         
    if (high - low < minDelta) {
      const diffNeeded = minDelta - (high - low);
      // Floor the range low bound at current 1RM rounded, and extend the high bound
      low = Math.round(latest1RM / 2.5) * 2.5;
      high = Math.round((low + minDelta) / 2.5) * 2.5;
      projectionRange = [low, high];
    }
  }

  const note = generateCoachAnalysis(
    exercise,
    trend,
    Math.round(latest1RM),
    Math.round(first1RM),
    n,
    stagnationInfo.weeks,
    firstHalfVolume,
    secondHalfVolume,
    trendChange.value,
    trendLabel
  );

  const recommendation = generateRecommendation(exercise, trend, projectionRange, logs);

  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    patternName,
    currentValue: Math.round(latest1RM),
    unit,
    trend,
    trendLabel,
    trendPercent: trendChange.percentStr,
    trendPeriod: trendChange.periodStr,
    confidence,
    projectionRange,
    note,
    shortHistory: false,
    totalSessions: n,
    recommendation
  };
}
