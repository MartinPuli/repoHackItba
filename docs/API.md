# API HTTP — Smart Wallet (backend `api/`)

Referencia para integrar el **frontend** con el servidor Express que vive en el paquete `api/`. La API es **JSON-only** (CORS habilitado, cuerpo `application/json`).

## Base URL

| Entorno   | Ejemplo                          |
| --------- | -------------------------------- |
| Local     | `http://localhost:3000`        |
| Producción | Definir según deploy (`PORT`) |

El prefijo de auth es **`/api/auth`**. No hay versión en URL (`/v1`) por ahora.

## Convenciones

### Cabeceras

- **`Content-Type: application/json`** en `POST` con cuerpo.

### Respuestas de error

Errores controlados devuelven JSON:

```json
{
  "error": "mensaje legible",
  "code": "opcional (ej. código Postgres u otro)"
}
```

Los códigos HTTP habituales: **400** (validación), **401** (login inválido o sin sesión), **404** (perfil de app inexistente), **409** (conflicto, p. ej. perfil duplicado), **422** (Auth / reglas de Supabase), **500** (interno o Supabase no configurado).

### Auth y Supabase (contexto para frontend)

- El registro y login usan **Supabase Auth** en el servidor (clave **service role**). El frontend **no** debe usar la service role.
- La API devuelve el objeto **`session`** de Supabase cuando el flujo lo permite (incluye `access_token`, `refresh_token`, `expires_in`, etc.). El front puede guardarlo (p. ej. memoria segura / storage acotado) y crear un cliente Supabase con el **`access_token`** si necesitás llamar a la DB con RLS como “ese usuario”.
- En **`public.users`** el `id` coincide con el `user.id` de Auth; el campo **`wallet_address`** suele ser un **placeholder** hasta el deploy del smart wallet (CREATE2).

### Email: sin verificación por mail (recomendado para el hackathon)

Para evitar `session: null` en el registro y no depender de enlaces al mail:

1. Dashboard Supabase → **Authentication → Providers → Email**.
2. Desactivar **Confirm email** (nombre exacto puede variar según la UI).

Así el **register** suele devolver sesión al instante. Coordinar con quien administra el proyecto si el entorno es compartido.

---

## Endpoints

### `GET /health`

Comprueba que el servidor responde.

**Respuesta 200**

```json
{
  "ok": true
}
```

---

### `POST /api/auth/register`

Crea usuario en **Supabase Auth** y fila en **`public.users`** (mismo `id` que Auth, `wallet_address` placeholder).

**Body**

| Campo      | Tipo   | Obligatorio |
| ---------- | ------ | ----------- |
| `email`    | string | sí          |
| `password` | string | sí          |

**Respuesta 201**

```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@dominio.com"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 3600,
    "token_type": "bearer",
    "user": { }
  },
  "profile": {
    "id": "uuid",
    "wallet_address": "0x...",
    "display_name": null,
    "email": "usuario@dominio.com",
    "autonomy_level": "asistente",
    "created_at": "2026-03-28T04:44:39.690308+00:00",
    "updated_at": "2026-03-28T04:44:39.690308+00:00",
    "last_active_at": "2026-03-28T04:44:39.690308+00:00"
  }
}
```

- Si la confirmación por email sigue activa, **`session` puede ser `null`** hasta confirmar; con confirmación desactivada, suele ir populado.
- `autonomy_level` viene del schema (`asistente` | `copiloto` | `autonomo`).

**Errores frecuentes**

- **400** — email inválido según Supabase, o cuerpo incompleto.
- **400/422** — email ya registrado (mensaje de Supabase en `error`).
- **500** — variables de entorno faltantes, tabla `public.users` inexistente en el proyecto, u otro fallo de servidor.

---

### `POST /api/auth/login`

Autentica con email y password; exige sesión y perfil en **`public.users`**.

**Body**

Misma forma que register.

**Respuesta 200**

Misma forma que register (201), pero status **200** y **`session`** debe existir si el login fue exitoso.

**Errores frecuentes**

- **401** — credenciales incorrectas o usuario sin confirmar (si la confirmación sigue activa).
- **404** — usuario en Auth pero sin fila en `public.users` (registro a medias o borrado de perfil).
- **400** — body inválido.

---

## Ejemplo cURL (login)

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"usuario@dominio.com","password":"TuPasswordSeguro"}'
```

---

## Pruebas desde el repo

En `api/http/api.http` hay peticiones listas para **REST Client** (VS Code / Cursor).

---

## Próximos pasos posibles (no implementados aún)

- Rutas protegidas con middleware JWT (`Authorization: Bearer <access_token>`).
- Endpoints de wallet / caja fuerte / transacciones alineados al schema en `public`.

Para el modelo de datos completo, ver la migración en `api/supabase/migrations/` y tipos en `api/src/types/database.types.ts`.
