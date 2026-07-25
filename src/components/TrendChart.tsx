import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, TrendingUp, Info } from 'lucide-react';
import { Exercise, LiftLog } from '../types';
import { calculateEst1RM } from '../lib/projections';

// Ventana de historial mostrada en el gráfico: últimos 3 meses de progresión.
const HISTORY_WINDOW_DAYS = 90;

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getUTCDate()} ${MONTHS_ES[d.getUTCMonth()]}`;
}

interface TrendChartProps {
  exercise: Exercise;
}

export function TrendChart({ exercise }: TrendChartProps) {
  const [metricType, setMetricType] = useState<'tonnage' | 'intensity'>('tonnage');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Historial ordenado cronológicamente
  const allSortedLogs = [...exercise.logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const totalLogsLength = allSortedLogs.length;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const fixedWindowStartMs = nowMs - HISTORY_WINDOW_DAYS * MS_PER_DAY;

  // Filtrar a los últimos 3 meses; si quedan menos de 3, tomar las últimas 3 sesiones.
  let logs = allSortedLogs.filter((log) => new Date(log.date).getTime() >= fixedWindowStartMs);
  if (logs.length < 3 && allSortedLogs.length >= 3) {
    logs = allSortedLogs.slice(-3);
  }
  const N = logs.length;

  if (totalLogsLength < 3) {
    return (
      <div className="bg-white border border-cohere-hairline rounded-xl p-8 flex flex-col items-center justify-center text-center h-[300px]">
        <div className="w-12 h-12 bg-cohere-stone border border-cohere-hairline rounded-lg flex items-center justify-center text-cohere-slate mb-4">
          <Info className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-cohere-primary mb-1">Historial insuficiente</h4>
        <p className="text-cohere-muted text-xs max-w-sm leading-relaxed">
          Se requieren al menos 3 sesiones registradas en Hevy para graficar una tendencia histórica confiable de {exercise.name}.
        </p>
      </div>
    );
  }

  // Aviso: cuántas sesiones se están mostrando
  const withinWindow = new Date(logs[0].date).getTime() >= fixedWindowStartMs;
  const sessionsStr = N === 1 ? '1 sesión' : `${N} sesiones`;
  const noticeText = withinWindow
    ? `${sessionsStr} en los últimos 3 meses`
    : `Últimas ${sessionsStr} registradas`;

  // Valor de la métrica activa
  const getMetricValue = (log: LiftLog) =>
    metricType === 'tonnage' ? log.volume : calculateEst1RM(log.weight, log.reps);

  const values = logs.map(getMetricValue);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);

  // Escala con margen para que el gráfico respire
  const valueDelta = maxVal - minVal;
  const dataMin = Math.max(0, minVal - (valueDelta > 0 ? valueDelta * 0.15 : minVal * 0.1));
  const dataMax = maxVal + (valueDelta > 0 ? valueDelta * 0.15 : maxVal * 0.1);

  // Dimensiones del SVG
  const width = 800;
  const height = 280;
  const paddingLeft = 70;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 40;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Cada sesión se posiciona de forma secuencial y equiespaciada (por índice),
  // no por la semana calendario. Así la línea es continua, sin huecos.
  const xForIndex = (i: number) =>
    paddingLeft + (N <= 1 ? plotWidth / 2 : (i / (N - 1)) * plotWidth);
  const yForVal = (val: number) => {
    const denom = dataMax - dataMin;
    return denom > 0 ? paddingTop + plotHeight - ((val - dataMin) / denom) * plotHeight : paddingTop + plotHeight / 2;
  };

  const points = logs.map((log, index) => ({
    x: xForIndex(index),
    y: yForVal(getMetricValue(log)),
    val: getMetricValue(log),
    log,
    index,
  }));

  // Una sola línea (y área) continua a través de todos los puntos
  const linePath = points.reduce(
    (d, p, i) => d + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`),
    ''
  );
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`
      : '';

  // Cuáles fechas etiquetar en el eje X (evita amontonar cuando hay muchas sesiones)
  const labelEvery = N <= 7 ? 1 : Math.ceil(N / 6);
  const shouldLabelIndex = (i: number) => i === 0 || i === N - 1 || i % labelEvery === 0;

  // Encuentra el punto más cercano a una coordenada X (de mouse o de toque) y
  // posiciona el tooltip. Compartido entre eventos de mouse y táctiles.
  const updateHoverFromClientX = (clientX: number, rect: DOMRect) => {
    if (points.length === 0) return;
    const svgX = ((clientX - rect.left) / rect.width) * width;

    let closest = 0;
    let minDist = Math.abs(svgX - points[0].x);
    points.forEach((p) => {
      const dist = Math.abs(svgX - p.x);
      if (dist < minDist) {
        minDist = dist;
        closest = p.index;
      }
    });

    setHoveredIndex(closest);

    const scaleX = rect.width / width;
    const scaleY = rect.height / height;
    const pt = points[closest];
    // Clamp horizontal del tooltip para que nunca se corte contra los bordes
    // del gráfico, sin importar cerca de qué extremo esté el punto.
    const TT_W = 230;
    const rawX = pt.x * scaleX;
    const clampedX = Math.max(8, Math.min(rawX - TT_W / 2, rect.width - TT_W - 8));
    setTooltipPos({ x: clampedX, y: pt.y * scaleY - 15 });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    updateHoverFromClientX(e.clientX, e.currentTarget.getBoundingClientRect());
  };

  // En mobile no hay hover: tocar/arrastrar sobre el gráfico muestra el tooltip.
  const handleTouch = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 0) return;
    updateHoverFromClientX(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
  };

  const handleMouseLeave = () => setHoveredIndex(null);

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] ?? null : null;

  const maxPoint = points.find((p) => p.val === maxVal);

  return (
    <div className="bg-white border border-cohere-hairline hover:border-cohere-primary/20 hover:shadow-sm rounded-xl p-6 transition-all duration-300 relative" ref={containerRef}>
      {/* Chart Title and Toggles */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-cohere-hairline pb-4">
        <div>
          <span className="text-[11px] font-mono tracking-wider text-cohere-blue uppercase block mb-1">
            {noticeText}
          </span>
          <h3 className="text-base font-bold text-cohere-primary flex items-center gap-2">
            Histórico de Tendencia: <span className="text-cohere-slate font-normal">{exercise.name}</span>
          </h3>
        </div>

        {/* Metric Selector Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-cohere-stone border border-cohere-hairline rounded-full p-0.5">
            <button
              onClick={() => {
                setMetricType('tonnage');
                setHoveredIndex(null);
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all uppercase cursor-pointer ${
                metricType === 'tonnage'
                  ? 'bg-cohere-primary text-white shadow-xs'
                  : 'text-cohere-slate hover:text-cohere-primary'
              }`}
            >
              VOLUMEN
            </button>
            <button
              onClick={() => {
                setMetricType('intensity');
                setHoveredIndex(null);
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all uppercase cursor-pointer ${
                metricType === 'intensity'
                  ? 'bg-cohere-primary text-white shadow-xs'
                  : 'text-cohere-slate hover:text-cohere-primary'
              }`}
            >
              1RM
            </button>
          </div>
        </div>
      </div>

      {/* SVG Plot and insights */}
      <>
        <div className="relative w-full overflow-visible">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none overflow-visible cursor-crosshair touch-pan-y"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouch}
            onTouchMove={handleTouch}
          >
            <defs>
              <linearGradient id="cohereAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1863dc" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#1863dc" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="cohereLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1863dc" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#4c6ee6" stopOpacity="1" />
                <stop offset="100%" stopColor="#1863dc" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Grid lines (Horizontal) + Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingTop + ratio * plotHeight;
              const gridVal = dataMax - ratio * (dataMax - dataMin);
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="rgba(23, 23, 28, 0.04)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 12}
                    y={y + 4}
                    fill="rgb(147, 147, 159)"
                    fontSize="10"
                    fontFamily="JetBrains Mono"
                    textAnchor="end"
                  >
                    {Math.round(gridVal)} kg
                  </text>
                </g>
              );
            })}

            {/* X-axis labels: fecha de cada sesión (subconjunto para no amontonar) */}
            {points.map((p) =>
              shouldLabelIndex(p.index) ? (
                <text
                  key={`xlabel-${p.index}`}
                  x={p.x}
                  y={paddingTop + plotHeight + 20}
                  fill="rgb(147, 147, 159)"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                >
                  {formatDateShort(p.log.date)}
                </text>
              ) : null
            )}

            {/* Área bajo la curva (una sola, continua) */}
            {areaPath && (
              <path d={areaPath} fill="url(#cohereAreaGradient)" className="transition-all duration-500" />
            )}

            {/* Línea principal (una sola, continua) */}
            <path
              d={linePath}
              fill="none"
              stroke="url(#cohereLineGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500"
            />

            {/* Puntos */}
            {points.map((pt) => (
              <circle
                key={`dot-${pt.index}`}
                cx={pt.x}
                cy={pt.y}
                r="3.5"
                fill="#1863dc"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            ))}

            {/* Línea base punteada (solo tiene sentido en modo 1RM) */}
            {metricType === 'intensity' && dataMax > dataMin && (
              <line
                x1={paddingLeft}
                y1={paddingTop + plotHeight - ((exercise.baseline1RM - dataMin) / (dataMax - dataMin)) * plotHeight}
                x2={width - paddingRight}
                y2={paddingTop + plotHeight - ((exercise.baseline1RM - dataMin) / (dataMax - dataMin)) * plotHeight}
                stroke="rgba(24, 99, 220, 0.15)"
                strokeDasharray="2 4"
                strokeWidth="1.5"
              />
            )}

            {/* Indicador de hover */}
            {hoveredPoint && (
              <g>
                <line
                  x1={hoveredPoint.x}
                  y1={paddingTop}
                  x2={hoveredPoint.x}
                  y2={paddingTop + plotHeight}
                  stroke="rgba(24, 99, 220, 0.25)"
                  strokeWidth="1.5"
                />
                <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="8" fill="rgba(24, 99, 220, 0.2)" className="animate-ping" />
                <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="#FFFFFF" stroke="#1863dc" strokeWidth="2.5" />
              </g>
            )}
          </svg>

          {/* Tooltip */}
          <AnimatePresence>
            {hoveredPoint && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute pointer-events-none bg-cohere-primary border border-cohere-slate/40 rounded-xl p-3 shadow-2xl z-30 w-[230px]"
                style={{
                  left: `${tooltipPos.x}px`,
                  top: `${tooltipPos.y}px`,
                  transform: 'translateY(-100%)',
                }}
              >
                <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-cohere-coral uppercase tracking-wider mb-1">
                  <Calendar className="w-3 h-3" />
                  {formatDateShort(hoveredPoint.log.date)}
                </div>
                <div className="text-white">
                  <div className="text-xs font-sans text-cohere-muted">
                    {metricType === 'tonnage' ? 'Volumen Total:' : '1RM estimado:'}
                  </div>
                  <div className="text-base font-mono font-bold text-white flex items-baseline gap-1 mt-0.5">
                    {hoveredPoint.val.toLocaleString()}
                    <span className="text-xs font-mono font-normal text-cohere-stone">kg</span>
                  </div>
                </div>

                <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-cohere-stone/80 font-mono flex justify-between">
                  <span>{metricType === 'tonnage' ? 'Serie Top:' : 'Estimado de:'}</span>
                  <span className="text-white">
                    {metricType === 'tonnage'
                      ? `${hoveredPoint.log.sets}x${hoveredPoint.log.reps} @ ${hoveredPoint.log.weight} kg`
                      : `${hoveredPoint.log.weight} kg × ${hoveredPoint.log.reps}`}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Summary footer */}
        <div className="mt-5 pt-4 border-t border-cohere-hairline flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs text-cohere-body-muted">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cohere-blue" />
            <span>
              {metricType === 'tonnage'
                ? `El tonelaje máximo registrado fue de `
                : `Tu mejor 1RM estimado fue de `}
              <strong className="text-cohere-primary font-mono font-semibold">{maxVal} kg</strong>
              {maxPoint ? ` el ${formatDateShort(maxPoint.log.date)}` : ''}.
            </span>
          </div>
          <div className="text-[10px] font-mono text-cohere-muted uppercase tracking-wider">
            {metricType === 'tonnage'
              ? 'Fórmula de volumen: peso × repeticiones × series'
              : '1RM estimado · Epley: peso × (1 + reps / 30)'}
          </div>
        </div>
      </>
    </div>
  );
}
