# AGENTS.md — NextPR

Control central para cualquier agente (Claude Code u otro) que trabaje en este repo.
Léelo primero, siempre. Contiene lo mínimo necesario para operar sin releer todo el código.

> **Ubicación:** este sistema de memoria vive en `context/`. Las rutas a otros archivos de memoria (`state/`, `decisions/`, `skills/`, `gotchas/`, `logs/`) son relativas a `context/`. Las rutas a código (`server.ts`, `src/App.tsx`, etc.) son relativas a la **raíz del repo** (`context/..`).

## 1. Identidad y propósito

**NextPR** — "Strength Intelligence". App MVP para levantadores de fuerza que:
- Trackea 1RM (una repetición máxima) por ejercicio, agrupado en 3 patrones de movimiento: **empuje, jalón, pierna**.
- Detecta estancamientos (≥4 semanas sin subir peso) y da recomendaciones de carga.
- Sincroniza entrenamientos reales desde **Hevy** (app de gym) vía su Developer API.
- Tiene un coach conversacional en español potenciado por **Gemini** (`gemini-2.5-flash`), con fallback a respuestas simuladas basadas en reglas cuando no hay API key.

Generado originalmente en Google AI Studio (ver `README.md`). Stack: React 19 + Vite 6 + Express + TypeScript + Tailwind 4 + Framer Motion (`motion`). Un solo proceso Express sirve Vite en modo middleware (dev) o estáticos de `dist/` (prod).

No es un repositorio git (`git init` no se ha corrido). No hay tests ni CI.

## 2. Reglas duras e invariantes

- **Auth es falsa a propósito.** `LoginScreen.tsx` acepta cualquier email/password. No la trates como seguridad real ni la "arregles" sin que te lo pidan — ver `gotchas/fake-auth.md`.
- **Todo el estado del usuario vive en `localStorage` del navegador** (`nextpr_exercises`, `nextpr_session`, `nextpr_hevy_api_key`). No hay base de datos ni backend de usuarios.
- **No modificar el bloque HMR de `vite.config.ts`** sin entender `gotchas/vite-hmr-aistudio.md` — existe para el entorno de AI Studio.
- **La API de Hevy usa `pageSize`, no `limit`.** Límites reales: `exercise_templates` máx 100/página, `workouts` máx 10/página. Ver `gotchas/hevy-api-pagination.md` antes de tocar `server.ts`.
- **Dos fórmulas de 1RM coexisten** (`src/lib/projections.ts` vs `server.ts`). Son casi iguales pero no idénticas — no asumas que son la misma función. Ver `gotchas/1rm-formula-inconsistency.md`.
- **El resumen que se manda a Gemini está acotado a ~6 semanas** (`buildTrainingSummary`, `SUMMARY_WINDOW_DAYS = 42`), nunca el historial crudo completo. Si agregas contexto al prompt del coach, respeta este patrón de ventana acotada — es una decisión de costo/token, no un descuido.
- **No hay `.env`** en el repo, solo `.env.example`. Sin `GEMINI_API_KEY` el chat cae a `getMockCoachReply` (comportamiento esperado, no un bug). Sin `HEVY_API_KEY` de servidor Y sin key personal en localStorage, `/api/sync-hevy` responde `api_key_missing`.

## 3. Orden de lectura preferido

Para cualquier tarea, en este orden y **solo lo que aplique**:

1. `state/current.md` — qué está hecho, pendiente, y bloqueado ahora mismo.
2. `decisions/*.md` relevante al área que vas a tocar (no leas los tres si solo te importa uno).
3. `gotchas/*.md` relevante al archivo que vas a editar.
4. El archivo de código específico (`server.ts`, `src/App.tsx`, etc.) — nunca el repo completo.
5. `skills/*.md` si la tarea es un procedimiento ya resuelto antes (levantar el server, agregar una integración, debuggear sync).

No cargues `logs/` salvo que te pidan reconstruir el historial de una sesión pasada — son resúmenes de archivo, no lectura por defecto.

## 4. Routing de skills

| Tarea pedida | Usar |
|---|---|
| "Levanta / corre el proyecto en local" | `skills/run-dev-server.md` |
| "Agrega integración con [Strava/Garmin/etc]" | `skills/add-new-integration.md` |
| "El sync de Hevy no trae datos / trae mal" | `skills/debug-hevy-sync.md` |
| Cambio de diseño/UI (colores, layout, componentes) | Lee `decisions/design.md` primero — hay un sistema de color (`cohere-*` en Tailwind) ya establecido, no improvises paleta nueva. |
| Cambio de lógica de negocio (selección de ejercicio principal, 1RM, estancamiento) | Lee `decisions/producto.md` primero — hay reglas de negocio explícitas y con razonamiento, no las reinventes. |
| Cambio de arquitectura/build/deploy | Lee `decisions/arquitectura.md` primero. |

## 5. Definition of Done

Una tarea está terminada cuando:
- El código compila: `npm run lint` (solo `tsc --noEmit`, no hay ESLint) pasa sin errores nuevos.
- Si tocaste UI: la viste corriendo en `http://localhost:3000` (via `npm run dev`), no solo leíste el JSX.
- Si tocaste lógica de negocio con decisión de diseño no trivial (fórmulas, umbrales, criterios de selección): se registró en `decisions/` con fecha y razonamiento.
- Si descubriste un comportamiento sorprendente de una API externa o del entorno (AI Studio, Hevy, Gemini): se registró en `gotchas/`.
- `state/current.md` refleja el nuevo estado (qué pasó de pendiente a hecho, qué bloqueador nuevo apareció).
- No quedaron `console.log` de debug nuevos sin marcar (si son temporales, usar el prefijo `TEMP DEBUG` ya usado en `server.ts` para que sean grep-eables y limpiables).

## 6. Cómo comportarse con el contexto (reglas de oro)

- **El context window es caro y volátil. La memoria real vive en estos archivos, no en tu cabeza de sesión.** Si algo importa para el futuro, se escribe aquí — no confíes en que la próxima sesión "recuerde" la conversación.
- **Nunca cargues todo el historial ni todos los archivos del proyecto de entrada.** Carga solo lo que la tarea actual necesita (sección 3).
- **Prefiere referenciar archivos por ruta antes que copiar contenido largo al prompt.** Ej: decir "ver `server.ts:249-296` para la paginación de Hevy" en vez de pegar el bloque completo en una decisión o log.
- **Al final de cada sesión que produzca cambios reales**: actualiza `state/current.md`, registra cualquier decisión de diseño/producto/arquitectura nueva en `decisions/`, y si la sesión fue larga o importante, agrega un resumen comprimido (no la transcripción) en `logs/` con fecha `YYYY-MM-DD-tema.md`.
- **Procedimientos que se repiten se convierten en skills.** Si haces algo por segunda vez de la misma forma, escríbelo en `skills/`.
- **Este archivo se mantiene corto (≤300 líneas).** Si crece, mueve detalle a la carpeta correspondiente y deja aquí solo el puntero.

## 7. Punteros a las carpetas de memoria

- `decisions/` — decisiones de diseño, producto y arquitectura, con fecha y razonamiento. Archivos: `design.md`, `producto.md`, `arquitectura.md`.
- `state/` — estado actual del proyecto. Archivo: `current.md`.
- `skills/` — procedimientos reutilizables paso a paso.
- `gotchas/` — problemas conocidos del código/APIs externas y su solución o mitigación.
- `logs/` — resúmenes comprimidos de sesiones importantes (no transcripciones).
