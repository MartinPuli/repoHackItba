# Lending Marketplace Hibrido — Design Spec

## Resumen

Transformar el lending engine actual (protocolo centralizado tipo Venus) en un **marketplace hibrido** donde los usuarios se prestan entre si. Combina un **pool compartido** para tokens liquidos con un **order book P2P** para ofertas custom. Incluye **trazabilidad on-chain** para due diligence y **liquidadores externos** estilo Aave.

---

## Arquitectura General

```
┌───────────────────────────────────────────────────────────┐
│                   LENDING MARKETPLACE                      │
│                                                            │
│  ┌─────────────────────┐    ┌───────────────────────────┐  │
│  │   POOL COMPARTIDO   │    │     ORDER BOOK P2P        │  │
│  │  (USDT, USDC, BUSD) │    │   (cualquier token)       │  │
│  │                      │    │                           │  │
│  │  - Depositar al pool │    │  - Prestamista publica    │  │
│  │  - Retirar del pool  │    │    oferta (tasa, LTV,     │  │
│  │  - Tasas algoritmicas│    │    plazo, token)           │  │
│  │    con piso/techo    │    │  - Prestatario acepta     │  │
│  │    (2% - 15% APY)   │    │    tal cual (no negociable)│  │
│  └──────────┬───────────┘    └─────────────┬─────────────┘  │
│             │                              │                │
│             └──────────┬───────────────────┘                │
│                        ▼                                    │
│           ┌────────────────────────┐                        │
│           │     TRAZABILIDAD       │                        │
│           │  - Historial wallet    │                        │
│           │  - Volumen/frecuencia  │                        │
│           │  - Repagos anteriores  │                        │
│           │  - Agente compliance   │                        │
│           └────────────┬───────────┘                        │
│                        ▼                                    │
│           ┌────────────────────────┐                        │
│           │  LIQUIDADORES EXTERNOS │                        │
│           │  - Cualquier usuario   │                        │
│           │  - Bonus 5% colateral  │                        │
│           │  - Health factor < 1   │                        │
│           └────────────────────────┘                        │
└───────────────────────────────────────────────────────────┘
```

---

## 1. Pool Compartido

### Concepto
Pool de liquidez compartido para tokens de alta demanda (USDT, USDC, BUSD). Los prestamistas depositan fondos en el pool y ganan interes. Los prestatarios toman del pool poniendo colateral.

### Curva de Tasas por Utilizacion

La tasa de interes se ajusta automaticamente segun el % del pool que esta prestado:

```
Tasa APY
  15% ─────────────────────────────────────── TECHO
   │                                    ╱
   │                                 ╱
   │                              ╱  ← Kink (80% utilizacion)
   │                           ╱
   │                        ╱
   │  ─────────────────╱
   2% ─────────────────────────────────────── PISO
       0%   20%   40%   60%   80%   100%
                Utilizacion del Pool
```

**Parametros de la curva:**
- **Piso (base_rate)**: 2% APY — tasa minima cuando hay poca demanda
- **Techo (max_rate)**: 15% APY — tasa maxima cuando el pool esta casi vacio
- **Kink**: 80% utilizacion — punto donde la pendiente se empina drasticamente
- **Slope 1** (0-80%): Incremento gradual de 2% a 6%
- **Slope 2** (80-100%): Incremento agresivo de 6% a 15%

**Formula:**
```
Si utilizacion <= 80%:
  tasa = base_rate + (utilizacion / kink) * slope1
  tasa = 2% + (utilizacion / 0.8) * 4% → rango [2%, 6%]

Si utilizacion > 80%:
  tasa = 6% + ((utilizacion - kink) / (1 - kink)) * slope2
  tasa = 6% + ((utilizacion - 0.8) / 0.2) * 9% → rango [6%, 15%]
```

**Distribucion de intereses al pool:**
- 85% para los depositantes (supply APY)
- 10% para el protocolo (revenue)
- 5% para el fondo de reserva (cubre bad debt)

### Operaciones del Pool

| Operacion | Descripcion | Restricciones |
|-----------|-------------|---------------|
| `pool_deposit` | Depositar tokens al pool | Min $10 USD equivalente |
| `pool_withdraw` | Retirar tokens + interes ganado | Sujeto a liquidez disponible |
| `pool_borrow` | Pedir prestado del pool con colateral | LTV segun token de colateral |
| `pool_repay` | Repagar deuda al pool (parcial o total) | Devuelve colateral si repago total |
| `pool_status` | Ver estado del pool (TVL, utilizacion, tasas) | Publico |

### Modelo de Datos — Pool

```javascript
// Pool state (por token)
{
  token: "USDT",
  total_deposits: "500000",        // Total depositado
  total_borrowed: "350000",        // Total prestado
  utilization: 0.70,               // 350k/500k = 70%
  supply_apy: "3.57%",            // Lo que ganan depositantes
  borrow_apy: "4.80%",            // Lo que pagan prestatarios
  reserve: "25000",                // Fondo de reserva
  last_updated: "2026-03-28T..."
}

// Deposito de usuario en pool
{
  id: UUID,
  wallet_address: "0x...",
  token: "USDT",
  amount: "10000",                 // Depositado
  shares: "9850",                  // Shares del pool (para calcular interes acumulado)
  deposited_at: "2026-03-28T...",
  status: "active"
}
```

---

## 2. Order Book P2P

### Concepto
Prestamistas publican ofertas de prestamo con condiciones fijas. Prestatarios navegan ofertas y aceptan la que les conviene. No hay negociacion — take-it-or-leave-it.

### Flujo

```
Prestamista                          Prestatario
    │                                     │
    ├── Crea oferta ──────────────────►   │
    │   (token, monto, tasa,              │
    │    LTV, plazo, colateral             │
    │    aceptado)                         │
    │                                     │
    │   ◄── Consulta trazabilidad ────────┤
    │       de wallet del prestatario      │
    │                                     │
    │   ◄── Acepta oferta ────────────────┤
    │       (bloquea colateral)            │
    │                                     │
    │   Fondos transferidos ──────────►   │
    │                                     │
    │   ◄── Repaga (parcial/total) ───────┤
    │                                     │
    │   Colateral devuelto ◄──────────    │
    └─────────────────────────────────────┘
```

### Estructura de una Oferta P2P

```javascript
{
  id: UUID,
  lender_wallet: "0x...",            // Quien presta
  offer_token: "USDT",               // Token que presta
  offer_amount: "5000",              // Cuanto presta
  remaining_amount: "5000",          // Cuanto queda disponible
  interest_rate: 6.5,                // APY fijo
  max_ltv: 0.70,                     // LTV maximo aceptado
  accepted_collateral: ["BNB", "rBTC"],  // Tokens de colateral aceptados
  min_collateral_usd: 100,           // Minimo de colateral en USD
  duration_days: 90,                 // Plazo maximo en dias
  status: "open" | "filled" | "cancelled" | "expired",
  created_at: "2026-03-28T...",
  expires_at: "2026-04-27T...",      // Expiracion de la oferta
}
```

### Operaciones P2P

| Operacion | Descripcion | Quien |
|-----------|-------------|-------|
| `p2p_create_offer` | Publicar oferta de prestamo | Prestamista |
| `p2p_list_offers` | Listar ofertas disponibles (filtrar por token, tasa, etc) | Cualquiera |
| `p2p_accept_offer` | Aceptar una oferta, bloquear colateral | Prestatario |
| `p2p_cancel_offer` | Cancelar oferta abierta | Prestamista |
| `p2p_repay` | Repagar prestamo P2P | Prestatario |
| `p2p_my_offers` | Ver mis ofertas publicadas | Prestamista |
| `p2p_my_loans` | Ver mis prestamos tomados | Prestatario |

---

## 3. Trazabilidad — Due Diligence On-Chain

### Concepto
Antes de prestar (pool o P2P), el prestamista o el agente de compliance puede consultar el historial de la wallet del prestatario para evaluar riesgo. Solo datos on-chain, sin datos personales.

### Datos de Trazabilidad

```javascript
{
  wallet_address: "0x...",

  // Actividad general
  total_transactions: 245,
  first_transaction: "2025-11-15T...",
  last_transaction: "2026-03-27T...",
  wallet_age_days: 133,

  // Volumenes
  total_volume_usd: "125,340.00",
  avg_monthly_volume_usd: "28,500.00",

  // Historial de prestamos
  loans_taken: 5,
  loans_repaid: 4,
  loans_defaulted: 0,
  loans_active: 1,
  repayment_rate: "100%",           // 4/4 completados sin default
  avg_repayment_days: 45,           // Promedio de dias para repagar

  // Liquidaciones
  times_liquidated: 0,

  // Actividad en la plataforma
  platform_member_since: "2025-12-01T...",
  total_deposits: "50,000 USDT",
  total_withdrawals: "35,000 USDT",
  current_balances: { USDT: "15000", BNB: "5.2" },

  // Score calculado
  risk_score: "low",                // low | medium | high | very_high
  risk_factors: [
    "Historial de repago impecable",
    "Wallet activa hace 133 dias",
    "Volumen mensual consistente"
  ]
}
```

### Risk Score — Calculo

El risk score se calcula automaticamente basado en factores on-chain:

| Factor | Peso | Criterio |
|--------|------|----------|
| Repayment rate | 30% | 100% = low, >80% = medium, <80% = high |
| Wallet age | 15% | >180d = low, >90d = medium, <90d = high |
| Liquidation history | 20% | 0 = low, 1 = medium, >1 = high |
| Transaction volume | 15% | >$10k/mes = low, >$1k = medium, <$1k = high |
| Active loans ratio | 10% | <3 activos = low, <5 = medium, >5 = high |
| Platform tenure | 10% | >6 meses = low, >3 = medium, <3 = high |

**Score final:**
- `low`: Promedio ponderado < 0.3
- `medium`: 0.3 - 0.6
- `high`: 0.6 - 0.8
- `very_high`: > 0.8

### Operaciones de Trazabilidad

| Operacion | Descripcion |
|-----------|-------------|
| `trace_wallet` | Consultar historial y risk score de una wallet |
| `trace_transactions` | Ver ultimas N transacciones de una wallet |
| `trace_loan_history` | Ver historial de prestamos de una wallet |

### Integracion con Compliance Agent

El agente de compliance usa la trazabilidad automaticamente:
1. Antes de aprobar un prestamo P2P, consulta `trace_wallet` del prestatario
2. Si risk_score es `high` o `very_high`, bloquea la operacion o alerta al prestamista
3. El prestamista puede consultar manualmente el perfil de cualquier wallet

---

## 4. Liquidadores Externos (Aave-style)

### Concepto
Cuando un prestamo (pool o P2P) tiene health factor < 1.0, cualquier usuario puede liquidar la posicion. El liquidador repaga parte de la deuda y recibe colateral con un 5% de bonus.

### Mecanismo

```
Posicion insalubre (HF < 1.0):
  Deuda: 10,000 USDT
  Colateral: 2 BNB ($12,000)
  HF: 0.95

Liquidador:
  1. Repaga hasta 50% de la deuda → 5,000 USDT
  2. Recibe colateral equivalente + 5% bonus
     → 5,000 / 600 = 8.33 BNB equivalente
     → + 5% bonus = 8.33 * 1.05 = 8.75 BNB
  3. Profit del liquidador: 0.42 BNB (~$250)

Post-liquidacion:
  Deuda restante: 5,000 USDT
  Colateral restante: 2 - 0.875 = 1.125 BNB ($675) [ajustado]
  Nuevo HF: recalculado
```

**Reglas:**
- Solo liquidable cuando health factor < 1.0
- Maximo liquidable: 50% de la deuda en una sola transaccion
- Bonus del liquidador: 5% del colateral (configurable)
- El prestamo queda activo con deuda/colateral reducidos si no se liquida todo
- Si despues de la liquidacion parcial el HF sigue < 1.0, se puede liquidar de nuevo

### Operaciones de Liquidacion

| Operacion | Descripcion |
|-----------|-------------|
| `liquidation_opportunities` | Listar posiciones liquidables (HF < 1.0) |
| `liquidate` | Ejecutar liquidacion de una posicion |
| `liquidation_history` | Ver historial de liquidaciones |

### Modelo de Datos — Liquidacion

```javascript
{
  id: UUID,
  loan_id: "loan_xxx",              // Prestamo liquidado
  borrower_wallet: "0x...",
  liquidator_wallet: "0x...",
  debt_repaid: "5000",
  debt_token: "USDT",
  collateral_seized: "0.875",
  collateral_token: "BNB",
  bonus_amount: "0.042",            // 5% del colateral
  health_factor_before: 0.95,
  health_factor_after: 1.15,
  created_at: "2026-03-28T..."
}
```

---

## 5. Nuevas MCP Tools

Reemplazar los 4 tools actuales (`loan_options`, `loan_take`, `loan_repay`, `loan_status`) por un set expandido de 16 tools:

### Pool (6 tools)
| Tool | Schema |
|------|--------|
| `pool_deposit` | `{ wallet_address, token, amount }` |
| `pool_withdraw` | `{ wallet_address, token, amount_or_all }` |
| `pool_borrow` | `{ wallet_address, collateral_token, collateral_amount, borrow_token, borrow_amount }` |
| `pool_repay` | `{ wallet_address, amount_or_all }` |
| `pool_status` | `{ token? }` — estado global del pool |
| `pool_my_position` | `{ wallet_address }` — mis depositos y deudas en el pool |

### P2P (7 tools)
| Tool | Schema |
|------|--------|
| `p2p_create_offer` | `{ wallet_address, token, amount, interest_rate, max_ltv, accepted_collateral[], duration_days }` |
| `p2p_list_offers` | `{ token?, min_amount?, max_rate?, collateral_token? }` |
| `p2p_accept_offer` | `{ wallet_address, offer_id, collateral_token, collateral_amount }` |
| `p2p_cancel_offer` | `{ wallet_address, offer_id }` |
| `p2p_repay` | `{ wallet_address, loan_id, amount_or_all }` |
| `p2p_my_offers` | `{ wallet_address }` |
| `p2p_my_loans` | `{ wallet_address }` |

### Trazabilidad (3 tools)
| Tool | Schema |
|------|--------|
| `trace_wallet` | `{ wallet_address }` — perfil completo + risk score |
| `trace_transactions` | `{ wallet_address, limit?, offset? }` |
| `trace_loan_history` | `{ wallet_address }` |

### Liquidacion (3 tools — nuevos, no reemplazan nada)
| Tool | Schema |
|------|--------|
| `liquidation_opportunities` | `{}` — posiciones con HF < 1.0 |
| `liquidate` | `{ liquidator_wallet, loan_id, amount }` |
| `liquidation_history` | `{ wallet_address? }` |

---

## 6. Modelo de Datos Completo

### Tablas Nuevas

```sql
-- Pool state por token
pool_state {
  token TEXT PRIMARY KEY,
  total_deposits DECIMAL,
  total_borrowed DECIMAL,
  reserve DECIMAL,
  last_rate_update TIMESTAMP
}

-- Depositos de usuarios en el pool
pool_deposits {
  id UUID PRIMARY KEY,
  wallet_address TEXT,
  token TEXT,
  amount DECIMAL,
  shares DECIMAL,
  created_at TIMESTAMP,
  status TEXT  -- active | withdrawn
}

-- Ofertas P2P
p2p_offers {
  id UUID PRIMARY KEY,
  lender_wallet TEXT,
  offer_token TEXT,
  offer_amount DECIMAL,
  remaining_amount DECIMAL,
  interest_rate DECIMAL,
  max_ltv DECIMAL,
  accepted_collateral TEXT[],
  min_collateral_usd DECIMAL,
  duration_days INTEGER,
  status TEXT,  -- open | filled | cancelled | expired
  created_at TIMESTAMP,
  expires_at TIMESTAMP
}

-- Prestamos activos (pool + P2P)
loans {
  id UUID PRIMARY KEY,
  type TEXT,  -- pool | p2p
  borrower_wallet TEXT,
  lender_wallet TEXT,        -- NULL para pool, wallet para P2P
  offer_id UUID,             -- NULL para pool, ref a p2p_offers para P2P
  borrow_token TEXT,
  borrow_amount DECIMAL,
  collateral_token TEXT,
  collateral_amount DECIMAL,
  interest_rate DECIMAL,
  ltv_at_origination DECIMAL,
  liquidation_threshold DECIMAL,
  duration_days INTEGER,     -- NULL para pool (indefinido), fijo para P2P
  status TEXT,  -- active | repaid | liquidated | defaulted
  created_at TIMESTAMP,
  closed_at TIMESTAMP
}

-- Historial de liquidaciones
liquidations {
  id UUID PRIMARY KEY,
  loan_id UUID,
  borrower_wallet TEXT,
  liquidator_wallet TEXT,
  debt_repaid DECIMAL,
  debt_token TEXT,
  collateral_seized DECIMAL,
  collateral_token TEXT,
  bonus_amount DECIMAL,
  health_factor_before DECIMAL,
  health_factor_after DECIMAL,
  created_at TIMESTAMP
}
```

### Tablas Existentes Modificadas

- `transactions`: Agregar tipos `pool_deposit`, `pool_withdraw`, `p2p_lend`, `p2p_repay`, `liquidation`
- `investments`: Se migra a la nueva tabla `loans` para pool y P2P

---

## 7. Integracion con Agent Orchestrator

### Nuevos Intent Patterns

```javascript
// Pool
{ patterns: ["depositar al pool", "prestar al pool", "ganar interes", "supply"],
  tool: "pool_deposit" },
{ patterns: ["retirar del pool", "sacar del pool"],
  tool: "pool_withdraw" },
{ patterns: ["pedir prestado", "necesito plata", "prestamo del pool"],
  tool: "pool_borrow" },

// P2P
{ patterns: ["crear oferta", "quiero prestar", "publicar prestamo"],
  tool: "p2p_create_offer" },
{ patterns: ["ver ofertas", "buscar prestamos", "marketplace"],
  tool: "p2p_list_offers" },
{ patterns: ["aceptar oferta", "tomar prestamo p2p"],
  tool: "p2p_accept_offer" },

// Trazabilidad
{ patterns: ["investigar wallet", "historial de", "quien es", "trazabilidad", "due diligence"],
  tool: "trace_wallet" },

// Liquidacion
{ patterns: ["oportunidades de liquidacion", "posiciones liquidables"],
  tool: "liquidation_opportunities" },
{ patterns: ["liquidar posicion", "liquidar prestamo"],
  tool: "liquidate" },
```

---

## 8. Migracion del Sistema Actual

### Que se mantiene
- LTV ratios por token
- Precios mock (MOCK_PRICES)
- Estructura de health factor y liquidation threshold
- Integracion con compliance engine
- Integracion con database.js (Supabase + in-memory fallback)

### Que cambia
- `LendingEngine` se refactoriza en 4 modulos:
  - `PoolEngine` — logica del pool compartido
  - `P2PEngine` — logica del order book
  - `TraceEngine` — trazabilidad y risk scoring
  - `LiquidationEngine` — motor de liquidaciones
- Los 4 MCP tools actuales se reemplazan por 16 nuevos (retrocompatibilidad no requerida, es hackathon)
- La tabla `investments` con type `loan` migra a la nueva tabla `loans`

### Archivos a Crear/Modificar

| Archivo | Accion |
|---------|--------|
| `mcp-server/src/tools/pool-engine.js` | Crear — logica del pool |
| `mcp-server/src/tools/p2p-engine.js` | Crear — logica P2P |
| `mcp-server/src/tools/trace-engine.js` | Crear — trazabilidad |
| `mcp-server/src/tools/liquidation-engine.js` | Crear — liquidaciones |
| `mcp-server/src/tools/lending-engine.js` | Eliminar o deprecar |
| `mcp-server/src/index.js` | Modificar — registrar 16 nuevos tools |
| `mcp-server/src/tools/agent-orchestrator.js` | Modificar — nuevos intents |
| `mcp-server/src/db/database.js` | Modificar — nuevas tablas |

---

## 9. Configuracion Global

```javascript
const MARKETPLACE_CONFIG = {
  pool: {
    supported_tokens: ["USDT", "USDC", "BUSD"],
    base_rate: 2.0,          // Piso: 2% APY
    max_rate: 15.0,          // Techo: 15% APY
    kink: 0.80,              // Punto de inflexion: 80%
    slope1: 4.0,             // Pendiente antes del kink
    slope2: 9.0,             // Pendiente despues del kink
    protocol_fee: 0.10,      // 10% de intereses para protocolo
    reserve_fee: 0.05,       // 5% para fondo de reserva
    min_deposit_usd: 10,
  },
  p2p: {
    min_offer_usd: 50,
    max_offer_duration_days: 365,
    default_expiry_days: 30,
  },
  liquidation: {
    bonus: 0.05,             // 5% bonus al liquidador
    max_liquidation_pct: 0.50, // Max 50% de deuda por liquidacion
    health_factor_threshold: 1.0,
  },
  ltv: {
    BNB: 0.65, USDT: 0.80, USDC: 0.80, BUSD: 0.80, rBTC: 0.60,
  },
  liquidation_threshold: {
    BNB: 0.75, USDT: 0.90, USDC: 0.90, BUSD: 0.90, rBTC: 0.70,
  },
};
```

---

## 10. Scope para Hackathon

### MVP (implementar)
- Pool engine con curva de tasas funcional
- P2P engine con create/list/accept ofertas
- Trazabilidad basica (historial de transacciones + risk score simple)
- Liquidacion: listar oportunidades + ejecutar liquidacion
- 16 MCP tools registrados
- Agent orchestrator con nuevos intents

### Post-hackathon (no implementar ahora)
- Smart contracts on-chain para pool y P2P
- Oraculo de precios real (Chainlink)
- Liquidation bots automaticos
- Gobernanza de parametros del pool
- Flash loans
