# Gotcha: HMR desactivable en vite.config.ts (contrato con AI Studio)

`vite.config.ts` tiene lógica que parece "rara" pero es intencional:

```ts
server: {
  hmr: process.env.DISABLE_HMR !== 'true',
  watch: process.env.DISABLE_HMR === 'true' ? null : {},
}
```

**Por qué existe:** cuando el proyecto corre dentro de Google AI Studio y un agente edita archivos en vivo, el HMR + file-watching de Vite causa parpadeo/flickering y consume CPU. Setear `DISABLE_HMR=true` lo apaga.

**No hacer:**
- No borrar esta lógica al "simplificar" el config.
- No asumir que HMR siempre está activo — si alguien exportó con `DISABLE_HMR=true`, los cambios NO se reflejan en caliente y hay que reiniciar el server manualmente.

**En local normal:** `DISABLE_HMR` no está seteada, así que HMR funciona normal.
