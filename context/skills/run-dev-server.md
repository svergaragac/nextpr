# Skill: levantar el server en local

## Pasos
1. `node_modules` ya suele estar instalado. Si no: `npm install`.
2. `npm run dev` (corre `tsx server.ts`).
3. Abrir **http://localhost:3000** (puerto fijo `PORT = 3000` en `server.ts`, hardcodeado).

## Qué esperar
- Log de éxito: `[NextPR Server] Running securely on port 3000`.
- Sin `.env`: verás `injected env (0) from .env` — es normal, no hay archivo `.env` en el repo (solo `.env.example`).
- Sin `GEMINI_API_KEY`: el chat del coach responde en **modo simulado** (fallback por reglas), no es error.
- Sin `HEVY_API_KEY` ni key personal conectada: el botón "Sincronizar Hevy" abre el modal de integraciones pidiendo conectar.

## Para habilitar features reales
Crear `.env` (copiando `.env.example`) con:
- `GEMINI_API_KEY=...` → activa el coach IA real (Gemini `gemini-2.5-flash`).
- `HEVY_API_KEY=...` → key de Hevy a nivel servidor (opcional; el usuario también puede conectar la suya desde la UI, que se guarda en localStorage y viaja en el header `x-hevy-api-key`).

## Verificación rápida sin navegador
`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → debe dar `200`.

## Prod (referencia, no para dev diario)
`npm run build` (vite build + esbuild del server) → `npm start` (corre `dist/server.cjs` con estáticos servidos desde `dist/`).
