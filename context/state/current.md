# Estado actual — NextPR

_Última actualización: 2026-07-23_

## Hecho
- **Restyle al design language Cohere 2026** (2026-07-23): fuente display (Space Grotesk), mono a Space Mono, product-cards de piedra para principales, research-table para secundarios, banda verde firma para el drawer, CTAs pill. Detalle y invariantes en `decisions/design.md`. `tsc` OK; falta confirmación visual a ojo. Logo SVG original conservado.
- Dashboard funcional con 3 estados: vacío / cargando (skeletons) / con datos.
- Selección automática de ejercicio principal por patrón (empuje/jalón/pierna) en `/api/sync-hevy`.
- Integración real con Hevy Developer API: validación de key (`/api/hevy/validate`) + sync completo con paginación (`/api/sync-hevy`).
- Coach IA con Gemini (`gemini-2.5-flash`) vía `/api/chat`, con resumen acotado a 6 semanas.
- Fallback de coach en modo simulado (`getMockCoachReply`) por reglas cuando no hay `GEMINI_API_KEY`.
- Proyecciones de 1RM a 2 meses con tendencia (lineal/desacelerando/estancado/irregular), confianza y recomendaciones (`src/lib/projections.ts`).
- Persistencia local completa (ejercicios, sesión, key de Hevy) en localStorage.
- Detección de estancamiento (≥4 semanas).
- Modal de integraciones con Hevy funcional + 6 integraciones "Próximamente" (solo UI).
- Datos mock coherentes de 12 semanas para 7 ejercicios (`src/data.ts`).
- Auto-sync en background al montar la app.

## Pendiente / ideas no implementadas
- Integraciones reales distintas a Hevy (Strava, Garmin, etc.) — hoy solo UI.
- Auth real (hoy es falsa por diseño, ver `decisions/producto.md`).
- Persistencia server-side / multi-dispositivo (hoy todo es localStorage).
- Tests (no existe ninguno) y CI.
- Unificar las dos fórmulas de 1RM (cliente vs servidor) — ver gotcha.
- El repo no está bajo git (`git init` no corrido).

## Blockers / cosas que requieren input externo
- Para probar sync real de Hevy se necesita una **HEVY_API_KEY** válida (del usuario, desde hevy.com/settings?developer). Sin ella solo se puede usar el set mock.
- Para el coach IA real se necesita **GEMINI_API_KEY** en un `.env` local (no existe en el repo).

## Cómo levantarlo (resumen — detalle en skills/run-dev-server.md)
`npm run dev` → http://localhost:3000. `node_modules` ya instalado. Sin `.env`, el chat cae a modo simulado y el sync pide conectar Hevy.

## Deuda técnica conocida
- `console.log` con prefijo `TEMP DEBUG` en `server.ts` (líneas ~367 y ~557) — logs de debug de pesos/1RM que deberían removerse antes de prod.
- Migración de localStorage frágil por ID hardcodeado (`bicep_curl`) — ver `decisions/arquitectura.md`.
