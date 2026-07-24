# Gotcha: la autenticación es falsa a propósito

`LoginScreen.tsx` + `src/lib/session.ts`:
- Acepta **cualquier** email/contraseña no vacíos.
- No valida contra ningún backend. Solo guarda el email en `localStorage['nextpr_session']`.
- `hasActiveSession()` = "existe esa key en localStorage". Logout = borrarla.

**No es un bug ni un descuido de seguridad — es una decisión de MVP** (ver `decisions/producto.md`). La propia UI lo dice: "Modo MVP: cualquier correo y contraseña son válidos".

**Al trabajar acá:**
- No construyas features que dependan de identidad real de usuario (multi-usuario, roles, datos por-usuario en servidor) sin reemplazar primero este mecanismo.
- No reportes esto como vulnerabilidad "a arreglar" salvo que te pidan explícitamente implementar auth real.
- Todo el estado es por-navegador (localStorage), así que "cerrar sesión" no borra los ejercicios ni la key de Hevy, solo la marca de sesión.
