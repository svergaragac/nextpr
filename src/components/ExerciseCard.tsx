import { motion } from 'motion/react';
import { Exercise } from '../types';
import { analyzeExerciseTrend, calculateRMPercentageChange, ProjectionResult } from '../lib/projections';
import { calculateProgressPercentage } from '../data';

interface ExerciseCardProps {
  exercise: Exercise;
  isSelected: boolean;
  onSelect: () => void;
}

export function ExerciseCard({ exercise, isSelected, onSelect }: ExerciseCardProps) {
  const analysis: ProjectionResult = analyzeExerciseTrend(exercise);
  const progressPercent = calculateProgressPercentage(exercise);
  const trendChange = calculateRMPercentageChange(exercise);

  // Peso real de trabajo más reciente (lo que efectivamente levantas), para
  // mostrarlo junto al 1RM estimado y que el número grande no se lea como tu peso.
  const latestLog = [...(exercise.logs || [])].sort((a, b) => a.week - b.week).at(-1);

  // Formatting trend percentage change (e.g. +19.8% or -2.5%)
  const formattedChange = trendChange.value >= 0 
    ? `+${trendChange.value.toFixed(1)}%` 
    : `${trendChange.value.toFixed(1)}%`;

  // Trend chip (Cohere: coral outline for attention, green for positive) — used as a taxonomy marker
  let trendChip = 'border border-cohere-coral-soft text-cohere-body-muted bg-white';
  let trendText = formattedChange;
  if (analysis.trend === 'lineal') {
    trendChip = 'border border-cohere-green/40 text-cohere-green bg-cohere-green/5';
  } else if (analysis.trend === 'desacelerando') {
    trendChip = 'border border-cohere-coral text-cohere-coral bg-cohere-coral/5';
  } else if (analysis.trend === 'estancado') {
    trendChip = 'border border-cohere-coral text-cohere-coral bg-[#fff5f2]';
    trendText = 'Estancado';
  }

  return (
    <motion.div
      onClick={onSelect}
      whileHover={{ y: -3 }}
      className={`relative cursor-pointer rounded-lg p-6 transition-all duration-300 flex flex-col h-[248px] ${
        isSelected
          ? 'bg-cohere-stone ring-1 ring-cohere-primary'
          : 'bg-cohere-stone hover:bg-[#e8e5df]'
      }`}
      id={`exercise-card-${exercise.id}`}
    >
      {/* Top Row: Pattern label + Trend chip */}
      <div className="flex justify-between items-start gap-2 mb-3">
        <span className="text-[11px] font-mono text-cohere-body-muted uppercase tracking-[0.08em] pt-1">
          {analysis.patternName}
        </span>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium font-sans whitespace-nowrap shrink-0 ${trendChip}`}>
          {trendText}
        </span>
      </div>

      {/* Name + hero: peso real de trabajo. El 1RM estimado va como dato secundario. */}
      <h3 className="text-lg font-normal text-cohere-primary tracking-[-0.01em] leading-snug line-clamp-1 mb-1">
        {exercise.name}
      </h3>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[40px] leading-none font-display font-normal text-cohere-primary tracking-[-0.02em]">
          {latestLog ? latestLog.weight : analysis.currentValue}
        </span>
        <span className="text-sm font-display text-cohere-body-muted">
          {analysis.unit}{latestLog ? ` × ${latestLog.reps}` : ''}
        </span>
      </div>
      <p className="text-[11px] font-mono text-cohere-body-muted mt-1.5">
        ≈ {analysis.currentValue} {analysis.unit} · 1RM est.
      </p>

      <div className="flex-1" />

      {/* Divider + Progress */}
      <div className="h-px bg-cohere-hairline my-3.5" />
      <div className="flex justify-between text-[11px] font-mono text-cohere-slate uppercase tracking-[0.06em] mb-2">
        <span>Próxima meta {exercise.target1RM}{exercise.unit} 1RM</span>
        <span className="text-cohere-primary font-normal">{progressPercent}%</span>
      </div>
      <div className="w-full bg-[#dcd9d1] h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full bg-cohere-primary rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, progressPercent)}%` }}
        />
      </div>
    </motion.div>
  );
}

