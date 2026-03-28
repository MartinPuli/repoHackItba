# Dev Log — Smart Wallet Agent-First

## 2026-03-28 — Sesion 1: Setup Infraestructura

### Supabase Project
- **Proyecto creado**: `smart-wallet-hackitba`
- **Ref**: `tfatikeupkydferbcsbc`
- **Region**: us-east-1
- **URL**: https://tfatikeupkydferbcsbc.supabase.co
- **Status**: ACTIVE_HEALTHY

### Database Schema (11 tablas)

| Tabla | Proposito |
|-------|-----------|
| `users` | Usuarios vinculados a wallet address, nivel de autonomia |
| `wallets` | Contratos Wallet deployados, balances on-chain |
| `caja_fuerte` | Contratos CajaFuerte, Dead Man's Switch state |
| `herederos` | Guardianes/herederos por caja (ver migración 002: `rol` + `slot`; setup con 4 filas) |
| `transactions` | Historial completo de transacciones (deposit, withdraw, send, swap, yield, bridge, off_ramp) |
| `session_keys` | Session Keys activas/expiradas/revocadas con limites |
| `yield_positions` | Posiciones DeFi activas (Venus colateral, prestamo, Rootstock yield) |
| `agent_decisions` | Audit trail de cada decision del agente (hipotesis, reflexion, outcome) |
| `knowledge_base` | Base de conocimiento del agente (patrones, lecciones, R-MCTS) |
| `compliance_logs` | Registros de compliance UIF/CNV |
| `alerts` | Notificaciones al usuario (deadman, yield, compliance, agent) |

### Enums creados
- `autonomy_level`: asistente, copiloto, autonomo
- `tx_type`: deposit, withdraw, send, swap, yield_deposit, yield_withdraw, bridge, off_ramp
- `tx_status`: pending, confirmed, failed, reverted
- `agent_action_type`: analysis, suggestion, prepare_tx, execute_tx, compliance_check, rebalance, yield_optimize, reset_deadman, alert
- `alert_priority`: low, medium, high, critical
- `recovery_state`: inactive, pending, executed
- `session_key_status`: active, expired, revoked

### Features de DB configuradas
- **RLS**: Habilitado en todas las tablas con policies por usuario
- **Realtime**: Habilitado en transactions, alerts, agent_decisions, yield_positions, session_keys, caja_fuerte
- **Triggers**: Auto-update de `updated_at` en tablas principales
- **Funcion**: `expire_session_keys()` para expirar keys automaticamente
- **View**: `user_dashboard` — resumen completo del usuario (balances, deadman status, alerts, yield)
- **Indices**: Optimizados para queries frecuentes (user_id, status, created_at DESC, tx_hash)

### .env actualizado
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurados
- `SUPABASE_SERVICE_ROLE_KEY` para operaciones del agente/backend

### Repos clonados (por el usuario)
- `TradingAgents` — Framework multi-agente de trading
- `goat-sdk/goat` — Plugins para interaccion agente <> DeFi
- `coinbase/smart-wallet` — Patron de referencia ERC-4337
- `Multi-Agent-AI-Finance-Assistant` — Algoritmos financieros + LLM

### Documentacion leida
- CLAUDE.md, README.md
- RUBRICA-HACKITBA.md (47 pts total, UI vale 8 pts, MVP vale 10 pts)
- UI-COMPONENTES-21ST.md (glassmorphism, dark mode, 21st.dev components)
- UX-AUTONOMIA.md (slider 3 niveles, kill switch, activity feed)
- INTEGRACION-CONTRATOS.md (Factory, Wallet, CajaFuerte, Session Keys)
- AGENTE-AUTONOMO.md (AutoResearch, R-MCTS, COPPER multi-agent)
- REFLEXION-AGENTE.md (sub-agente reflexivo pre-ejecucion)
- SEGURIDAD-HERENCIA.md (replay protection, timelock, reentrancy guard)
- AGENTIC-COMMERCE.md (Stripe ACP, PayPal AP2, Payment Router)
- UNIT-ECONOMICS.md (yield spread 5.3%, performance fee 15%, break-even 10K users)

### Proximos pasos
- [ ] Analizar repos clonados (agentes explorando en background)
- [ ] Inicializar Next.js 14 con Wagmi, Viem, TailwindCSS, Supabase client
- [ ] Crear smart contracts (Factory, Wallet, CajaFuerte) basados en patrones de coinbase/smart-wallet
- [ ] Construir componentes UI (AutonomySlider, KillSwitch, Dashboard, ActivityFeed)
- [ ] Deploy a Vercel
- [ ] Tests con Playwright

---

## 2026-03-28 — API: auth Web3 y StrongBox lógico

### Cambios en `api/`

- **Auth HTTP**: eliminados `POST /api/auth/register` y `POST /api/auth/login`. Login con **MetaMask + Supabase** en el frontend; el backend solo valida **JWT** (`requireAuth`).
- **`GET /api/auth/me`**: upsert de `public.users` con wallet desde metadata del JWT; respuesta incluye **`has_strongbox`**.
- **StrongBox setup**: `POST /api/strongbox/setup` crea **`caja_fuerte`** lógica (`wallet_id` / `contract_address` null, `is_deployed: false`) y **4** filas en **`herederos`** (2× `guardian`, 2× `heir`), con `wallet` + `email`; actualiza `users.email` con `own_email`.
- **Herederos (rutas viejas)**: eliminados `POST/GET /api/herederos` — ver `api/docs/HEREDEROS-BACKEND.md`.

### Migración `002_web3_strongbox.sql`

- `caja_fuerte`: `wallet_id` y `contract_address` **nullable** (caja antes del deploy on-chain).
- `herederos`: columnas **`email`**, **`rol`** (`guardian` | `heir`); `UNIQUE (caja_fuerte_id, rol, slot)`.

### Documentación

- `docs/API.md`, `docs/SUPABASE-SCHEMA.md`, `api/docs/HEREDEROS-BACKEND.md`, `api/http/api.http` alineados al flujo nuevo.
