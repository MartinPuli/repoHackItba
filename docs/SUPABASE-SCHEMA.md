# StrongBox — Database Schema

## Resumen

7 tablas, 5 enums, 1 view. Schema diseñado como cache + metadata del estado on-chain.

**On-chain es siempre source of truth** — la DB guarda:
- Metadata que no va on-chain (emails, nombres)
- Cache de estado para queries rapidas (balance, recovery_state)
- Datos del flujo off-chain (alertas, historial)

## Diagrama de relaciones

```
users (1)
  │
  └──► strongboxes (1)
         │
         ├──► guardians (2)              slot 1, 2
         ├──► recovery_contacts (2)      slot 1, 2
         ├──► withdrawal_requests (N)    solicitudes de retiro
         └──► transactions (N)           historial

users (1)
  └──► alerts (N)                        notificaciones
```

## Tablas

### users
Usuario = wallet address. Se crea con upsert en `/api/auth/me`.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID PK | auto |
| wallet_address | TEXT UNIQUE | address EVM del usuario |
| display_name | TEXT | opcional |
| email | TEXT | se carga en /strongbox/setup |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | auto-trigger |
| last_active_at | TIMESTAMPTZ | |

### strongboxes
Una vault por usuario. Se crea con `is_deployed=false` en setup, luego se actualiza con contract_address tras deploy on-chain.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID PK | auto |
| user_id | UUID FK → users | |
| contract_address | TEXT UNIQUE | null hasta deploy |
| chain_id | INTEGER | default 97 (BSC Testnet) |
| balance_native | NUMERIC(28,18) | cache del balance on-chain |
| time_limit_seconds | INTEGER | default 31536000 (1 año) |
| last_activity_at | TIMESTAMPTZ | cache de lastTimeUsed on-chain |
| recovery_state | ENUM | inactive, pending, executed |
| recovery_unlocks_at | TIMESTAMPTZ | null si no hay recovery activo |
| is_deployed | BOOLEAN | false hasta que se deploya on-chain |
| deploy_tx_hash | TEXT | hash de la tx de deploy |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | auto-trigger |

### guardians
2 por vault. Aprueban/rechazan retiros del owner.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID PK | auto |
| strongbox_id | UUID FK → strongboxes | |
| slot | SMALLINT | 1 o 2 |
| address | TEXT | wallet address del guardian |
| email | TEXT | para notificaciones |
| display_name | TEXT | opcional |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | auto-trigger |

**UNIQUE**: (strongbox_id, slot)

### recovery_contacts
2 por vault. Reclaman fondos tras inactividad prolongada del owner.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID PK | auto |
| strongbox_id | UUID FK → strongboxes | |
| slot | SMALLINT | 1 o 2 |
| address | TEXT | wallet address del recovery contact |
| email | TEXT | para notificaciones |
| display_name | TEXT | opcional |
| share_percentage | NUMERIC(5,2) | default 50.00 |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | auto-trigger |

**UNIQUE**: (strongbox_id, slot)

### withdrawal_requests
Solicitudes de retiro. Trackea aprobaciones de cada guardian.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID PK | auto |
| strongbox_id | UUID FK → strongboxes | |
| on_chain_request_id | INTEGER | id del WithdrawalRequest on-chain |
| amount | NUMERIC(28,18) | monto en wei |
| to_address | TEXT | destino del retiro |
| status | ENUM | pending_approval, approved, executed, cancelled, expired |
| guardian1_approved | BOOLEAN | default false |
| guardian2_approved | BOOLEAN | default false |
| guardian1_approved_at | TIMESTAMPTZ | |
| guardian2_approved_at | TIMESTAMPTZ | |
| executed_tx_hash | TEXT | hash de la tx de ejecucion |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | auto-trigger |

### transactions
Historial de operaciones.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID PK | auto |
| user_id | UUID FK → users | quien inicio la tx |
| strongbox_id | UUID FK → strongboxes | vault afectada |
| tx_type | ENUM | deposit, withdraw, recovery |
| status | ENUM | pending, confirmed, failed, reverted |
| chain_id | INTEGER | default 97 |
| tx_hash | TEXT | |
| from_address | TEXT | |
| to_address | TEXT | |
| amount | NUMERIC(28,18) | |
| gas_used | NUMERIC(28,18) | |
| error_message | TEXT | si fallo |
| created_at | TIMESTAMPTZ | |
| confirmed_at | TIMESTAMPTZ | |

### alerts
Notificaciones para todos los roles.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | UUID PK | auto |
| user_id | UUID FK → users | destinatario |
| priority | ENUM | low, medium, high, critical |
| title | TEXT | |
| message | TEXT | |
| category | TEXT | withdrawal_request, recovery_initiated, inactivity_warning |
| related_entity_type | TEXT | 'withdrawal_request', 'strongbox' |
| related_entity_id | UUID | |
| is_read | BOOLEAN | default false |
| created_at | TIMESTAMPTZ | |

## Enums

| Enum | Valores |
|------|---------|
| tx_type | deposit, withdraw, recovery |
| tx_status | pending, confirmed, failed, reverted |
| withdrawal_status | pending_approval, approved, executed, cancelled, expired |
| recovery_state | inactive, pending, executed |
| alert_priority | low, medium, high, critical |

## View: user_dashboard

Resumen para el dashboard del owner:

```sql
SELECT
  u.id, u.wallet_address, u.last_active_at,
  sb.contract_address, sb.balance_native, sb.time_limit_seconds,
  sb.last_activity_at, sb.recovery_state, sb.is_deployed,
  (pending_withdrawals count),
  (unread_alerts count)
FROM users u
LEFT JOIN strongboxes sb ON sb.user_id = u.id;
```

## RLS y Realtime

- **RLS habilitado** en todas las tablas (policies por definir segun el flujo de auth)
- **Realtime** en: withdrawal_requests, alerts, strongboxes
- **Auto-update** de `updated_at` via trigger en: users, strongboxes, guardians, recovery_contacts, withdrawal_requests

## SQL completo

Ver `api/supabase/migrations/20260328120000_001_initial_schema.sql`
