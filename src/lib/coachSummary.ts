import { Exercise } from '../types';
import { analyzeExerciseTrend } from './projections';

const SUMMARY_WINDOW_DAYS = 42; // ~6 semanas

function isWithinWindow(dateStr: string, now: number): boolean {
  const ms = new Date(dateStr).getTime();
  return now - ms <= SUMMARY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

const PATTERN_LABELS: Record<string, string> = {
  empuje: 'Empuje (pecho/hombros/tríceps)',
  jalon: 'Jalón (espalda/bíceps)',
  pierna: 'Pierna',
};

/**
 * Arma un resumen de texto acotado (últimas ~6 semanas) a partir de los ejercicios
 * ya sincronizados, en vez de mandarle a Gemini el historial crudo completo.
 */
export function buildTrainingSummary(exercises: Exercise[]): string {
  if (!exercises || exercises.length === 0) {
    return 'El usuario todavía no tiene ningún entrenamiento registrado en NextPR.';
  }

  const now = Date.now();
  const primaries = exercises.filter((e) => e.category === 'primary');
  const secondaries = exercises.filter((e) => e.category === 'secondary');

  const lines: string[] = [];
  lines.push(`Fecha de hoy: ${new Date(now).toISOString().substring(0, 10)}`);
  lines.push('');
  lines.push('EJERCICIOS PRINCIPALES (uno por patrón de movimiento):');

  primaries.forEach((ex) => {
    const analysis = analyzeExerciseTrend(ex);
    const recentLogs = ex.logs.filter((l) => isWithinWindow(l.date, now));
    const recentLogsStr = recentLogs.length > 0
      ? recentLogs.map((l) => `${l.date}: ${l.weight}${ex.unit} x${l.reps} x${l.sets} series`).join('; ')
      : 'sin sesiones registradas en las últimas 6 semanas';

    lines.push(
      `- ${ex.name} (${analysis.patternName}): 1RM actual ${ex.current1RM}${ex.unit}, meta ${ex.target1RM}${ex.unit}, ` +
      `tendencia: ${analysis.trend} (${analysis.trendLabel}), confianza de los datos: ${analysis.confidence}. ` +
      `Sesiones recientes: ${recentLogsStr}.`
    );
  });

  lines.push('');
  lines.push('VOLUMEN POR GRUPO MUSCULAR (últimas 6 semanas, peso × repeticiones × series):');

  const volumeByPattern: Record<string, number> = { empuje: 0, jalon: 0, pierna: 0 };
  exercises.forEach((ex) => {
    if (!ex.pattern) return;
    ex.logs.forEach((l) => {
      if (isWithinWindow(l.date, now)) {
        volumeByPattern[ex.pattern!] = (volumeByPattern[ex.pattern!] || 0) + l.volume;
      }
    });
  });
  (['empuje', 'jalon', 'pierna'] as const).forEach((pattern) => {
    lines.push(`- ${PATTERN_LABELS[pattern]}: ${Math.round(volumeByPattern[pattern])} kg`);
  });

  lines.push('');
  lines.push('RÉCORDS RECIENTES (últimas 6 semanas):');
  const recentPRs = exercises.filter((ex) => isWithinWindow(ex.lastImprovementDate, now));
  if (recentPRs.length > 0) {
    recentPRs.forEach((ex) => {
      lines.push(`- ${ex.name}: nueva marca de ${ex.current1RM}${ex.unit} el ${ex.lastImprovementDate}.`);
    });
  } else {
    lines.push('- Sin nuevas marcas personales en las últimas 6 semanas.');
  }

  if (secondaries.length > 0) {
    lines.push('');
    lines.push('OTROS EJERCICIOS (secundarios):');
    secondaries.forEach((ex) => {
      const analysis = analyzeExerciseTrend(ex);
      lines.push(`- ${ex.name}: 1RM actual ${ex.current1RM}${ex.unit}, tendencia: ${analysis.trend}.`);
    });
  }

  return lines.join('\n');
}
