# Guardianes, herederos y caja fuerte lógica (API `api/`)

Documento de **implementación actual** del backend: cómo se guardan guardianes y herederos en Supabase, cómo se relaciona con el auth Web3 y qué queda para chain. La referencia HTTP detallada está en [`../../docs/API.md`](../../docs/API.md).

---

## 1. Contexto del problema

- **On-chain**, StrongBox expone `setHeirGuardian1/2` (dos direcciones). En el **producto / DB** distinguimos **2 guardianes** y **2 herederos** (4 personas con `wallet` + `email` cada una), alineados al flujo de UI y a la lógica ampliable fuera del contrato.
- La **API no firma transacciones**. Valida **JWT** (Supabase Auth), persiste intención en **`public.caja_fuerte`** + **`public.herederos`**, y la **verdad on-chain** sigue siendo lo que el cliente firma contra el contrato cuando corresponda (p. ej. tras el primer depósito y deploy).

---

## 2. Autenticación

- **No** existen `POST /api/auth/register` ni `POST /api/auth/login` con email/password.
- El **frontend** inicia sesión con **MetaMask** vía cliente Supabase (p. ej. `signInWithWeb3` / flujo Ethereum).
- El backend recibe **`Authorization: Bearer <access_token>`** y usa `requireAuth` como el resto de rutas protegidas.

---

## 3. ¿Cuándo falta “caja fuerte en app”?

Tras el login Web3, **`GET /api/auth/me`**:

1. Hace **upsert** en **`public.users`** (`id` = usuario de Auth, `wallet_address` desde metadata del JWT, p. ej. `ethereum_address`).
2. Devuelve **`has_strongbox`**: `true` si ya existe al menos una fila en **`caja_fuerte`** para ese `user_id`.

Si **`has_strongbox === false`**, el frontend puede mostrar el flujo para cargar guardianes/herederos y llamar a **`POST /api/strongbox/setup`**.

---

## 4. Schema en Supabase (estado actual)

Migraciones en `api/supabase/migrations/`:

- **`001_initial_schema`**: tablas base.
- **`002_web3_strongbox`**: ajustes para caja fuerte **sin deploy todavía** y herederos con rol.

### `caja_fuerte`

- Puede existir una fila **solo en DB**: **`wallet_id`** y **`contract_address`** pueden ser **`NULL`** hasta que haya smart wallet desplegada y/o primer depósito.
- **`is_deployed`**: `false` hasta que el producto marque deploy on-chain (fuera de este doc).

### `herederos`

- **`caja_fuerte_id`**: FK a la caja del usuario.
- **`rol`**: `'guardian'` | `'heir'` (`CHECK` en DB).
- **`slot`**: `1` o `2` (dentro de cada rol: guardián 1/2, heredero 1/2).
- **`address`**: wallet EVM (`0x` + 40 hex).
- **`email`**: texto guardado tal cual (sin verificación de correo).
- **Unicidad**: `UNIQUE (caja_fuerte_id, rol, slot)` (cuatro filas por caja en el setup estándar).
- Otros campos del `001` (`share_percentage`, `nonce`, etc.) siguen existiendo; el setup actual no los personaliza (valores por defecto del schema).

Referencia ampliada del modelo: [`../../docs/SUPABASE-SCHEMA.md`](../../docs/SUPABASE-SCHEMA.md).

---

## 5. Endpoint de setup

### `POST /api/strongbox/setup`

- **Auth**: JWT obligatorio.
- **Cuerpo**: ver ejemplos en [`../../docs/API.md`](../../docs/API.md): `own_email`, `guardians` (2), `heirs` (2); cada elemento `{ "wallet", "email" }`.
- **Reglas principales**:
  - Exactamente **2** guardianes y **2** herederos.
  - Las **cuatro** wallets deben ser **distintas** entre sí.
  - Ninguna puede coincidir con **`users.wallet_address`** del titular.
  - **409** si el usuario **ya** tiene una **`caja_fuerte`** (un solo setup lógico por usuario).
- **Efecto**:
  1. `UPDATE users SET email = own_email` para el `user_id` del JWT.
  2. `INSERT` en **`caja_fuerte`** (sin `wallet_id` ni `contract_address`, `is_deployed: false`).
  3. `INSERT` de **4** filas en **`herederos`**.
- **Respuesta**: `{ "ok": true }` (201).

### Rutas eliminadas (no usar)

- **`POST /api/herederos`** y **`GET /api/herederos`** fueron reemplazadas por este flujo. Cualquier doc o cliente que aún las cite está desactualizado.

---

## 6. Por qué no se envía la transacción desde el servidor

Igual que antes: **service role** y custodia de claves de usuario en backend serían un antipatrón. El flujo acordado: **API escribe DB** → **cliente firma** cuando toque (`setHeirGuardian*`, deploy, etc.).

Pueden existir **divergencias** DB vs chain si no se sincroniza tras las txs; mitigar en producto (estados “pendiente on-chain”) es trabajo futuro.

---

## 7. Puntos de revisión (contratos / producto)

1. **Contrato** solo tiene **dos** slots `setHeirGuardian*`: mapear en cliente qué combinación de guardianes/herederos de las **cuatro** filas DB se escribe on-chain (o evolucionar el contrato).
2. **`users.wallet_address`** tras Web3 es la EOA MetaMask: alinear con **Wallet** contrato vs EOA en deploy de StrongBox.
3. **RLS**: rutas usan cliente **admin**; acceso directo del front a `herederos` por Supabase cliente debe ir con políticas acordes.

---

## 8. Resumen

El backend **centraliza validación con JWT**, **crea la caja fuerte en DB antes del deploy**, y **persiste 2 guardianes + 2 herederos** (`wallet` + `email`) en **`herederos`** con **`rol`**. La **firma on-chain** queda en el cliente.
