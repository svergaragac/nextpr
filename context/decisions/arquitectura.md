# Decisiones de arquitectura

## 2026-07-21 — Un solo proceso Express sirviendo Vite (dev) o estáticos (prod)
`server.ts` es el único entrypoint. En dev (`NODE_ENV !== "production"`) monta Vite en `middlewareMode: true`. En prod sirve `dist/` estático y hace fallback SPA a `index.html`.
**Por qué:** simplicidad de despliegue — un solo proceso Node, sin servidor separado para frontend/backend. Encaja con el modelo de deploy de AI Studio / Cloud Run (ver `README.md`, `APP_URL` en `.env.example`).
**Cómo aplicar:** cualquier nuevo endpoint de API va en este mismo `server.ts` con prefijo `/api/*`, antes de `startServer()`. No introducir un segundo servidor.

## 2026-07-21 — Build: Vite para el cliente, esbuild para el servidor
`npm run build` = `vite build` (cliente) + `esbuild server.ts --bundle --platform=node --format=cjs --packages=external ... --outfile=dist/server.cjs`. `npm start` corre `node dist/server.cjs`.
**Por qué:** esbuild bundlea rápido el servidor TS a CJS sin necesitar `ts-node`/`tsx` en producción; `--packages=external` evita empaquetar `node_modules` (se asume `npm install` corrido en el entorno de deploy).
**Cómo aplicar:** si se agregan dependencias nativas de Node al servidor, verificar que sigan siendo `external` correctamente. No cambiar el formato de salida (`cjs`) sin revisar cómo se invoca `dist/server.cjs`.

## 2026-07-21 — HMR condicionado por `DISABLE_HMR` (específico de AI Studio)
`vite.config.ts` desactiva HMR y file-watching cuando `process.env.DISABLE_HMR === 'true'`.
**Por qué:** comentario explícito en el archivo: evita parpadeo/flickering cuando un agente de IA (AI Studio) edita archivos en vivo. No es una necesidad de este proyecto en sí, es un contrato con el entorno de AI Studio.
**Cómo aplicar:** no eliminar esta lógica al "limpiar" `vite.config.ts`. Ver `gotchas/vite-hmr-aistudio.md`.

## 2026-07-21 — Persistencia 100% client-side (localStorage)
No hay base de datos. `src/data.ts` (`saveExercisesToStorage`/`loadExercisesFromStorage`), `src/lib/session.ts` y `src/lib/hevyAuth.ts` son los únicos puntos de persistencia, todos sobre `localStorage`.
**Por qué:** MVP de un solo usuario por navegador, sin necesidad de cuentas reales ni sincronización multi-dispositivo todavía.
**Cómo aplicar:** cualquier feature que asuma persistencia server-side (multi-dispositivo, compartir progreso) requiere agregar una capa de DB — no existe hoy. `/api/sync-hevy` es stateless: recalcula todo desde la API de Hevy en cada llamada, no cachea en servidor.

## 2026-07-22 — Migración automática de datos mock desincronizados en localStorage
`loadExercisesFromStorage` detecta si el set guardado no incluye `bicep_curl` (el ejercicio mock más reciente agregado) y si no lo tiene, sobreescribe con `INITIAL_EXERCISES` actual.
**Por qué:** evitar que usuarios con localStorage viejo (de una versión anterior de los mocks) queden con datos de ejemplo incompletos/desactualizados sin darse cuenta.
**Cómo aplicar:** este es un patrón frágil (detecta por presencia de un ID hardcodeado) — si se agregan más ejercicios mock en el futuro, considerar versionar el localStorage con un campo `_version` en vez de seguir agregando checks de ID.
