# Dev Log — StrongBox

## 2026-03-28 — Sesion 1: Setup Infraestructura

### Supabase Project
- **Proyecto creado**: `smart-wallet-hackitba`
- **Ref**: `tfatikeupkydferbcsbc`
- **Region**: us-east-1
- **URL**: https://tfatikeupkydferbcsbc.supabase.co
- **Status**: ACTIVE_HEALTHY

### Database Schema

| Tabla | Proposito |
|-------|-----------|
| `users` | Usuarios vinculados a wallet address |
| `strongboxes` | Vaults deployadas, balance, timer de inactividad, recovery state |
| `guardians` | 2 guardianes por vault (aprueban retiros) |
| `recovery_contacts` | 2 recovery contacts por vault (recuperan fondos tras inactividad) |
| `withdrawal_requests` | Solicitudes de retiro con estado de aprobacion |
| `transactions` | Historial de transacciones (deposit, withdraw, recovery) |
| `alerts` | Notificaciones (retiros pendientes, recovery, inactividad) |

### Features de DB configuradas
- **RLS**: Habilitado en todas las tablas
- **Realtime**: withdrawal_requests, alerts, strongboxes
- **Triggers**: Auto-update de `updated_at`
- **View**: `user_dashboard` — resumen del usuario (balance, recovery state, pending withdrawals, alerts)

---

## 2026-03-28 — Sesion 2: API Auth y StrongBox Setup

### Cambios en `api/`
- **Auth**: MetaMask + Supabase Web3 login. Backend valida JWT.
- **`GET /api/auth/me`**: upsert de `users` con wallet; respuesta incluye `has_strongbox`.
- **`POST /api/strongbox/setup`**: crea strongbox logica en DB + 2 guardianes + 2 recovery contacts.

---

## 2026-03-28 — Sesion 3: Limpieza de proyecto

### Cambio de vision
Proyecto pivoteo de "Smart Wallet Agent-First" a **StrongBox**: caja fuerte no custodial con guardianes y recovery contacts.

### Eliminado
- `agent/` — logica de agente AI
- `mcp-server/` — MCP server completo
- `autoresearch-skill/` — skill de autoresearch
- `goat/`, `TradingAgents/`, `Multi-Agent-AI-Finance-Assistant/`, `smart-wallet/` — repos de referencia
- `scripts/`, `.artifacts/`, `.gsd/` — archivos viejos
- Docs: AGENTE-AUTONOMO, AGENTIC-COMMERCE, REFLEXION-AGENTE, REPOS-REFERENCIA, UX-AUTONOMIA, UI-COMPONENTES-21ST, UNIT-ECONOMICS, HACKATHON-PLAN

### Actualizado
- CLAUDE.md, README.md, INTEGRACION-CONTRATOS.md, SEGURIDAD-HERENCIA.md, SUPABASE-SCHEMA.md, API.md, RUBRICA-HACKITBA.md — todo alineado a la nueva vision StrongBox

---

## 2026-03-28 — Sesion 4: Schema unificado (strongboxes)

### Source of truth
- Migracion: `api/supabase/migrations/20260328120000_001_initial_schema.sql`
- Tablas: `users`, `strongboxes`, `guardians`, `recovery_contacts`, `withdrawal_requests`, `transactions`, `alerts`

### Backend
- `deployService` / `depositService`: tablas y FK alineadas (`strongboxes`, `strongbox_id` en `transactions`).
- `POST /api/strongbox/setup`: acepta `recovery_contacts` o alias `heirs` en el JSON.
- `GET /api/strongbox/balance`: si `is_deployed` y hay `contract_address`, balance via RPC (`RPC_URL`); si no, mock deterministico.
- Alias de ruta: `GET /api/caja-fuerte/balance` (mismo handler).

### Frontend
- `useSupabase.ts`: consulta `strongboxes`, `guardians`, `recovery_contacts`; eliminados hooks que apuntaban a tablas inexistentes (`wallets`, `agent_decisions`, etc.).
- API client: `GET /api/strongbox/balance`, body de setup con `recovery_contacts`.

### Supabase local: reset de DB
Requiere Docker. Desde `api/`:

```bash
npx supabase db reset --local
```

Si falla por Docker apagado, levantar Docker Desktop y reintentar. Para proyecto remoto, aplicar migraciones con el flujo de equipo (`db push` / SQL editor) segun corresponda.
