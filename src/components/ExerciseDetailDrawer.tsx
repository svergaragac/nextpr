import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Flame, Calendar, Dumbbell, Sparkles, TrendingUp, HelpCircle, Info } from 'lucide-react';
import { Exercise } from '../types';
import { analyzeExerciseTrend, calculateEst1RM } from '../lib/projections';
import { calculateProgressPercentage, getStagnationWeeks } from '../data';
import { TrendChart } from './TrendChart';

interface ExerciseDetailDrawerProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onPromoteToPrimary: (exerciseId: string) => void;
  onDemoteToSecondary: (exerciseId: string) => void;
}

export function ExerciseDetailDrawer({
  exercise,
  isOpen,
  onClose,
  onPromoteToPrimary,
  onDemoteToSecondary
}: ExerciseDetailDrawerProps) {
  
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!exercise) return null;

  const analysis = analyzeExerciseTrend(exercise);
  const progressPercent = calculateProgressPercentage(exercise);

  // Confidence color mappings
  let confidenceColor = 'text-rose-600';
  if (analysis.confidence === 'alta') {
    confidenceColor = 'text-emerald-600';
  } else if (analysis.confidence === 'media') {
    confidenceColor = 'text-amber-600';
  }

  // Trend styling
  let trendColor = 'text-rose-600';
  if (analysis.trend === 'lineal') {
    trendColor = 'text-emerald-600';
  } else if (analysis.trend === 'desacelerando') {
    trendColor = 'text-amber-600';
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-cohere-primary/40 backdrop-blur-xs z-50 cursor-pointer"
            id="drawer-backdrop"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-xl md:max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto flex flex-col border-l border-cohere-hairline"
            id="drawer-panel"
          >
            {/* Header */}
            <div className="p-6 border-b border-cohere-hairline sticky top-0 bg-white/95 backdrop-blur-md z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cohere-stone flex items-center justify-center text-cohere-primary">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-cohere-primary">{exercise.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cohere-stone text-cohere-slate border border-cohere-hairline">
                      {analysis.patternName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cohere-stone text-cohere-primary border border-cohere-hairline">
                      {exercise.category === 'primary' ? 'Primario' : 'Secundario'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Promote/Demote Toggle Button */}
                <button
                  onClick={() => {
                    if (exercise.category === 'primary') {
                      onDemoteToSecondary(exercise.id);
                    } else {
                      onPromoteToPrimary(exercise.id);
                    }
                  }}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-cohere-coral transition-all cursor-pointer"
                  title={exercise.category === 'primary' ? 'Quitar de primarios' : 'Destacar como primario'}
                  id="drawer-star-btn"
                >
                  <Star className={`w-5 h-5 ${exercise.category === 'primary' ? 'fill-cohere-coral text-cohere-coral' : ''}`} />
                </button>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                  id="drawer-close-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 space-y-6">
              
              {/* Quick Metrics Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1RM & Goal Progress Card */}
                <div className="bg-cohere-stone/30 border border-cohere-hairline rounded-lg p-4 flex flex-col justify-between h-[120px] col-span-1 overflow-hidden">
                  <div>
                    <span className="text-[9px] font-mono tracking-wider text-cohere-muted uppercase block">
                      1RM / META
                    </span>
                    <div className="mt-2 flex items-baseline h-8">
                      <span className="text-xl font-bold font-mono text-cohere-primary">
                        {analysis.currentValue}
                      </span>
                      <span className="text-xs font-medium font-mono text-cohere-slate ml-1">
                        / {exercise.target1RM} {analysis.unit}
                      </span>
                    </div>
                  </div>
                  
                  {/* Inline tiny progress bar */}
                  <div className="w-full">
                    <div className="w-full bg-cohere-stone h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cohere-primary rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-cohere-muted font-mono mt-1">
                      <span>Base: {exercise.baseline1RM} {analysis.unit}</span>
                      <span className="font-semibold text-cohere-primary">{progressPercent}%</span>
                    </div>
                  </div>
                </div>

                {/* Projection Card */}
                <div className="bg-cohere-stone/30 border border-cohere-hairline rounded-lg p-4 flex flex-col justify-between h-[120px] col-span-1 overflow-hidden">
                  <div>
                    <span className="text-[9px] font-mono tracking-wider text-cohere-muted uppercase flex items-center gap-1">
                      <Flame className="w-3 h-3 text-cohere-muted" />
                      PROY. 2 MESES
                    </span>
                    <div className="mt-2 flex items-baseline h-8">
                      {analysis.projectionRange ? (
                        <span className="text-xl font-bold font-mono text-cohere-primary">
                          {analysis.projectionRange[0]}–{analysis.projectionRange[1]}
                          <span className="text-xs font-medium font-mono text-cohere-slate ml-1">
                            {analysis.unit}
                          </span>
                        </span>
                      ) : (
                        <span className="text-lg font-bold font-sans text-cohere-slate">Retenida</span>
                      )}
                    </div>
                  </div>
                  <div className="text-[8px] font-mono text-cohere-muted uppercase tracking-wider truncate">
                    {analysis.shortHistory ? 'Estimación amplia, historial limitado' : 'Rango esperado de 1RM'}
                  </div>
                </div>

                {/* Trend Card */}
                <div className="bg-cohere-stone/30 border border-cohere-hairline rounded-lg p-4 flex flex-col justify-between h-[120px] col-span-1 overflow-hidden">
                  <div>
                    <span className="text-[9px] font-mono tracking-wider text-cohere-muted uppercase block">
                      TENDENCIA
                    </span>
                    <div className="mt-2 flex items-baseline h-8">
                      <span className={`text-xl font-bold font-mono ${trendColor}`}>
                        {analysis.trendPercent}
                      </span>
                    </div>
                  </div>
                  <div className="text-[8px] font-mono text-cohere-muted uppercase tracking-wider truncate">
                    {analysis.trend === 'estancado' ? `${getStagnationWeeks(exercise).weeks} sem estancado` : analysis.trendPeriod}
                  </div>
                </div>

                {/* Confidence Card */}
                <div className="bg-cohere-stone/30 border border-cohere-hairline rounded-lg p-4 flex flex-col justify-between h-[120px] col-span-1 overflow-hidden">
                  <div>
                    <span className="text-[9px] font-mono tracking-wider text-cohere-muted uppercase flex items-center gap-1">
                      CONFIANZA
                      <Info className="w-2.5 h-2.5 text-cohere-muted" title="Calculado por calidad de frecuencia y consistencia" />
                    </span>
                    <div className="mt-2 flex items-baseline h-8">
                      <span className={`text-xl font-bold font-mono uppercase tracking-tight ${confidenceColor}`}>
                        {analysis.confidence}
                      </span>
                    </div>
                  </div>
                  <div className="text-[8px] font-mono text-cohere-muted uppercase tracking-wider truncate">
                    Calidad de consistencia
                  </div>
                </div>

              </div>

              {/* Actionable Coach Recommendation Callout */}
              <div className="bg-cohere-stone/30 border border-cohere-hairline rounded-lg p-5 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-cohere-primary text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-cohere-coral-soft" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-cohere-primary uppercase tracking-wider mb-1">
                    Plan de Progreso Sugerido
                  </h4>
                  <p className="text-xs text-cohere-ink leading-relaxed">
                    {analysis.recommendation}
                  </p>
                </div>
              </div>

              {/* Coach Analysis note card */}
              <div className="bg-white border border-cohere-hairline rounded-lg p-5">
                <h4 className="text-xs font-bold text-cohere-slate uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cohere-blue" />
                  Análisis Detallado del Coach
                </h4>
                <p className="text-xs text-cohere-ink leading-relaxed">
                  {analysis.note}
                </p>
              </div>

              {/* Historical Trend Chart Area */}
              <div key={exercise.id}>
                <TrendChart exercise={exercise} />
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
