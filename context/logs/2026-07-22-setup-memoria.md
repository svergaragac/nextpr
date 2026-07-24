# 2026-07-22 — Setup del sistema de memoria persistente

## Qué se hizo
- Se levantó el proyecto en local (`npm run dev`, OK en :3000, HTTP 200 confirmado).
- Se leyó todo el código fuente (server.ts, src/**) para mapear arquitectura, decisiones y gotchas.
- Se creó la estructura de memoria: `AGENTS.md` + `decisions/` + `state/` + `skills/` + `gotchas/` + `logs/`.

## Hallazgos clave (extraídos del código, no había git ni docs previos)
- No es repo git, sin tests, sin CI, sin `.env` (solo `.env.example`).
- Arquitectura: 1 proceso Express sirve Vite (dev) o `dist/` (prod). Todo persiste en localStorage.
- Auth falsa por diseño (MVP).
- Hevy API: `pageSize` no `limit`; workouts máx 10/página.
- Dos fórmulas de 1RM (cliente reps/30 entero vs servidor 0.0333 con 1 decimal) — inconsistencia cosmética.
- Coach IA con ventana acotada de 6 semanas + fallback simulado sin Gemini key.
- HMR condicionado por `DISABLE_HMR` (contrato con AI Studio).

## Deuda registrada
- Logs `TEMP DEBUG` en server.ts pendientes de limpiar.
- Migración localStorage frágil por ID hardcodeado.
- Unificar fórmulas de 1RM.

## Estado del server
Se dejó `npm run dev` corriendo en background (log en scratchpad). Si en una sesión futura el puerto 3000 está ocupado, es probablemente este proceso.
