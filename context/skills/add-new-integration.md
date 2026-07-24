# Skill: agregar / activar una integración

Hoy solo **Hevy** es funcional. Las demás (Strava, Garmin, Apple Health, Whoop, Oura, MyFitnessPal) existen solo como UI con `functional: false` en `IntegrationsModal.tsx`.

## Para volver funcional una integración (patrón basado en Hevy)

1. **Backend — endpoints en `server.ts`** (seguir el patrón de Hevy):
   - `POST /api/<servicio>/validate` → valida la credencial contra la API real, responde `{ valid: true }` o error tipado.
   - `GET /api/sync-<servicio>` → trae datos, los normaliza al shape `Exercise` de `src/types.ts` y los devuelve.
   - Aceptar la credencial vía header (Hevy usa `x-hevy-api-key`) o `process.env`.
   - Respetar errores tipados: `{ error: "api_key_missing" | "invalid_api_key" | "<servicio>_api_error" | ..., message }`.

2. **Cliente — lib en `src/lib/<servicio>Auth.ts`** (copiar `hevyAuth.ts`):
   - `get/set/clearStored<Servicio>ApiKey` sobre localStorage con su propia key.
   - `validate<Servicio>ApiKey` que llama al endpoint de validación.

3. **UI — `IntegrationsModal.tsx`**:
   - Cambiar `functional: true` en el `INTEGRATIONS` correspondiente **solo cuando el backend exista**.
   - Agregar la vista de conexión (hoy el modal solo tiene `view: 'grid' | 'hevy'`, habría que generalizar a un servicio activo).

4. **`App.tsx`**: cablear `onConnected`/`onDisconnected` y disparar el sync como se hace con `handleSyncData` para Hevy.

## Gotcha
Ver `gotchas/hevy-api-pagination.md` — cada API externa tendrá sus propios límites de paginado y nombres de parámetros. No asumas que otra API usa `pageSize`.

## Registrar
Al terminar, actualiza `state/current.md` (mover la integración de "Pendiente" a "Hecho") y agrega una decisión en `decisions/producto.md` si el criterio de normalización de datos no fue trivial.
