import { Exercise } from '../types';
import { calculateGlobalMetrics, calculateProgressPercentage, getStagnationWeeks } from '../data';
import { analyzeExerciseTrend } from './projections';

function findMentionedExercise(question: string, exercises: Exercise[]): Exercise | undefined {
  const q = question.toLowerCase();
  return exercises.find((ex) => q.includes(ex.name.toLowerCase()));
}

function mostRecentPR(exercises: Exercise[]): Exercise | undefined {
  return [...exercises].sort(
    (a, b) => new Date(b.lastImprovementDate).getTime() - new Date(a.lastImprovementDate).getTime()
  )[0];
}

function replyProgressThisMonth(exercises: Exercise[]): string {
  const metrics = calculateGlobalMetrics(exercises);
  const changeText = metrics.tonnageChangePercent >= 0
    ? `subió un ${metrics.tonnageChangePercent}%`
    : `bajó un ${Math.abs(metrics.tonnageChangePercent)}%`;

  return `Este mes levantaste un total de ${metrics.totalTonnageThisMonth.toLocaleString()} kg, lo que ${changeText} respecto al mes anterior. ` +
    `Llevás una racha de ${metrics.currentStreakDays} días (tu mejor racha fue de ${metrics.bestStreakDays} días), y tu progreso promedio hacia tus metas de 1RM está en ${metrics.averageProgressPercent}%. ` +
    `${metrics.tonnageChangePercent >= 0 ? '¡Vas por buen camino, seguí así!' : 'Es un buen momento para retomar el ritmo de entrenamiento.'}`;
}

function replyLatestPR(exercises: Exercise[], mentioned?: Exercise): string {
  const target = mentioned || mostRecentPR(exercises);
  if (!target) return 'Todavía no tenés ningún récord registrado.';

  return `Tu récord más reciente en ${target.name} fue de ${target.current1RM} ${target.unit}, registrado el ${target.lastImprovementDate}. ` +
    `Tu meta actual es ${target.target1RM} ${target.unit}, así que te faltan ${Math.max(0, target.target1RM - target.current1RM)} ${target.unit} para llegar.`;
}

function replyPriorityMuscleGroup(exercises: Exercise[]): string {
  const primaries = exercises.filter((e) => e.category === 'primary');
  if (primaries.length === 0) return 'Todavía no tenés ejercicios principales definidos para darte una recomendación por grupo muscular.';

  const withStagnation = primaries.map((ex) => ({ ex, stagnation: getStagnationWeeks(ex) }));
  const stagnant = withStagnation.filter((w) => w.stagnation.isStagnant).sort((a, b) => b.stagnation.weeks - a.stagnation.weeks)[0];

  if (stagnant) {
    const analysis = analyzeExerciseTrend(stagnant.ex);
    return `Te recomiendo priorizar ${analysis.patternName} esta semana: tu ${stagnant.ex.name} lleva ${stagnant.stagnation.weeks} semanas sin progresar. ${analysis.recommendation}`;
  }

  const lowestProgress = primaries.map((ex) => ({ ex, progress: calculateProgressPercentage(ex) })).sort((a, b) => a.progress - b.progress)[0];
  const analysis = analyzeExerciseTrend(lowestProgress.ex);
  return `Todos tus patrones de movimiento están progresando bien, pero ${analysis.patternName} (${lowestProgress.ex.name}) es el que está más lejos de su meta (${lowestProgress.progress}%). Le vendría bien un poco más de foco esta semana.`;
}

function replyVolumeComparison(exercises: Exercise[]): string {
  const metrics = calculateGlobalMetrics(exercises);
  const previousMonthEstimate = metrics.tonnageChangePercent !== 0
    ? Math.round(metrics.totalTonnageThisMonth / (1 + metrics.tonnageChangePercent / 100))
    : metrics.totalTonnageThisMonth;

  const verb = metrics.tonnageChangePercent >= 0 ? 'más' : 'menos';
  return `Este mes tu volumen total fue de ${metrics.totalTonnageThisMonth.toLocaleString()} kg, contra unos ${previousMonthEstimate.toLocaleString()} kg del mes anterior. ` +
    `Eso es ${Math.abs(metrics.tonnageChangePercent)}% ${verb} tonelaje que el mes pasado.`;
}

function replyStagnantExercises(exercises: Exercise[]): string {
  const stagnant = exercises
    .map((ex) => ({ ex, stagnation: getStagnationWeeks(ex) }))
    .filter((w) => w.stagnation.isStagnant);

  if (stagnant.length === 0) {
    return '¡Buenas noticias! Ningún ejercicio está estancado ahora mismo — todos muestran progreso dentro de las últimas semanas.';
  }

  const list = stagnant.map((w) => `${w.ex.name} (${w.stagnation.weeks} semanas sin subir peso)`).join(', ');
  return `Sí, tenés ${stagnant.length === 1 ? 'un ejercicio estancado' : `${stagnant.length} ejercicios estancados`}: ${list}. Te recomiendo variar reps, hacer una semana de descarga, o ajustar la frecuencia para romper la meseta.`;
}

function replyWeeklyRecommendation(exercises: Exercise[]): string {
  const primaries = exercises.filter((e) => e.category === 'primary');
  const candidate = primaries.find((ex) => getStagnationWeeks(ex).isStagnant) || primaries[0];

  if (!candidate) return 'Registrá al menos un entrenamiento para que pueda darte una recomendación concreta.';

  const analysis = analyzeExerciseTrend(candidate);
  return `Para esta semana, enfocate en ${candidate.name}: ${analysis.recommendation}`;
}

function replyExerciseDetail(exercise: Exercise): string {
  const analysis = analyzeExerciseTrend(exercise);
  const progress = calculateProgressPercentage(exercise);
  return `${exercise.name} (${analysis.patternName}): tu 1RM actual es ${exercise.current1RM} ${exercise.unit}, con una meta de ${exercise.target1RM} ${exercise.unit} (${progress}% de progreso). ` +
    `Tendencia: ${analysis.trend} (${analysis.trendLabel}). ${analysis.recommendation}`;
}

/**
 * Genera una respuesta simulada, alineada con los datos reales/mock cargados,
 * para usar cuando todavía no hay una GEMINI_API_KEY configurada en el servidor.
 */
export function getMockCoachReply(question: string, exercises: Exercise[]): string {
  if (!exercises || exercises.length === 0) {
    return 'Todavía no tenés entrenamientos cargados. Sincronizá con Hevy o cargá el set de ejemplo para que pueda darte recomendaciones.';
  }

  const q = question.toLowerCase();
  const mentioned = findMentionedExercise(question, exercises);

  if (q.includes('progreso') && q.includes('mes')) return replyProgressThisMonth(exercises);
  if (q.includes('récord') || q.includes('record') || q.includes('marca personal')) return replyLatestPR(exercises, mentioned);
  if (q.includes('priorizar') || (q.includes('grupo muscular') && !q.includes('compar'))) return replyPriorityMuscleGroup(exercises);
  if (q.includes('compar') && q.includes('volumen')) return replyVolumeComparison(exercises);
  if (q.includes('estanc')) return replyStagnantExercises(exercises);
  if (q.includes('recomendaci') && q.includes('semana')) return replyWeeklyRecommendation(exercises);
  if (mentioned) return replyExerciseDetail(mentioned);

  return 'No tengo una respuesta puntual para eso todavía en modo simulado — probá con una de las preguntas sugeridas, o preguntame por el nombre de un ejercicio puntual (por ejemplo, tu sentadilla o press banca).';
}
