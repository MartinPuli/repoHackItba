# API HTTP — StrongBox (backend `api/`)

Referencia para integrar el **frontend** con el servidor Express. La API es **JSON-only** (CORS habilitado).

## Base URL

| Entorno    | URL                                               |
| ---------- | ------------------------------------------------- |
| Local API  | `http://localhost:3001` (tipico `PORT=3001` en `api/`) |
| Frontend   | Suele ser `http://localhost:3000` — usar `NEXT_PUBLIC_API_URL=http://localhost:3001` |
| Produccion | Definir segun deploy                              |

## Convenciones

### Cabeceras

- **`Content-Type: application/json`** en `POST` con cuerpo.
- **`Authorization: Bearer <access_token>`** en rutas protegidas (JWT de Supabase tras login Web3).

### Respuestas de error

```json
{
  "error": "mensaje legible",
  "code": "opcional"
}
```

Codigos HTTP: **400** (validacion), **401** (token ausente/invalido), **404** (recurso no encontrado), **409** (conflicto), **500** (interno).

### Auth (MetaMask + Supabase)

1. Frontend: login con MetaMask via `supabase.auth.signInWithWeb3()`
2. Enviar `Authorization: Bearer <access_token>` en cada request
3. Si el token expiro → **401**

---

## Endpoints

### `GET /health`

Comprueba que el servidor responde.

**Respuesta 200**: `{ "ok": true }`

---

### `GET /api/auth/me`

Upsert de `users` con wallet desde JWT. Devuelve si ya tiene StrongBox.

**Respuesta 200**:
```json
{
  "profile": {
    "id": "uuid",
    "wallet_address": "0x...",
    "display_name": null,
    "email": null,
    "created_at": "...",
    "last_active_at": "..."
  },
  "has_strongbox": false
}
```

**Errores**: 401 (token), 409 (wallet duplicada), 422 (sin wallet en metadata), 500.

---

### `POST /api/strongbox/setup`

Crea StrongBox logica en DB (sin deploy on-chain). Configura guardianes y recovery contacts.

**Body**:

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `own_email` | string | si | Email del titular |
| `guardians` | array | si | 2 objetos `{ "wallet", "email" }` |
| `recovery_contacts` | array | si | 2 objetos `{ "wallet", "email" }` |
| `heirs` | array | no | Alias de `recovery_contacts` (mismo formato) |

Las 4 wallets deben ser distintas entre si y distintas de la del titular.

**Respuesta 201**: `{ "ok": true }`

**Errores**: 400 (validacion), 401 (token), 409 (ya tiene strongbox), 500.

---

### `GET /api/strongbox/balance`

Balance de la StrongBox del usuario autenticado.

- Si **no** esta deployada on-chain: balance **mock** deterministico (misma forma que antes).
- Si esta deployada (`is_deployed` + `contract_address` valida): **RPC** (`RPC_URL` en servidor), `balances.source` = `"rpc"`.

**Alias**: `GET /api/caja-fuerte/balance` (mismo comportamiento).

**Respuesta 200**:
```json
{
  "balances": {
    "chainId": 97,
    "contractAddress": "0x...",
    "native": {
      "symbol": "BNB",
      "wei": "1000000000000000000",
      "formatted": "1.000000"
    },
    "source": "rpc"
  },
  "dbSnapshot": {
    "balance_native": "0",
    "is_deployed": true,
    "recovery_state": "inactive",
    "time_limit_seconds": 31536000,
    "last_activity_at": "2026-03-28T12:00:00.000Z"
  }
}
```

**Errores**: 401, 404 (sin strongbox), 500 (ej. `RPC_URL` no configurado cuando hace falta leer on-chain).

---

### `POST /api/strongbox/confirm-deploy` / `POST /api/strongbox/confirm-deposit`

Confirmacion on-chain luego de que el usuario firma con MetaMask. Ver implementacion en `api/src/services/deployService.ts` y `depositService.ts`.

---

## Ejemplo cURL

```bash
curl -s http://localhost:3001/api/auth/me \
  -H 'Authorization: Bearer <TOKEN>'

curl -s -X POST http://localhost:3001/api/strongbox/setup \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"own_email":"yo@mail.com","guardians":[{"wallet":"0x1111111111111111111111111111111111111111","email":"g1@mail.com"},{"wallet":"0x2222222222222222222222222222222222222222","email":"g2@mail.com"}],"recovery_contacts":[{"wallet":"0x3333333333333333333333333333333333333333","email":"r1@mail.com"},{"wallet":"0x4444444444444444444444444444444444444444","email":"r2@mail.com"}]}'
```
