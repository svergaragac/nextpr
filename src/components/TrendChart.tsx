import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, TrendingUp, Info } from 'lucide-react';
import { Exercise, LiftLog } from '../types';
import { calculateEst1RM } from '../lib/projections';

// Ventana de historial mostrada en el gráfico: últimos 3 meses de progresión.
const HISTORY_WINDOW_DAYS = 90;

interface TrendChartProps {
  exercise: Exercise;
}

export function TrendChart({ exercise }: TrendChartProps) {
  const [metricType, setMetricType] = useState<'tonnage' | 'intensity'>('tonnage');
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Full sorted history from Hevy
  const allSortedLogs = [...exercise.logs].sort((a, b) => a.week - b.week);
  const totalLogsLength = allSortedLogs.length;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const MS_PER_WEEK = 7 * MS_PER_DAY;
  const nowMs = Date.now();

  // Ventana fija: siempre los últimos 3 meses terminando hoy, sin importar cuándo
  // se registró la primera o última sesión de este ejercicio en particular. Así
  // todos los gráficos comparten el mismo eje de tiempo.
  const fixedWindowStartMs = nowMs - HISTORY_WINDOW_DAYS * MS_PER_DAY;

  // Filter logs to last 3 months
  let logs = allSortedLogs.filter(log => new Date(log.date).getTime() >= fixedWindowStartMs);

  // If the 3-month filter leaves us with less than 3 logs, but we have more historically,
  // take at least the last 3 logs so we can draw a beautiful chart!
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

  // El inicio de la ventana es siempre "hoy - 90 días". Si el fallback de arriba
  // tuvo que ir más atrás para juntar 3 puntos, extendemos el inicio para no
  // dejar semanas con weekSlot negativo.
  const windowStartMs = Math.min(fixedWindowStartMs, new Date(logs[0].date).getTime());
  const weekSlotFor = (dateStr: string) => Math.floor((new Date(dateStr).getTime() - windowStartMs) / MS_PER_WEEK) + 1;
  const totalWindowWeeks = Math.max(1, weekSlotFor(new Date(nowMs).toISOString()));

  // Create clear notice of the history shown — refleja semanas reales con datos vs. semanas totales de la ventana
  const weeksWithData = N;
  const weeksStr = weeksWithData === 1 ? '1 semana' : `${weeksWithData} semanas`;
  const noticeText = weeksWithData === totalWindowWeeks
    ? `Mostrando tus ${weeksStr} de historial disponible`
    : `${weeksStr} con datos de ${totalWindowWeeks} semanas recientes`;

  // Resolviendo valores de las métricas
  const getMetricValue = (log: LiftLog) => {
    return metricType === 'tonnage' ? log.volume : calculateEst1RM(log.weight, log.reps);
  };

  const values = N >= 3 ? logs.map(getMetricValue) : [];
  const maxVal = values.length > 0 ? Math.max(...values) : 0;
  const minVal = values.length > 0 ? Math.min(...values) : 0;

  // Calcular límites de escala con margen para que el gráfico respire
  const valueDelta = maxVal - minVal;
  const dataMin = values.length > 0 ? Math.max(0, minVal - (valueDelta > 0 ? valueDelta * 0.15 : minVal * 0.1)) : 0;
  const dataMax = values.length > 0 ? maxVal + (valueDelta > 0 ? valueDelta * 0.15 : maxVal * 0.1) : 100;

  // Dimensiones del SVG
  const width = 800;
  const height = 280;
  const paddingLeft = 70;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 40;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const xForSlot = (slot: number) => paddingLeft + ((slot - 1) / Math.max(1, totalWindowWeeks - 1)) * plotWidth;

  // Mapear logs a coordenadas de pantalla, posicionadas según la semana real que
  // representan dentro de la ventana visible (no de forma secuencial 1,2,3...).
  const points = N >= 3 ? logs.map((log, index) => {
    const val = getMetricValue(log);
    const slot = weekSlotFor(log.date);
    const x = xForSlot(slot);
    const denominator = dataMax - dataMin;
    const y = denominator > 0
      ? paddingTop + plotHeight - ((val - dataMin) / denominator) * plotHeight
      : paddingTop + plotHeight / 2;
    return { x, y, val, log, index, slot };
  }) : [];

  // Semanas dentro de la ventana que no tienen ningún dato — se muestran como
  // marcas mudas en la base, hoverables, para dejar explícito que esa semana
  // existe pero no hubo entrenamiento (en vez de fingir un valor en 0).
  const allSlots = Array.from({ length: totalWindowWeeks }, (_, i) => i + 1);
  const emptySlots = allSlots.filter((slot) => !points.some((p) => p.slot === slot));

  // Agrupar en segmentos consecutivos: solo se conectan con una línea los puntos
  // de semanas consecutivas. Si hay una semana sin datos en el medio, se corta
  // el segmento en vez de dibujar una línea que implique continuidad falsa.
  const segments: (typeof points)[] = [];
  points.forEach((pt) => {
    const lastSegment = segments[segments.length - 1];
    const lastPoint = lastSegment ? lastSegment[lastSegment.length - 1] : null;
    if (lastSegment && lastPoint && pt.slot - lastPoint.slot === 1) {
      lastSegment.push(pt);
    } else {
      segments.push([pt]);
    }
  });

  // Construir un path de línea y de área por cada segmento contiguo
  const linePaths = segments.map((segment) => {
    let d = `M ${segment[0].x} ${segment[0].y}`;
    for (let i = 1; i < segment.length; i++) {
      d += ` L ${segment[i].x} ${segment[i].y}`;
    }
    return d;
  });

  const areaPaths = segments
    .filter((segment) => segment.length > 1)
    .map((segment) => {
      let d = `M ${segment[0].x} ${segment[0].y}`;
      for (let i = 1; i < segment.length; i++) {
        d += ` L ${segment[i].x} ${segment[i].y}`;
      }
      d += ` L ${segment[segment.length - 1].x} ${paddingTop + plotHeight} L ${segment[0].x} ${paddingTop + plotHeight} Z`;
      return d;
    });

  // Manejar movimiento de mouse para el tooltip e indicador vertical.
  // Busca la semana más cercana entre TODAS las de la ventana (con o sin datos),
  // para que las semanas vacías también respondan al hover.
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current || allSlots.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;

    // Convertir coordenada X relativa de la pantalla al viewBox (0-800)
    const svgX = (clientX / rect.width) * width;

    // Encontrar la semana más cercana basada en la distancia horizontal
    let closestSlot = allSlots[0];
    let minDistance = Math.abs(svgX - xForSlot(allSlots[0]));

    allSlots.forEach((slot) => {
      const dist = Math.abs(svgX - xForSlot(slot));
      if (dist < minDistance) {
        minDistance = dist;
        closestSlot = slot;
      }
    });

    setHoveredSlot(closestSlot);

    // Calcular posición del tooltip en relación al contenedor div del DOM
    const scaleX = rect.width / width;
    const scaleY = rect.height / height;
    const matchedPoint = points.find((p) => p.slot === closestSlot);
    const tooltipY = matchedPoint ? matchedPoint.y : paddingTop + plotHeight / 2;

    setTooltipPos({
      x: xForSlot(closestSlot) * scaleX,
      y: tooltipY * scaleY - 15
    });
  };

  const handleMouseLeave = () => {
    setHoveredSlot(null);
  };

  const hoveredPoint = hoveredSlot !== null ? points.find((p) => p.slot === hoveredSlot) ?? null : null;
  const isHoveredEmpty = hoveredSlot !== null && !hoveredPoint;
  const hoveredAnchor = hoveredSlot === 1 ? 'left' : hoveredSlot === totalWindowWeeks ? 'right' : 'center';

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

        {/* Filters and Metric Selector Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Metric Selector Toggles */}
          <div className="flex bg-cohere-stone border border-cohere-hairline rounded-full p-0.5">
            <button
              onClick={() => {
                setMetricType('tonnage');
                setHoveredSlot(null);
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
                setHoveredSlot(null);
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

      {/* Render SVG Plot and insights directly */}
      <>
          {/* SVG Plot */}
          <div className="relative w-full overflow-visible">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto select-none overflow-visible cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* Definitions for Gradients */}
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

              {/* Grid lines (Horizontal) */}
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
                    {/* Left Y-axis labels */}
                    <text
                      x={paddingLeft - 12}
                      y={y + 4}
                      fill="rgb(147, 147, 159)"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                      textAnchor="end"
                    >
                      {Math.round(gridVal)}
                      {metricType === 'tonnage' ? ' kg' : ' kg'}
                    </text>
                  </g>
                );
              })}

              {/* Vertical axis indicators: una marca por cada semana real de la ventana,
                  tenga o no datos, para que los huecos se vean como huecos */}
              {Array.from({ length: totalWindowWeeks }, (_, i) => i + 1).map((slot) => {
                const labelEvery = totalWindowWeeks <= 9 ? 1 : Math.ceil(totalWindowWeeks / 9);
                const shouldLabel = slot === 1 || slot === totalWindowWeeks || (slot - 1) % labelEvery === 0;
                if (!shouldLabel) return null;
                const x = paddingLeft + ((slot - 1) / Math.max(1, totalWindowWeeks - 1)) * plotWidth;
                return (
                  <text
                    key={slot}
                    x={x}
                    y={paddingTop + plotHeight + 20}
                    fill="rgb(147, 147, 159)"
                    fontSize="10"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    SEM {slot}
                  </text>
                );
              })}

              {/* Render Area Filled Path (un tramo por cada segmento contiguo, cortado en los huecos) */}
              {areaPaths.map((d, i) => (
                <path
                  key={`area-${i}`}
                  d={d}
                  fill="url(#cohereAreaGradient)"
                  className="transition-all duration-500"
                />
              ))}

              {/* Render Main Curve Path (un tramo por cada segmento contiguo, cortado en los huecos) */}
              {linePaths.map((d, i) => (
                <path
                  key={`line-${i}`}
                  d={d}
                  fill="none"
                  stroke="url(#cohereLineGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              ))}

              {/* Puntos permanentes: aseguran que un punto aislado tras un hueco siga siendo visible */}
              {points.map((pt) => (
                <circle
                  key={`dot-${pt.slot}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#1863dc"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              ))}

              {/* Marcas mudas para semanas sin datos: en la base, para hacer explícito
                  que esa semana existe en la ventana pero no hubo entrenamiento */}
              {emptySlots.map((slot) => (
                <circle
                  key={`empty-${slot}`}
                  cx={xForSlot(slot)}
                  cy={paddingTop + plotHeight}
                  r={hoveredSlot === slot ? 3 : 2}
                  fill={hoveredSlot === slot ? 'rgb(147, 147, 159)' : 'rgba(147, 147, 159, 0.4)'}
                  className="transition-all duration-150"
                />
              ))}

              {/* Horizontal dotted baseline representing starting baseline */}
              {points.length > 0 && (
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

              {/* Hover indicator (Vertical bar and glowing circles) */}
              {hoveredPoint && (
                <g>
                  {/* Vertical hairline bar */}
                  <line
                    x1={hoveredPoint.x}
                    y1={paddingTop}
                    x2={hoveredPoint.x}
                    y2={paddingTop + plotHeight}
                    stroke="rgba(24, 99, 220, 0.25)"
                    strokeWidth="1.5"
                  />
                  {/* Glowing background ring */}
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r="8"
                    fill="rgba(24, 99, 220, 0.2)"
                    className="animate-ping"
                  />
                  {/* Foreground circle */}
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r="5"
                    fill="#FFFFFF"
                    stroke="#1863dc"
                    strokeWidth="2.5"
                  />
                </g>
              )}

              {/* Hover indicator para semanas sin datos: hairline apagada, sin glow ni valor */}
              {isHoveredEmpty && hoveredSlot !== null && (
                <line
                  x1={xForSlot(hoveredSlot)}
                  y1={paddingTop}
                  x2={xForSlot(hoveredSlot)}
                  y2={paddingTop + plotHeight}
                  stroke="rgba(147, 147, 159, 0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}
            </svg>

            {/* Custom Rich DOM Tooltip */}
            <AnimatePresence>
              {hoveredPoint && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute pointer-events-none bg-cohere-primary border border-cohere-slate/40 rounded-xl p-3 shadow-2xl z-30 min-w-[160px]"
                  style={{
                    left: `${tooltipPos.x}px`,
                    top: `${tooltipPos.y}px`,
                    transform: hoveredAnchor === 'left'
                      ? 'translate(0%, -100%)'
                      : hoveredAnchor === 'right'
                        ? 'translate(-100%, -100%)'
                        : 'translate(-50%, -100%)',
                  }}
                >
                  <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-cohere-coral uppercase tracking-wider mb-1">
                    <Calendar className="w-3 h-3" />
                    Semana {hoveredPoint.slot} ({hoveredPoint.log.date})
                  </div>
                  <div className="text-white">
                    <div className="text-xs font-sans text-cohere-muted">
                      {metricType === 'tonnage' ? 'Volumen Total:' : 'Mejor Marca (1RM):'}
                    </div>
                    <div className="text-base font-mono font-bold text-white flex items-baseline gap-1 mt-0.5">
                      {hoveredPoint.val.toLocaleString()}
                      <span className="text-xs font-mono font-normal text-cohere-stone">kg</span>
                    </div>
                  </div>
                  
                  {/* Volume details subtables for tonnage */}
                  {metricType === 'tonnage' && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-cohere-stone/80 font-mono flex justify-between">
                      <span>Serie Top:</span>
                      <span className="text-white">
                        {hoveredPoint.log.sets}x{hoveredPoint.log.reps} @ {hoveredPoint.log.weight} kg
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tooltip liviano para semanas sin datos: distinto del rico, sin valor que mostrar */}
            <AnimatePresence>
              {isHoveredEmpty && hoveredSlot !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute pointer-events-none bg-white border border-cohere-hairline rounded-xl px-3 py-2 shadow-lg z-30 min-w-[170px]"
                  style={{
                    left: `${tooltipPos.x}px`,
                    top: `${tooltipPos.y}px`,
                    transform: hoveredAnchor === 'left'
                      ? 'translate(0%, -100%)'
                      : hoveredAnchor === 'right'
                        ? 'translate(-100%, -100%)'
                        : 'translate(-50%, -100%)',
                  }}
                >
                  <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-cohere-muted uppercase tracking-wider mb-0.5">
                    <Calendar className="w-3 h-3" />
                    Semana {hoveredSlot}
                  </div>
                  <p className="text-xs text-cohere-slate">Sin entrenamientos registrados esa semana.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dynamic Summary Insights Footer */}
          <div className="mt-5 pt-4 border-t border-cohere-hairline flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs text-cohere-body-muted">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cohere-blue" />
              <span>
                {metricType === 'tonnage' 
                  ? `El tonelaje máximo registrado fue de `
                  : `La mejor marca de 1RM registrada fue de `}
                <strong className="text-cohere-primary font-mono font-semibold">{maxVal} kg</strong> en la Semana {points.find((p) => p.val === maxVal)?.slot ?? values.indexOf(maxVal) + 1}.
              </span>
            </div>
            <div className="text-[10px] font-mono text-cohere-muted uppercase tracking-wider">
              Fórmula de volumen: peso × repeticiones × series
            </div>
          </div>
        </>
    </div>
  );
}
