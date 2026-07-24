# Skill: debuggear el sync de Hevy

Endpoint: `GET /api/sync-hevy` en `server.ts`. Flujo: paginar workouts → juntar template IDs únicos → traer catálogo de templates (+ faltantes individuales) → parsear logs → seleccionar principales por patrón → mapear al shape `Exercise`.

## Checklist por síntoma

**"No hay ninguna API Key de Hevy configurada" (`api_key_missing`)**
- No hay `HEVY_API_KEY` en `.env` NI key personal. La key personal viaja en el header `x-hevy-api-key` (se guarda en localStorage vía `hevyAuth.ts`). Verificar que el front la esté mandando (`App.tsx` → `handleSyncData`).

**"No se encontraron entrenamientos" (`empty: true`)**
- La cuenta no tiene workouts, o todos los sets tienen `weight <= 0`. El sync **solo incluye ejercicios con peso > 0** (excluye peso corporal sin lastre). Es esperado para rutinas solo de cardio/calistenia sin lastre.

**Ejercicios que no aparecen como "principal"**
- Requisito: ≥2 sesiones totales y tener un `pattern` (empuje/jalón/pierna) asignado. El pattern viene de `getMovementPattern(muscle)` que mapea el `primary_muscle_group` del template. Músculos abs/core/cardio → `null` → nunca son principales.
- Si el músculo no matchea ninguna rama de `getMovementPattern`, el ejercicio queda sin pattern y solo aparece como secundario.

**Datos de peso/1RM raros**
- Hay logs `TEMP DEBUG` en `server.ts` (~línea 367 y ~557) que imprimen los sets crudos de ejercicios con "press" en el nombre y el 1RM calculado. Úsalos para inspeccionar; la API de Hevy manda el peso en `weight_kg` (fallback `weight`).
- Ver `gotchas/1rm-formula-inconsistency.md`: el 1RM del servidor y el del cliente no son idénticos.

**Paginación incompleta**
- Ver `gotchas/hevy-api-pagination.md`. `pageSize` (no `limit`), workouts máx 10/página, tope 300 páginas.

## Cómo observar
Los `console.log` del sync (`[NextPR Server] Fetching Hevy workouts page N...`, total de workouts, templates faltantes) salen en la terminal donde corre `npm run dev`.
