# API HTTP — StrongBox (backend `api/`)

Referencia para integrar el **frontend** con el servidor Express. La API es **JSON-only** (CORS habilitado).

## Base URL

| Entorno    | URL                        |
| ---------- | -------------------------- |
| Local      | `http://localhost:3000`    |
| Produccion | Definir segun deploy       |

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

Las 4 wallets deben ser distintas entre si y distintas de la del titular.

**Respuesta 201**: `{ "ok": true }`

**Errores**: 400 (validacion), 401 (token), 409 (ya tiene strongbox), 500.

---

### `GET /api/strongbox/balance`

Balance de la StrongBox del usuario (mock → on-chain RPC).

**Respuesta 200**:
```json
{
  "balances": {
    "chainId": 97,
    "contractAddress": "0x...",
    "native": { "symbol": "BNB", "formatted": "0.5" },
    "source": "mock"
  }
}
```

**Errores**: 401, 404 (sin strongbox).

---

### `POST /api/strongbox/withdraw/request`

Crea solicitud de retiro. Notifica a guardianes.

**Body**:

| Campo | Tipo | Notas |
|-------|------|-------|
| `amount` | string | Monto en wei |
| `to_address` | string | Direccion destino |

**Respuesta 201**: `{ "request_id": "uuid" }`

---

### `POST /api/strongbox/withdraw/:id/approve`

Guardian aprueba solicitud de retiro.

**Respuesta 200**: `{ "ok": true, "fully_approved": false }`

---

### `GET /api/strongbox/withdraw/pending`

Lista solicitudes de retiro pendientes para el usuario (como owner o guardian).

---

### `GET /api/strongbox/guardians`

Lista guardianes y recovery contacts de la StrongBox del usuario.

---

## Ejemplo cURL

```bash
# Auth
curl -s http://localhost:3000/api/auth/me \
  -H 'Authorization: Bearer <TOKEN>'

# Setup
curl -s -X POST http://localhost:3000/api/strongbox/setup \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"own_email":"yo@mail.com","guardians":[{"wallet":"0x111...","email":"g1@mail.com"},{"wallet":"0x222...","email":"g2@mail.com"}],"recovery_contacts":[{"wallet":"0x333...","email":"r1@mail.com"},{"wallet":"0x444...","email":"r2@mail.com"}]}'
```
