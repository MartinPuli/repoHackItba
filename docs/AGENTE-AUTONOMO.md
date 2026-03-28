# Aprendizaje Autonomo del Agente AI

## Estrategias de Auto-Mejora

### 1. Bucle AutoResearch (Inspirado en Karpathy)

El agente opera en un ciclo autonomo continuo para optimizar estrategias financieras:

```
loop {
  1. Editar parametros de estrategia (tasas, umbrales de riesgo, allocations)
  2. Ejecutar simulacion corta (~5 min) en testnet/entorno aislado
  3. Evaluar metrica de exito (APY neto, Sharpe ratio, drawdown)
  4. Si mejoro → conservar cambios, sino → revertir
  5. Repetir
}
```

**Aplicacion concreta**: El motor de yield ejecuta simulaciones continuas sobre tasas de Venus (BSC) y Rootstock, ajustando iterativamente sus parametros de riesgo hasta encontrar la estrategia optima antes de ejecutar en mainnet.

**Implementacion**:
- Archivo: `agent/core/auto-research-loop.ts`
- Ambiente de simulacion aislado con fork de testnet
- Metricas persistidas en base local para tracking historico
- Guardrails: limites maximos de riesgo que no pueden ser modificados por el loop

### 2. Busqueda de Arbol de Monte Carlo Reflexiva (R-MCTS)

Algoritmo para explorar espacios de decisiones complejos en tiempo real:

```
R-MCTS Pipeline:
  1. Generar arbol de decisiones posibles (ej: swap USDT→rBTC, hold, rebalancear)
  2. Simular cada rama con datos historicos + condiciones actuales
  3. Aplicar "reflexion contrastiva" → aprender de errores previos
  4. Seleccionar rama con mejor expectativa ajustada por riesgo
  5. Auto-entrenar con los resultados para mejorar futuras decisiones
```

**Beneficios**:
- Hasta 30% mejora en tareas complejas de decision sin supervision humana
- El agente NO repite errores (ej: si un trade de CEDEARs en IOL fue suboptimo, lo registra y ajusta)
- Conocimiento acumulado se usa para fine-tuning continuo

**Implementacion**:
- Archivo: `agent/core/r-mcts-engine.ts`
- Arbol de decisiones con profundidad configurable (default: 5 niveles)
- Base de conocimiento de errores/exitos en `agent/utils/knowledge-base.ts`

### 3. Reflexion Multi-Agente (Framework COPPER)

Los agentes especializados debaten entre si para llegar a mejores conclusiones:

```
Agentes participantes:
  - Compliance Agent  → evalua riesgo regulatorio (UIF/CNV)
  - Inversion Agent   → propone estrategias de yield
  - Risk Agent        → evalua exposicion y drawdown
  - Execution Agent   → optimiza timing y gas

Flujo COPPER:
  1. Cada agente genera su propuesta independiente
  2. Debate estructurado: cada agente critica las propuestas de los otros
  3. Recompensas contrafactuales: evaluar utilidad de cada reflexion
  4. Consenso: decision final ponderada por confianza de cada agente
  5. Ajuste: cada agente actualiza sus instrucciones para mejorar colaboracion futura
```

**Implementacion**:
- Directorio: `agent/core/multi-agent/`
- Archivos: `compliance-agent.ts`, `investment-agent.ts`, `risk-agent.ts`, `execution-agent.ts`
- Orquestador: `agent/core/multi-agent/orchestrator.ts`
- Mecanismo de votacion ponderada con umbral de consenso configurable

## Niveles de Autonomia y Aprendizaje

| Nivel | Aprendizaje | Accion |
|-------|-------------|--------|
| Asistente | Observa y sugiere, no modifica parametros | Humano firma todo |
| Co-Piloto | Aprende de feedback del usuario, ajusta sugerencias | Compliance automatico, humano firma trades |
| Autonomo | AutoResearch + R-MCTS + COPPER activos | Rebalanceo automatico, el agente ejecuta |

## Guardrails de Seguridad

Independientemente del nivel de autonomia:
- **Hard limits**: Exposure maxima por asset (ej: max 30% en un solo token)
- **Circuit breaker**: Si perdida > X% en 24h, pausar todas las operaciones automaticas
- **Audit trail**: Cada decision del agente logueada con razonamiento completo
- **Kill switch**: El usuario puede desactivar autonomia en cualquier momento via frontend
- **Compliance override**: UIF/CNV rules nunca pueden ser bypasseadas por el agente
