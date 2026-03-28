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
- **`Authorization: Bearer <access_token>`** en rutas protegidas (el `session.access_token` del cliente Supabase tras login Web3).

### Respuestas de error

Errores controlados devuelven JSON:

```json
{
  "error": "mensaje legible",
  "code": "opcional (ej. código Postgres u otro)"
}
```

Los códigos HTTP habituales: **400** (validación), **401** (token ausente, JWT inválido o expirado), **404** (recurso no encontrado), **409** (conflicto, p. ej. caja fuerte ya configurada o wallet duplicada), **422** (sesión sin metadata Web3), **500** (interno o Supabase no configurado).

### Rutas protegidas (JWT)

1. En el **frontend**, iniciar sesión con **MetaMask** vía **`supabase.auth.signInWithWeb3({ chain: 'ethereum' })`** (u otro flujo Web3 de Supabase) y guardá **`session.access_token`**.
2. En peticiones a esta API, enviá **`Authorization: Bearer <access_token>`**.
3. Si el token expiró o es inválido, la API responde **401** con cuerpo `{ "error": "..." }`.

### Auth y Supabase (contexto para frontend)

- **No** hay `POST /api/auth/register` ni `POST /api/auth/login` en el backend: el auth lo resuelve el cliente con Supabase.
- El backend usa la **service role** solo para validar el JWT en rutas protegidas y para leer/escribir `public.*` con el cliente admin. El frontend **no** expone la service role.
- Tras el login Web3, **`GET /api/auth/me`** hace **upsert** de **`public.users`** (`id` = `auth.users.id`, `wallet_address` desde `user_metadata`, p. ej. `ethereum_address`).
- El email opcional del titular en **`public.users`** se puede cargar con **`POST /api/strongbox/setup`** (`own_email`).

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

### `GET /api/auth/me`

Asegura fila en **`public.users`** (upsert por `id` con `wallet_address` leída del JWT / metadata Web3) y devuelve si ya existe **`caja_fuerte`** para el usuario.

**Cabeceras**

| Cabecera        | Valor                                   |
| --------------- | --------------------------------------- |
| `Authorization` | `Bearer <access_token>` (obligatorio) |

**Respuesta 200**

```json
{
  "profile": {
    "id": "uuid",
    "wallet_address": "0x...",
    "display_name": null,
    "email": null,
    "autonomy_level": "asistente",
    "created_at": "2026-03-28T04:44:39.690308+00:00",
    "updated_at": "2026-03-28T04:44:39.690308+00:00",
    "last_active_at": "2026-03-28T04:44:39.690308+00:00"
  },
  "has_strongbox": false
}
```

**Errores frecuentes**

- **401** — sin `Bearer`, token inválido o expirado.
- **409** — conflicto de unicidad en `users.wallet_address` (misma wallet, otro usuario).
- **422** — token válido pero sin dirección EVM en metadata (`ethereum_address` / `wallet_address`).
- **500** — Supabase no configurado u otro error de servidor.

---

### `GET /api/wallet/balance`

Devuelve balances **simulados** (BNB + USDT) para la smart wallet del usuario autenticado. La dirección se resuelve en este orden: última fila en **`wallets.contract_address`** para el `user_id`; si no existe, **`users.wallet_address`** (wallet Web3 del usuario). Los valores on-chain reales se integrarán vía RPC/ethers sustituyendo la capa mock.

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

Balances **simulados** para la caja fuerte: BNB nativo, USDT y RBTC. Requiere una fila en **`caja_fuerte`**. Si **`contract_address`** aún es `null` (caja solo en DB, sin deploy), el mock usa una dirección derivada del `id` de la fila.

**Cabeceras:** `Authorization: Bearer <access_token>`.

**Respuesta 200:** objeto `balances` con `source: "mock"` y `dbSnapshot` con columnas cache del schema.

**Errores:** **401**; **404** si no hay fila `caja_fuerte` para el usuario.

---

### `POST /api/strongbox/setup`

Crea la **caja fuerte lógica** en Supabase (**sin deploy on-chain**): una fila **`caja_fuerte`** (`wallet_id` y `contract_address` null, `is_deployed: false`) y **4** filas en **`herederos`** (2 guardianes + 2 herederos), cada una con **`wallet` + `email`**. Actualiza **`users.email`** del titular con **`own_email`**.

Solo se permite **una** configuración por usuario (**409** si ya existe `caja_fuerte`).

**Cabeceras:** `Authorization: Bearer <access_token>` (obligatorio).

**Body (JSON)**

| Campo        | Tipo   | Obligatorio | Notas |
| ------------ | ------ | ----------- | ----- |
| `own_email`  | string | sí          | Email del titular (sin verificación). |
| `guardians`  | array  | sí          | Exactamente **2** objetos `{ "wallet", "email" }`. |
| `heirs`      | array  | sí          | Exactamente **2** objetos `{ "wallet", "email" }`. |

Las cuatro wallets deben ser **distintas** entre sí y **distintas** de la `wallet_address` del titular en **`public.users`**.

**Respuesta 201**

```json
{ "ok": true }
```

**Errores frecuentes**

- **400** — validación de body, formato EVM, emails vacíos, wallets duplicadas o iguales a la del titular.
- **401** — token ausente o inválido.
- **409** — el usuario ya tiene `caja_fuerte`.
- **500** — fallo de Supabase.

---

### Ejemplo cURL (`/me` con JWT)

Sustituí `<ACCESS_TOKEN>` por `session.access_token` obtenido en el frontend tras Web3 login:

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

### Ejemplo cURL (strongbox setup)

```bash
curl -s -X POST http://localhost:3000/api/strongbox/setup \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"own_email":"yo@dominio.com","guardians":[{"wallet":"0x1111111111111111111111111111111111111111","email":"g1@dominio.com"},{"wallet":"0x2222222222222222222222222222222222222222","email":"g2@dominio.com"}],"heirs":[{"wallet":"0x3333333333333333333333333333333333333333","email":"h1@dominio.com"},{"wallet":"0x4444444444444444444444444444444444444444","email":"h2@dominio.com"}]}'
```

---

## Pruebas desde el repo

En `api/http/api.http` hay peticiones listas para **REST Client** (VS Code / Cursor).

## Notas de alineación (contratos vs producto)

- **`Wallet.sol`** expone `GetBalance()` nativo; no hay USDT en el contrato actual; el mock incluye USDT para la API objetivo del hackathon.
- **`StrongBox.sol`** (`contracts/src/StrongBox.sol`): balance vía `getBalance()` nativo y modificador `OnlyOwner`; la lectura por backend vía RPC no depende del modificador. Documentación en `docs/INTEGRACION-CONTRATOS.md` describe `CajaFuerte` con más métodos que aún no coinciden 1:1 con el código en `contracts/src/`.

Para el modelo de datos completo, ver la migración en `api/supabase/migrations/` y tipos en `api/src/types/database.types.ts`.
