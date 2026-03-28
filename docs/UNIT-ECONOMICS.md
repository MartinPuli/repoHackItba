# Unit Economics — Modelo de Rentabilidad

## Yield Stripping: El Motor de Ingresos

### Mecanica del Spread Venus → Rootstock

```
Flujo de capital:
  Usuario deposita USDT en CajaFuerte
      │
      ▼
  [Venus Protocol - BSC]
  Depositar USDT como colateral
  Tomar prestamo BTCB a tasa variable
  Tasa de prestamo: ~3-5% APY (variable)
      │
      ▼
  [Bridge BSC → Rootstock]
  BTCB → rBTC
  Costo de bridge: ~$0.50-2.00 por operacion
      │
      ▼
  [Yield Farming - Rootstock]
  rBTC en pools de rendimiento
  Rendimiento: ~8-15% APY (variable)
      │
      ▼
  SPREAD NETO = Yield Rootstock - Interes Venus - Gas - Bridge
  Ejemplo: 10% - 4% - 0.5% - 0.2% = 5.3% APY neto
```

### Performance Fee

```
Distribucion del yield neto:
  ├── 80% → Usuario (rendimiento neto para el usuario)
  ├── 15% → Protocolo (revenue del proyecto)
  └── 5%  → Agente (incentivo por optimizacion)

Ejemplo con $10,000 depositados:
  Yield bruto Rootstock: $1,000 (10% APY)
  Costo Venus:           -$400  (4% APY)
  Gas + Bridge:          -$70   (estimado anual)
  Yield neto:            $530   (5.3% APY)

  Usuario recibe:    $424  (4.24% APY neto)
  Protocolo recibe:  $79.5
  Agente recibe:     $26.5
```

## Paymaster: Subsidio de Gas

### Modelo de Negocio

```
Flujo:
  Usuario quiere ejecutar tx pero no tiene BNB para gas
      │
      ▼
  [Paymaster Contract]
  Paga el gas en BNB al bundler
  Cobra al usuario en stablecoins (USDT/BUSD) o ARS equivalente
  Aplica markup sobre el costo real del gas
      │
      ▼
  Markup = 10-20% sobre gas real

Ejemplo:
  Gas real de tx:         $0.05 (en BNB)
  Cobro al usuario:      $0.06 (en USDT, 20% markup)
  Revenue por tx:         $0.01
  Volumen 1000 tx/dia:   $10/dia = $300/mes
```

### Ventaja Competitiva

- El usuario NUNCA necesita comprar BNB
- Experiencia similar a Web2 (pago invisible en el token que ya tiene)
- El agente optimiza batching de transacciones para reducir gas total

## Off-Ramp: Crypto → ARS via QR

### Spread de Conversion

```
Flujo:
  Usuario quiere pagar en comercio con QR
      │
      ▼
  [Agente calcula mejor ruta]
  Evalua: USDT→ARS directo vs USDT→DAI→ARS vs otras rutas
      │
      ▼
  [Wallet.enviar() → Contrato Off-Ramp]
  Conversion crypto → ARS
  Spread aplicado: 1-2% sobre tipo de cambio
      │
      ▼
  [QR generado para el comercio]
  Comercio recibe ARS en su cuenta bancaria

Ejemplo:
  Monto a pagar:          10,000 ARS
  TC crypto/ARS real:     1 USDT = 1,200 ARS
  TC aplicado al usuario: 1 USDT = 1,188 ARS (1% spread)
  Revenue por operacion:  ~83.3 ARS ($0.07 USD)
```

## Metricas Clave por Usuario

### Customer Acquisition Cost (CAC)
- Gas de deploy Factory + Wallet + CajaFuerte: ~$2-5
- Subsidio Paymaster primeras N transacciones: ~$1-2
- **CAC estimado: $3-7 por usuario**

### Lifetime Value (LTV)

```
Supuestos:
  Deposito promedio:     $500 USD
  Permanencia promedio:  12 meses
  Txs/mes promedio:      20

Revenue por usuario/mes:
  Yield spread:    $500 * 5.3% * 15% / 12 = $0.33/mes
  Paymaster:       20 tx * $0.01 = $0.20/mes
  Off-ramp:        5 pagos QR * $0.07 = $0.35/mes
  Total:           $0.88/mes

LTV (12 meses):    $10.56
LTV/CAC ratio:     ~1.5-3.5x (saludable para fintech early-stage)
```

### Payback Period

```
CAC / Revenue mensual = Payback
$5 / $0.88 = 5.7 meses

Con optimizacion de gas del agente (reduccion 20-30%):
  Paymaster revenue sube (menor costo, mismo cobro)
  Payback estimado: 4-5 meses
```

## Impacto de Optimizacion de Gas en Unit Economics

```
Sin optimizacion:
  Gas promedio por tx:       $0.05
  Costo gas mensual (20 tx): $1.00
  Net margin por usuario:    $0.88 - overhead

Con optimizacion del agente (batching, timing):
  Gas promedio por tx:       $0.035 (-30%)
  Costo gas mensual (20 tx): $0.70
  Ahorro mensual:            $0.30 por usuario
  A 1000 usuarios:           $300/mes ahorrados

El agente AutoResearch optimiza el timing de transacciones
para ejecutar cuando el gas es mas barato (off-peak hours).
```

## Escenarios de Escala

| Usuarios | Depositos Totales | Revenue Mensual | Break-even |
|----------|-------------------|-----------------|------------|
| 100      | $50,000           | $88             | No         |
| 1,000    | $500,000          | $880            | Marginal   |
| 10,000   | $5,000,000        | $8,800          | Si         |
| 50,000   | $25,000,000       | $44,000         | Rentable   |

**Nota**: Estos son estimados conservadores. El yield spread real depende de condiciones de mercado y la eficiencia del agente optimizando las tasas.
