# Herederos: implementación en la API (`api/`)

Este documento resume **qué se agregó en el backend**, **por qué** se diseñó así y **qué debe revisar** alguien con foco en contratos y blockchain. La referencia de contratos HTTP (schemas, ejemplos) sigue en [`../../docs/API.md`](../../docs/API.md).

---

## 1. Contexto del problema

- En chain, **StrongBox** tiene como `owner` el contrato **Wallet**, no el EOA del usuario. Las funciones `setHeirGuardian1/2` históricamente solo permitían `OnlyOwner`, y **Wallet no reenvía** llamadas a StrongBox.
- Para el hackathon se adoptó en **contratos** la solución `userEOA` + override en StrongBox (ver `contracts/src/StrongBox.sol`, `HeirGuardians.sol`, `Factory.sol`): el EOA que despliega la caja puede llamar a `setHeirGuardian1/2` además del owner contrato.
- La **API no firma transacciones on-chain**. Su rol es **validar identidad** (JWT), **resolver emails → direcciones** desde Supabase, **exigir que exista `caja_fuerte`** para el usuario y **persistir** filas en `public.herederos` para producto / UI / auditoría off-chain. La **fuente de verdad on-chain** sigue siendo el contrato tras las txs firmadas por el cliente.


## 2. Dependencias en Supabase

- **`users`**: el solicitante debe existir; cada heredero se busca por **email** (match case-insensitive con `.ilike`) y debe tener **`wallet_address`** no vacía y con formato `0x` + 40 hex.
- **`caja_fuerte`**: debe existir al menos una fila para `user_id` = usuario del JWT (la más reciente por `created_at`). Si no hay caja en DB, la API responde **404** con mensaje orientado a “crear fila tras deploy”.
- **`herederos`**: persistencia por `(caja_fuerte_id, slot)` mediante **upsert** (`onConflict: 'caja_fuerte_id,slot'`).

### Elección de dirección del solicitante para “no autofirma como heredero”

Se usa `resolveSmartWalletForUser`:

1. Prioridad a la fila más reciente en **`wallets`** (`contract_address`).
2. Si no hay fila en `wallets`, fallback a **`users.wallet_address`**.

La dirección del heredero (**contrato wallet** o EOA según lo que esté en `users.wallet_address`) se compara en minúsculas con esa dirección “primaria” del solicitante. Objetivo: evitar designar como heredero la **misma** cuenta que la app considera wallet del titular (ajustable si el modelo de negocio distingue explícitamente EOA vs contrato en todos los flujos).

---

## 3. Endpoints

Ambas rutas exigen **`Authorization: Bearer <access_token>`** (mismo flujo que el resto de la API; ver `requireAuth`).

### `POST /api/herederos`

- **Body**: `{ "herederos": [ { "email": string, "display_name"?: string | null }, ... ] }`
- **Reglas**:
  - Entre **1 y 2** elementos (alineado con `setHeirGuardian1` y `setHeirGuardian2` on-chain).
  - Emails normalizados (`trim` + `lowerCase`); **sin duplicados** en el payload.
  - El solicitante **no** puede figurar como heredero por **mismo email** que su perfil.
  - Cada email debe existir en `users` con **`wallet_address`** válida; si no, **400** con mensaje explícito (“debe registrarse primero”) — **no** hay flujo de invitación por mail en MVP.
  - **No** repetir la misma **address** entre herederos del mismo request.
  - La address del heredero **no** puede ser la misma que la resuelta para el titular (`resolveSmartWalletForUser`).
- **Persistencia**:
  - Slots **1** y **2** según orden del array.
  - **`share_percentage`**: `100.00` si hay un solo heredero; `50.00` si hay dos (convención solo off-chain; el contrato no modela porcentajes en esta versión).
  - Si solo hay **un** heredero, se **elimina** explícitamente la fila con `slot = 2` para esa `caja_fuerte_id`, para no dejar un heredero viejo en el segundo slot.
- **Respuesta 201**: lista de `{ slot, email, address, display_name }`, `caja_fuerte_id` (UUID) y un **`message`** que instruye firmar on-chain.

### `GET /api/herederos`

- Devuelve las filas de **`herederos`** de la caja del usuario, ordenadas por `slot`.
- Enriquece cada fila con **`email`** buscando en `users` por `wallet_address` (puede quedar `null` si nadie coincide — útil para revisión de integridad).

---

## 4. Por qué no se envía la transacción desde el servidor

- La API usa **service role** de Supabase; guardar claves de firma del usuario en el backend sería un antipatrón de seguridad.
- El flujo acordado: **backend valida y escribe DB** → **frontend/wallet firma** `setHeirGuardian1` / `setHeirGuardian2` hacia la dirección `caja_fuerte.contract_address` (StrongBox), desde el **EOA** registrado como `userEOA` en el contrato (ver deploy por Factory).

**Implicación para revisión:** pueden existir **divergencias** DB vs chain si el usuario nunca firma o si firma direcciones distintas a las guardadas. Mitigar en producto (estado “pendiente on-chain”, reconciliación, o firma obligatoria tras POST) es trabajo futuro; fuera del alcance actual del service.

---

## 5. Puntos de revisión sugeridos (para perfil “contratos / blockchain”)

1. **¿`users.wallet_address` del heredero es la dirección correcta** para `setHeirGuardian*`? Si el heredero debe ser **EOA** pero en DB solo está el contrato Wallet (o al revés), hay que alinear schema + política de la API.
2. **¿Un heredero debería poder ser únicamente otra cuenta con Wallet desplegada?** Hoy cualquier usuario con fila en `users` y address válida entra.
3. **Atomicidad DB + chain:** no hay transacción distribuida; conviene documentar el estado esperado en UI.
4. **Eventos / indexación:** si más adelante se indexan logs del contrato, el listado `GET` podría contrastarse con el subgraph o el explorer.
5. **RLS:** estas rutas usan **admin**; el frontend que lea `herederos` directamente por Supabase cliente debe respetar políticas RLS acordes (no duplicar permisos peligrosos).

---

## 6. Resumen en una frase

La API **centraliza validaciones sensibles a identidad y datos de app**, **persiste** la intención de designación en **`herederos`**, y deja la **autoridad on-chain** en manos del **cliente que firma** contra **StrongBox**, coherente con el cambio **`userEOA`** en contratos.
