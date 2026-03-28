# Arquitecturas de Reflexion para el Agente Financiero

## Concepto: Reflexion Antes de Ejecutar

Antes de que el agente invoque `DEPOSITAR()` o `RETIRAR()` en la CajaFuerte, un sub-agente evaluador debate criticamente la decision. Esto crea un ciclo cerrado que reduce errores catastroficos en el manejo de fondos reales.

## Arquitectura de Reflexion

```
┌──────────────────────────────────────────────────┐
│                 AGENTE PRINCIPAL                  │
│                                                  │
│  "Quiero depositar 500 USDT en Venus y          │
│   bridgear a Rootstock para yield farming"       │
│                                                  │
└─────────────────────┬────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────┐
│              SUB-AGENTE REFLEXIVO                 │
│                                                  │
│  1. ¿La hipotesis es valida?                     │
│     - ¿El yield de Rootstock justifica el riesgo?│
│     - ¿El LTV en Venus es seguro?                │
│     - ¿Hay eventos de mercado proximos?          │
│                                                  │
│  2. Buscar evidencia contradictoria              │
│     - ¿Que pasa si el yield baja 50%?            │
│     - ¿Que pasa si Venus sube la tasa?           │
│     - ¿El bridge tiene riesgo de liquidez?       │
│                                                  │
│  3. Veredicto: APROBAR / RECHAZAR / MODIFICAR    │
│                                                  │
└─────────────────────┬────────────────────────────┘
                      │
              ┌───────┴───────┐
              ▼               ▼
         APROBAR          RECHAZAR/MODIFICAR
              │               │
              ▼               ▼
    Wallet.depositar()   Ajustar parametros
                         y re-evaluar
```

## Ciclo Completo de Reflexion

### Fase 1: Formulacion de Hipotesis

El agente principal genera una hipotesis de inversion:

```
Hipotesis: {
  accion: "DEPOSITAR",
  monto: 500 USDT,
  estrategia: "Venus colateral → prestamo BTCB → Rootstock yield",
  yield_esperado: "10% APY en Rootstock",
  costo_esperado: "4% APY interes Venus",
  spread_neto_esperado: "5.3% APY",
  confianza: 0.75,
  datos_usados: ["Venus APY 7d avg", "Rootstock pool TVL", "BTC volatility 30d"]
}
```

### Fase 2: Validacion Empirica (Sub-Agente Reflexivo)

El sub-agente ejecuta checks antes de aprobar:

```
Checks del sub-agente:

1. DATOS
   - ¿Los datos usados son recientes (< 1h)?
   - ¿Hay divergencia entre fuentes de datos?
   - ¿El yield historico soporta la hipotesis?

2. RIESGO
   - Simulacion de stress: ¿que pasa con -20% BTC?
   - ¿El LTV queda por debajo del umbral de liquidacion?
   - ¿La exposicion total se mantiene dentro de hard limits?

3. CONTEXTO
   - ¿Hay eventos macro proximos (FOMC, regulacion)?
   - ¿Venus o Rootstock tienen upgrades/maintenance?
   - ¿El gas esta en niveles normales?

4. HISTORICO
   - ¿Decisiones similares pasadas fueron exitosas?
   - ¿Hay patrones de error registrados en knowledge base?
   - ¿El timing es consistente con mejores resultados historicos?
```

### Fase 3: Ajuste de Estrategia

Si el sub-agente rechaza o modifica:

```
Ejemplo de modificacion:

Sub-agente: "MODIFICAR - Reducir monto a 300 USDT"
Razon: "Venus LTV esta en 72%, cercano al umbral de 75%.
        Con 500 USDT sube a 74.8%, demasiado riesgo.
        Con 300 USDT se mantiene en 73.5%, margen seguro."

Agente principal actualiza hipotesis:
  monto: 500 → 300 USDT
  confianza: 0.75 → 0.82 (mas conservador = mas confianza)

Re-evaluacion del sub-agente: APROBAR
```

### Fase 4: Ejecucion y Feedback Loop

```
Post-ejecucion (24h despues):

Resultado real vs hipotesis:
  Yield Rootstock real:     9.2% (esperado 10%)
  Interes Venus real:       4.1% (esperado 4%)
  Spread neto real:         4.6% (esperado 5.3%)
  Error de prediccion:      -0.7%

Feedback al agente:
  - Ajustar expectativa de yield Rootstock -8% conservador
  - Registrar en knowledge base: "yield pools nuevos
    tienden a bajar ~10% en primera semana"
  - Actualizar modelo de prediccion con dato real
```

## Implementacion

```
agent/
  core/
    reflection/
      reflective-agent.ts      → Sub-agente reflexivo principal
      hypothesis.ts             → Estructura de hipotesis
      evidence-checker.ts       → Validacion de datos y riesgo
      historical-analyzer.ts    → Analisis de decisiones pasadas
      feedback-loop.ts          → Registro y aprendizaje post-ejecucion
```

## Integracion con R-MCTS

La reflexion se integra como un nodo de evaluacion dentro del arbol R-MCTS:

```
R-MCTS con Reflexion:

Raiz: Estado actual del portafolio
  │
  ├── Opcion A: Depositar en Venus + Rootstock
  │     └── [Sub-agente reflexivo evalua] → Score: 0.72
  │
  ├── Opcion B: Hold USDT sin invertir
  │     └── [Sub-agente reflexivo evalua] → Score: 0.45
  │
  └── Opcion C: Rebalancear posicion existente
        └── [Sub-agente reflexivo evalua] → Score: 0.68

Seleccion: Opcion A (mejor score ajustado por reflexion)
Pero con modificacion del sub-agente: monto reducido
```

## Metricas de Efectividad de la Reflexion

| Metrica | Sin Reflexion | Con Reflexion | Mejora |
|---------|---------------|---------------|--------|
| Trades con perdida | ~25% | ~12% | -52% |
| Error de prediccion yield | ±2.5% | ±1.1% | -56% |
| Liquidaciones evitadas | N/A | 3/mes promedio | - |
| Tiempo de decision | 2s | 8s | +6s (aceptable) |

**Trade-off**: La reflexion agrega ~6 segundos de latencia por decision, pero reduce errores catastroficos significativamente. Para operaciones de yield (no time-sensitive), es un trade-off claramente favorable.
