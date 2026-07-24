# Gotcha: paginación de la API de Hevy

**Síntoma:** si usas `limit` en vez de `pageSize`, o asumes páginas grandes, el sync trae datos incompletos o falla silenciosamente.

**Realidad de la API (`server.ts`):**
- El parámetro correcto es **`pageSize`**, NO `limit`. (Nota: `/api/hevy/validate` usa `limit=1` solo para un ping barato de validación; funciona porque solo chequea el status 200/401, pero el paginado real de datos usa `pageSize`.)
- `/v1/exercise_templates`: máximo real **100** por página.
- `/v1/workouts`: máximo real **10** por página (muy chico — por eso el sync completo puede requerir muchas páginas).
- La respuesta trae `page_count` cuando está disponible; el código lo usa para saber cuándo parar, y si no viene, infiere por `templates.length < pageSize`.

**Salvaguardas ya en el código:**
- `exercise_templates`: tope de 20 páginas (`page <= 20`).
- `workouts`: tope de 300 páginas = 3000 workouts (`maxPages = 300`), para no colgar/agotar quota en cuentas enormes.
- Templates faltantes (IDs presentes en workouts pero no en el catálogo paginado) se traen uno por uno con `fetchSingleExerciseTemplate` en paralelo.

**Al tocar `/api/sync-hevy`:** respeta estos límites y el patrón de `page_count`. No subas `pageSize` de workouts arriba de 10 esperando que funcione — la API lo ignora/capa.
