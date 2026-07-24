import { ArrowUpRight, MoveRight, ArrowDownRight, TrendingUp, ChevronRight, Dumbbell, Star } from 'lucide-react';
import { Exercise } from '../types';
import { analyzeExerciseTrend } from '../lib/projections';

interface OtherExercisesTableProps {
  exercises: Exercise[];
  onSelectExercise: (exercise: Exercise) => void;
  onPromoteToPrimary: (exerciseId: string) => void;
  selectedId: string;
}

export function OtherExercisesTable({
  exercises,
  onSelectExercise,
  onPromoteToPrimary,
  selectedId
}: OtherExercisesTableProps) {
  
  return (
    <div className="bg-white border border-cohere-hairline rounded-lg overflow-hidden transition-all duration-300">
      <div className="p-6 flex justify-between items-end">
        <div>
          <span className="text-[11px] font-mono tracking-[0.08em] text-cohere-slate uppercase block mb-2">
            Auxiliares
          </span>
          <h3 className="text-2xl font-normal text-cohere-primary tracking-[-0.01em] flex items-center gap-2">
            Otros ejercicios <span className="text-cohere-muted text-base font-display">({exercises.length})</span>
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-cohere-body-muted font-mono uppercase tracking-[0.06em]">
          <TrendingUp className="w-3.5 h-3.5 text-cohere-green" />
          <span>Click para ver tendencia</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-cohere-ink text-[11px] font-mono font-normal text-cohere-slate tracking-[0.08em] uppercase">
              <th className="py-4 px-6 font-normal">Ejercicio</th>
              <th className="py-4 px-6 text-center font-normal">Mejor Marca (1RM)</th>
              <th className="py-4 px-6 text-center font-normal">Último Intento</th>
              <th className="py-4 px-6 text-center font-normal">Tendencia</th>
              <th className="py-4 px-6 text-right font-normal">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {exercises.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 px-6 text-center text-cohere-body-muted font-sans text-xs">
                  No hay ejercicios secundarios. Agrega uno o despromueve un ejercicio primario.
                </td>
              </tr>
            ) : (
              exercises.map((ex) => {
                const lastLog = ex.logs[ex.logs.length - 1];
                const lastWeight = lastLog ? lastLog.weight : 0;
                const isSelected = selectedId === ex.id;
                const analysis = analyzeExerciseTrend(ex);

                // Inline calculation of trend icon and colors
                let trendIcon = <span className="text-cohere-slate">■</span>;
                let trendColor = 'text-cohere-slate';

                if (analysis.trend === 'lineal') {
                  trendIcon = <span className="text-cohere-green font-mono font-bold">▲</span>;
                  trendColor = 'text-cohere-green';
                } else if (analysis.trend === 'desacelerando') {
                  trendIcon = <span className="text-cohere-coral font-mono font-bold">▲</span>;
                  trendColor = 'text-cohere-coral';
                } else if (analysis.trend === 'estancado') {
                  trendIcon = <span className="text-red-600 font-mono font-bold">▼</span>;
                  trendColor = 'text-red-600';
                }

                return (
                  <tr
                    key={ex.id}
                    className={`border-b border-cohere-hairline hover:bg-cohere-stone/15 transition-colors cursor-pointer group ${
                      isSelected ? 'bg-cohere-stone/25 text-cohere-primary' : 'text-cohere-ink'
                    }`}
                    onClick={() => onSelectExercise(ex)}
                  >
                    {/* Name column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected 
                            ? 'bg-cohere-primary text-white' 
                            : 'bg-cohere-stone text-cohere-slate group-hover:bg-cohere-hairline'
                        }`}>
                          <Dumbbell className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-cohere-primary group-hover:text-cohere-blue transition-colors flex items-center gap-1.5 text-sm">
                            {ex.name}
                            {isSelected && <span className="w-1.5 h-1.5 bg-cohere-coral rounded-full animate-pulse" />}
                          </div>
                          <div className="text-[10px] text-cohere-muted font-mono uppercase mt-0.5">
                            Meta: {ex.target1RM} {ex.unit}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Best Column (1RM) */}
                    <td className="py-5 px-6 text-center font-display text-xl font-normal text-cohere-primary tracking-[-0.01em]">
                      {ex.current1RM} <span className="text-sm text-cohere-slate">{ex.unit}</span>
                    </td>

                    {/* Last Attempt Column */}
                    <td className="py-5 px-6 text-center font-display text-xl font-normal text-cohere-ink tracking-[-0.01em]">
                      {lastWeight > 0 ? (
                        <>
                          {lastWeight} <span className="text-sm text-cohere-slate">{ex.unit}</span>
                        </>
                      ) : (
                        <span className="text-cohere-muted">-</span>
                      )}
                    </td>

                    {/* Trend Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1.5">
                        {trendIcon}
                        <span className={`text-xs font-mono font-medium ${trendColor}`}>
                          {analysis.trendLabel}
                        </span>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="py-5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3">
                        {/* Promote action — Cohere pill-outline */}
                        <button
                          onClick={() => onPromoteToPrimary(ex.id)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-cohere-primary px-3.5 py-1.5 text-xs font-medium text-cohere-primary hover:bg-cohere-primary hover:text-white transition-all cursor-pointer"
                          title="Promover a Principal"
                        >
                          <Star className="w-3 h-3" />
                          Promover
                        </button>

                        <ChevronRight className="w-4 h-4 text-cohere-muted group-hover:text-cohere-primary transition-colors" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
