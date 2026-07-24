# Decisiones de producto / lógica de negocio

## 2026-07-21 — Auth falsa para el MVP
`LoginScreen.tsx` acepta cualquier email/contraseña no vacíos; solo guarda el email en `localStorage` (`nextpr_session`).
**Por qué:** el foco del MVP es la lógica de progreso/proyección y la integración con Hevy, no un sistema de usuarios. Está declarado explícitamente en la UI: "Modo MVP: cualquier correo y contraseña son válidos".
**Cómo aplicar:** no construir features que asuman identidad real de usuario (multi-usuario, permisos) sin antes reemplazar este mecanismo.

## 2026-07-21 — Selección automática de "ejercicio principal" por patrón
Para cada patrón (empuje/jalón/pierna), `server.ts` (`/api/sync-hevy`) elige un ganador entre los candidatos con ≥2 sesiones totales, ordenando por:
1. Más sesiones en los últimos 60 días.
2. Mayor variación de peso máximo en las últimas 4 semanas (proxy de progresión activa).
3. Mayor cantidad total de sesiones histórica.
4. Alfabético por ID (desempate determinístico).
**Por qué:** automatizar qué ejercicio merece ser "el foco" de cada patrón sin pedirle al usuario que lo configure manualmente, priorizando consistencia y progresión reciente sobre historial viejo.
**Cómo aplicar:** si se cambia el criterio (ej. dar más peso al 1RM absoluto), documentar el nuevo orden acá. La función vive en `server.ts` dentro de `/api/sync-hevy`, buscar `candidates.sort`.

## 2026-07-21 — Ventana de 6 semanas para el contexto del coach IA
`buildTrainingSummary` (`src/lib/coachSummary.ts`) solo manda a Gemini un resumen de las últimas 42 días (`SUMMARY_WINDOW_DAYS`), no el historial crudo completo.
**Por qué:** control de costo/tokens y evitar que el modelo "invente" con demasiado ruido histórico. El prompt del coach (`COACH_SYSTEM_PROMPT` en `server.ts`) explícitamente prohíbe inventar datos fuera del contexto entregado.
**Cómo aplicar:** si el coach necesita más contexto histórico (ej. comparar trimestres), no ampliar la ventana global — agregar una sección nueva y acotada al resumen (como ya se hace con "RÉCORDS RECIENTES" y "VOLUMEN POR GRUPO MUSCULAR"), manteniendo el patrón de resumen comprimido en vez de datos crudos.

## 2026-07-21 — Estancamiento se define como ≥4 semanas sin subir peso
`getStagnationWeeks` (`src/data.ts`) calcula semanas desde `lastImprovementDate` hasta el log más reciente; `isStagnant` es `weeks >= 4`.
**Por qué:** umbral elegido para dar tiempo a fluctuaciones normales de entrenamiento sin marcar estancamiento prematuro, pero seguir siendo accionable (no esperar 8+ semanas).
**Cómo aplicar:** el mismo criterio se usa en 3 lugares (`data.ts`, `projections.ts` vía `analyzeExerciseTrend`, `mockCoachReplies.ts`). Si se cambia el umbral, cambiarlo en `getStagnationWeeks` es suficiente — los otros dos lo consumen.

## 2026-07-21 — 1RM estimado con fórmula de Epley (con dos implementaciones distintas)
`current1RM`/`baseline1RM` se calculan con Epley (`weight * (1 + reps/30)`), no con fórmulas alternativas (Brzycki, etc).
**Por qué:** Epley es la fórmula estándar más simple y suficientemente precisa para el rango de reps típico (2-10) del producto.
**Cómo aplicar:** ver `gotchas/1rm-formula-inconsistency.md` — hay dos implementaciones ligeramente distintas (cliente vs servidor) que deberían unificarse eventualmente, pero producen resultados casi idénticos hoy.

## 2026-07-21 — Integraciones no-Hevy son solo UI ("Próximamente")
`IntegrationsModal.tsx` lista Strava, Garmin, Apple Health, Whoop, Oura, MyFitnessPal con `functional: false` — son visuales, no clickeables, sin backend.
**Por qué:** comunicar la visión del producto (ecosistema de integraciones) sin comprometerse a construirlas todas para el MVP.
**Cómo aplicar:** al implementar una integración real, seguir `skills/add-new-integration.md` y cambiar `functional: true` solo cuando el endpoint backend correspondiente exista.
