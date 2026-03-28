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
- **`Authorization: Bearer <access_token>`** en rutas protegidas (el mismo `access_token` que devuelve `session` en login o register).

### Respuestas de error

Errores controlados devuelven JSON:

```json
{
  "error": "mensaje legible",
  "code": "opcional (ej. código Postgres u otro)"
}
```

Los códigos HTTP habituales: **400** (validación), **401** (login inválido, token ausente, JWT inválido o expirado), **404** (perfil de app inexistente), **409** (conflicto, p. ej. perfil duplicado), **422** (Auth / reglas de Supabase), **500** (interno o Supabase no configurado).

### Rutas protegidas (JWT)

1. Llamá a **`POST /api/auth/login`** (o register con sesión) y guardá **`session.access_token`**.
2. En siguientes peticiones, enviá **`Authorization: Bearer <access_token>`**.
3. Si el token expiró o es inválido, la API responde **401** con cuerpo `{ "error": "..." }`.

### Auth y Supabase (contexto para frontend)

- El registro y login usan **Supabase Auth** en el servidor (clave **service role**). El frontend **no** debe usar la service role.
- En **login** y **register** la respuesta incluye solo **`session`** (objeto Supabase, con `access_token`, `refresh_token`, `session.user`, etc.) y **`profile`** (fila `public.users`). No se repite un `user` suelto en la raíz: para `id` / `email` de Auth usá **`session.user`**; para datos de app usá **`profile`**.
- El front puede persistir **`session`** y usar **`access_token`** en cabeceras `Authorization: Bearer` o con el cliente Supabase si llamás a la DB con RLS.
- En **`public.users`** el `id` coincide con `session.user.id`; el campo **`wallet_address`** suele ser un **placeholder** hasta el deploy del smart wallet (CREATE2).

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
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 3600,
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "email": "usuario@dominio.com"
    }
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

### `GET /api/auth/me`

Devuelve el perfil en **`public.users`** (`id`, `email`, `wallet_address`, etc.). Los datos de sesión Auth (`session.user`) ya los tenés del login o podés inspeccionar el JWT. Requiere JWT válido.

**Cabeceras**

| Cabecera        | Valor                                      |
| --------------- | ------------------------------------------ |
| `Authorization` | `Bearer <access_token>` (obligatorio)   |

**Respuesta 200**

```json
{
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

**Errores frecuentes**

- **401** — sin cabecera `Authorization`, no es `Bearer`, token inválido o expirado.
- **404** — usuario de Auth válido pero sin fila en `public.users`.
- **500** — Supabase no configurado u otro error de servidor.

---

### `GET /api/wallet/balance`

Devuelve balances **simulados** (BNB + USDT) para la smart wallet del usuario autenticado. La dirección se resuelve en este orden: última fila en **`wallets.contract_address`** para el `user_id`; si no existe, **`users.wallet_address`** (placeholder de registro). Los valores on-chain reales se integrarán vía RPC/ethers sustituyendo la capa mock.

**Cabeceras:** `Authorization: Bearer <access_token>` (obligatorio).

**Respuesta 200 (ejemplo)**

```json
{
  "resolution": "users_fallback",
  "balances": {
    "chainId": 97,
    "contractAddress": "0x...",
    "native": { "symbol": "BNB", "wei": "...", "formatted": "0.012345" },
    "usdt": { "symbol": "USDT", "raw": "...", "decimals": 6, "formatted": "1.23" },
    "source": "mock"
  },
  "dbSnapshot": null
}
```

Si hay fila `wallets`, `resolution` será `"wallets"` y `dbSnapshot` incluirá `balance_bnb`, `balance_usdt`, `is_deployed`.

**Errores:** **401** token; **404** sin `users.wallet_address`; **500** Supabase no configurado.

---

### `GET /api/caja-fuerte/balance`

Balances **simulados** para la caja fuerte: BNB nativo, USDT y RBTC (alineado al schema y a la visión producto; el contrato actual `StrongBox.sol` solo expone balance nativo — ver notas abajo). Requiere una fila en **`caja_fuerte`** con `contract_address` del usuario.

**Cabeceras:** `Authorization: Bearer <access_token>`.

**Respuesta 200:** objeto `balances` con `source: "mock"` y `dbSnapshot` con columnas cache del schema.

**Errores:** **401**; **404** si no hay fila `caja_fuerte` para el usuario.

---

### `POST /api/herederos`

Registra herederos en **`public.herederos`** vinculados a la **`caja_fuerte`** del usuario autenticado. Cada entrada usa el **email** de un usuario que **ya debe existir** en `public.users` (misma lógica que en producto: primero se registran). La API toma **`users.wallet_address`** de cada heredero y valida formato `0x` de 42 caracteres.

Después de un **201**, el cliente debe **firmar on-chain** `setHeirGuardian1` / `setHeirGuardian2` en el contrato StrongBox (el usuario puede hacerlo con su EOA si el deploy usó `userEOA` en el constructor; ver `contracts/src/StrongBox.sol`).

**Cabeceras:** `Authorization: Bearer <access_token>` (obligatorio).

**Body**

| Campo          | Tipo   | Obligatorio | Notas                                      |
| -------------- | ------ | ----------- | ------------------------------------------ |
| `herederos`    | array  | sí          | Entre **1** y **2** elementos (límite del contrato). |

Cada elemento de `herederos`:

| Campo          | Tipo   | Obligatorio |
| -------------- | ------ | ----------- |
| `email`        | string | sí          |
| `display_name` | string | no          |

**Respuesta 201 (ejemplo)**

```json
{
  "herederos": [
    {
      "slot": 1,
      "email": "heredero1@dominio.com",
      "address": "0x...",
      "display_name": "Juan"
    }
  ],
  "caja_fuerte_id": "uuid",
  "message": "Herederos asignados en base de datos. Firmá la transacción on-chain para confirmar en el contrato."
}
```

**Errores frecuentes**

- **400** — array vacío, más de 2 herederos, emails duplicados, heredero sin cuenta, wallet inválida, mismo email que el titular, misma dirección que la smart wallet del titular.
- **401** — token ausente o inválido.
- **404** — sin fila `caja_fuerte` para el usuario (crear en DB tras deploy).

---

### `GET /api/herederos`

Lista las filas de **`herederos`** de la caja fuerte del usuario autenticado, ordenadas por `slot`. Incluye `email` cuando se puede resolver desde `users.wallet_address`.

**Cabeceras:** `Authorization: Bearer <access_token>`.

**Respuesta 200**

```json
{
  "herederos": [
    {
      "id": "uuid",
      "caja_fuerte_id": "uuid",
      "slot": 1,
      "address": "0x...",
      "display_name": "Juan",
      "share_percentage": "50.00",
      "nonce": 0,
      "created_at": "...",
      "updated_at": "...",
      "email": "hermano@dominio.com"
    }
  ],
  "caja_fuerte_id": "uuid"
}
```

**Errores:** **401**; **404** sin `caja_fuerte`.

---

## Ejemplo cURL (login)

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"usuario@dominio.com","password":"TuPasswordSeguro"}'
```

### Ejemplo cURL (`/me` con JWT)

Sustituí `<ACCESS_TOKEN>` por el valor de `session.access_token` del login:

```bash
curl -s http://localhost:3000/api/auth/me \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

### Ejemplo cURL (balances con JWT)

```bash
curl -s http://localhost:3000/api/wallet/balance \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'

curl -s http://localhost:3000/api/caja-fuerte/balance \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

### Ejemplo cURL (herederos)

```bash
curl -s -X POST http://localhost:3000/api/herederos \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"herederos":[{"email":"heredero@dominio.com","display_name":"María"}]}'

curl -s http://localhost:3000/api/herederos \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

---

## Pruebas desde el repo

En `api/http/api.http` hay peticiones listas para **REST Client** (VS Code / Cursor).

## Notas de alineación (contratos vs producto)

- **`Wallet.sol`** expone `GetBalance()` nativo; no hay USDT en el contrato actual; el mock incluye USDT para la API objetivo del hackathon.
- **`StrongBox.sol`** (`contracts/src/StrongBox.sol`): balance vía `getBalance()` nativo y modificador `OnlyOwner`; la lectura por backend vía RPC no depende del modificador. Documentación en `docs/INTEGRACION-CONTRATOS.md` describe `CajaFuerte` con más métodos que aún no coinciden 1:1 con el código en `contracts/src/`.

Para el modelo de datos completo, ver la migración en `api/supabase/migrations/` y tipos en `api/src/types/database.types.ts`.
