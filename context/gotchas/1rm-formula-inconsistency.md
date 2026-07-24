# Gotcha: dos fórmulas de 1RM distintas (cliente vs servidor)

Hay **dos** implementaciones del 1RM estimado de Epley y NO son idénticas:

- **Servidor** (`server.ts`, dentro de `/api/sync-hevy`):
  `est1RM = reps === 1 ? weight : round(weight * (1 + 0.0333 * reps) * 10) / 10`
  Usa el coeficiente **0.0333** (≈ 1/30) y redondea a 1 decimal.

- **Cliente** (`src/lib/projections.ts`, `calculateEst1RM`):
  `reps === 1 ? round(weight) : round(weight * (1 + reps / 30))`
  Usa **reps/30** exacto y redondea a entero.

**Consecuencia:** para los mismos `weight`/`reps` pueden diferir por décimas o por el redondeo (entero vs 1 decimal). Hoy la diferencia es cosmética y nadie compara ambos valores en el mismo lugar, pero:
- El `current1RM` que guarda el servidor tras un sync ≠ el `latest1RM` que recalcula `analyzeExerciseTrend` en el cliente sobre los mismos logs.

**Al tocar cálculo de 1RM:** decide una sola fórmula y unifícala, o al menos no asumas que ambos valores coinciden exactamente. Ver decisión en `decisions/producto.md` (Epley es la fórmula elegida).
