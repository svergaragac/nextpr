# Decisiones de diseño (UI/UX)

## 2026-07-23 — Adopción formal del design language "Cohere 2026"
Se alineó la app al sistema Cohere (doc de referencia del usuario: `31d29279-DESIGNcohere_1.md`). La paleta `cohere-*` en `src/index.css` YA coincidía con los hex del doc; los cambios fueron tipográficos y de componentes.
**Qué cambió:**
- **Fuentes** (`src/index.css`): se agregó `--font-display: "Space Grotesk"` (fallback documentado de CohereText) para headlines/números grandes, y se cambió `--font-mono` de JetBrains Mono a **Space Mono** (CohereMono) para eyebrows/labels. `--font-sans` sigue Inter (Unica77).
- **Números grandes → `font-display`** (MetricCard 52px, ExerciseCard 40px, tabla 20px) con tracking negativo. Antes eran `font-mono`.
- **ExerciseCard** (3 principales): pasó de card blanca a **product-card de piedra** (`bg-cohere-stone`, `rounded-lg`), chip de tendencia con outline coral/verde, 1RM en display. Se eliminó el "confidence dot".
- **OtherExercisesTable**: estilo **research-table** (filas altas `py-5`, números en display, header `border-cohere-ink`, botón "Promover" como pill-outline).
- **Banda verde firma**: la antigua "tips bar" gris es ahora una **`dark-feature-band`** en `cohere-green #003c33` con texto blanco y eyebrow coral-soft (App.tsx, apunta al drawer).
- **CTAs a pill** (`rounded-full`): botón "Sincronizar Hevy".
- **Headings editoriales**: eyebrows en mono slate uppercase + títulos en `font-display` con tracking `-0.02em` (secciones de métricas y principales).
**Invariante nuevo:** los números/estadísticas grandes usan `font-display`; los eyebrows/labels usan `font-mono` (Space Mono) uppercase con `tracking-[0.08em]`; el coral solo en chips/taxonomía, nunca como CTA ni superficie amplia; verde profundo `cohere-green` para bandas oscuras y como color "positivo/PR".
**Verificación:** `npm run lint` (tsc) pasa limpio. Falta screenshot visual (extensión Chrome no respondió en la sesión); pendiente confirmar a ojo en localhost:3000.
**Fallback de fuentes:** CohereText/Unica77/CohereMono son propietarias; se usan Space Grotesk / Inter / Space Mono (los substitutos que el propio doc documenta). Previews de referencia: `preview-cohere.html` (elegido) y `preview-saniti.html` (descartado).


## 2026-07-21 — Sistema de color "cohere-*" en Tailwind
Se usa una paleta custom con prefijo `cohere-` (`cohere-primary`, `cohere-slate`, `cohere-stone`, `cohere-hairline`, `cohere-blue`, `cohere-coral`, `cohere-green`, `cohere-muted`, `cohere-ink`, `cohere-black`) en vez de los colores default de Tailwind.
**Por qué:** consistencia visual tipo dashboard financiero/analítico (bordes finos, tipografía mono para labels, fondo `#f7f8fa` con `dot-grid`).
**Cómo aplicar:** cualquier componente nuevo debe usar estas clases, no `slate-500`/`blue-600` etc. de Tailwind default. Buscar definición de estas clases en la config de Tailwind (`@tailwindcss/vite`, Tailwind 4 usa CSS-first config, revisar `src/index.css`).

## 2026-07-21 — Tipografía mono para metadata, sans para contenido
Labels, timestamps, badges y unidades usan `font-mono` en mayúsculas con `tracking-wider`. Texto de contenido (nombres de ejercicios, mensajes) usa `font-sans`.
**Por qué:** jerarquía visual clara entre "dato/metadata técnica" y "contenido humano", patrón repetido en `App.tsx`, `CoachChatbot.tsx`, `IntegrationsModal.tsx`.
**Cómo aplicar:** seguir el patrón al agregar nuevas métricas o badges.

## 2026-07-21 — Barra superior negra "MODO MVP"
`App.tsx` tiene una barra de simulación (`bg-[#17171c]`) con botones "Restaurar Mocks" y "Limpiar Datos (Estado Vacío)" siempre visible arriba del header real.
**Por qué:** permite forzar los 3 estados de la app (vacío, con datos mock, con datos reales) para QA/demo sin herramientas externas.
**Cómo aplicar:** no eliminar sin reemplazo — es la única forma actual de resetear/probar estados. Si se pasa a producción real, debe quedar detrás de un flag de entorno, hoy no lo está.

## 2026-07-21 — Un solo ejercicio "principal" por patrón de movimiento
La UI solo muestra 3 tarjetas grandes (una por patrón: empuje/jalón/pierna) más una tabla de "secundarios". Ver razonamiento del algoritmo de selección en `decisions/producto.md`.
**Por qué:** fuerza foco — el producto apuesta a que trackear 3 ejercicios bien es mejor que trackear 20 mal.
**Cómo aplicar:** cualquier cambio a cuántos "primarios" se muestran (ej. permitir 2 por patrón) es un cambio de producto, no solo de UI — coordinar con `producto.md`.
