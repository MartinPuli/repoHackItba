# Rubrica de Correccion HackITBA 2026

## Resumen de Puntajes

| Categoria | Puntaje Maximo | Peso Estrategico |
|-----------|---------------|------------------|
| Problematica | 5 | Alto |
| Relacion con la tematica | 3 | Critico (0 = descalificado) |
| Innovacion y Oportunidad | 5 | Alto |
| Impacto y Alcance | 5 | Alto |
| Monetizable | 5 | Critico (0 = descalificado) |
| Facilidad de ejecucion | 3 | Medio |
| Interfaz de usuario | 8 | Alto |
| Calidad del MVP | 10 | Muy Alto |
| Video | 3 | Medio |
| **TOTAL** | **47** | |

---

## Rubrica para la Idea (23 puntos max)

### Problematica (1-5 pts)

**Objetivo**: Demostrar que el problema es real, relevante y respaldado con evidencia.

| Puntaje | Criterio |
|---------|----------|
| 1 | Problema no definido o irrelevante |
| 2 | Problema vago o poco relevante |
| 3 | Relevante pero mal argumentado, falta profundidad |
| 4 | Relevante con respaldo, pero podria fortalecerse con mas evidencia |
| **5** | **Relevante, bien argumentado, respaldado con evidencia concreta** |

**Nuestra estrategia para 5/5**:
- Dato duro: Argentina tiene ~60% de inflacion anual, los ahorros en pesos pierden valor constantemente
- Problema concreto: Los argentinos necesitan acceder a rendimientos en dolares/crypto pero las barreras tecnicas son enormes (comprar BNB para gas, entender DeFi, etc.)
- Evidencia: X millones de argentinos usan exchanges crypto pero < 1% accede a DeFi por complejidad
- Angulo humano: "herencia crypto" es un problema no resuelto — si perdes las claves, tus herederos pierden todo

### Relacion con la Tematica (0-3 pts)

| Puntaje | Criterio |
|---------|----------|
| **0** | **No se relaciona (DESCALIFICADO)** |
| 1 | Relacion forzada o poco clara |
| **3** | **Relacion clara y directa** |

**Nuestra estrategia para 3/3**:
- Verificar cual es la tematica del hackathon y asegurar que el pitch la mencione explicitamente
- Conectar Account Abstraction + Agente AI directamente con la tematica

### Innovacion y Oportunidad (1-5 pts)

| Puntaje | Criterio |
|---------|----------|
| 1 | No innovadora, sin diferenciacion |
| 2 | Pequena innovacion, sin mejoras claras |
| 3 | Creativa con diferencia clara, limitaciones en valor agregado |
| 4 | Innovadora con ventaja competitiva visible |
| **5** | **Altamente innovadora, enfoque unico, ventaja competitiva clara** |

**Nuestra estrategia para 5/5**:
- **Diferenciador clave**: "Agent-First" — no es una wallet con un chatbot, es un agente autonomo que GESTIONA tu patrimonio
- **3 niveles de autonomia** con perilla visual — nadie mas ofrece esto
- **Dead Man's Switch** para herencia crypto — problema real sin solucion en el mercado
- **Yield spread cross-chain** automatizado — Venus (BSC) + Rootstock sin que el usuario sepa que existe DeFi

### Impacto y Alcance (1-5 pts)

| Puntaje | Criterio |
|---------|----------|
| 1 | Impacto minimo, problema de nicho |
| 2 | Impacto bajo, grupo reducido |
| 3 | Impacto en sector especifico, limitado por barreras |
| 4 | Impacto significativo con potencial de expansion |
| **5** | **Impacto transformador a gran escala, crecimiento local/nacional/global** |

**Nuestra estrategia para 5/5**:
- Mercado target: millones de argentinos que ya usan crypto pero no acceden a DeFi
- Escalabilidad: el modelo funciona para cualquier pais con alta inflacion (LATAM, Africa)
- Impacto social: herencia crypto resuelve un problema que afecta a familias
- Inclusion financiera: el Paymaster elimina la barrera de "necesitas BNB para gas"

### Monetizable (0-5 pts)

| Puntaje | Criterio |
|---------|----------|
| **0** | **No monetizable (DESCALIFICADO)** |
| 1 | Mencion vaga de ingresos |
| 2 | Modelo generico o poco viable |
| 3 | Coherente pero falta detalle |
| 4 | Claro, viable, equipo puede explicar como genera ingresos |
| **5** | **Solido, con pricing, segmento de clientes e ingresos bien definidos** |

**Nuestra estrategia para 5/5** (ver `docs/UNIT-ECONOMICS.md`):
- **3 fuentes de revenue claras**: yield spread (15% performance fee), paymaster markup (10-20%), off-ramp spread (1-2%)
- **Unit economics concretos**: CAC $3-7, LTV $10.56, payback 5 meses
- **Escenarios de escala**: break-even a 10K usuarios
- Mostrar tabla de numeros en la presentacion — los jueces quieren ver que pensamos en el negocio

---

## Rubrica para el MVP (21 puntos max)

### Facilidad de Ejecucion (0-3 pts)

| Puntaje | Criterio |
|---------|----------|
| **0** | **No puede ejecutarse (DESCALIFICADO)** |
| 1 | Sin instrucciones o poco claras |
| 2 | Instrucciones claras con versiones, multiples servicios manuales |
| **3** | **Deployado o ejecutable con un unico script/contenedor** |

**Nuestra estrategia para 3/3**:
- [ ] `docker-compose up` o un solo `npm run dev` que levante todo
- [ ] README con instrucciones paso a paso con versiones exactas
- [ ] Deploy en Vercel (frontend) + contratos verificados en BSC Testnet
- [ ] Idealmente: link a la app deployada para que el juez no tenga que correr nada

### Interfaz de Usuario (1-8 pts)

| Puntaje | Criterio |
|---------|----------|
| 1 | Poco intuitiva, confusa, inexistente |
| 2 | Estructura basica, desordenada |
| 3 | Funcional, medianamente atractiva |
| 4 | Bien disenada, UX clara y agradable |
| 5 | Intuitiva, bien estructurada, UX comoda |
| 6 | Atractiva y profesional, buena tipografia/colores/usabilidad |
| 7 | Refinada, UX fluida y detallada |
| **8** | **Excelente, intuitiva, altos estandares de usabilidad y estetica** |

**Nuestra estrategia para 7-8/8** (ver `docs/UI-COMPONENTES-21ST.md`):
- Usar componentes premium de 21st.dev para UI profesional rapida
- Slider de autonomia como pieza central visual (ver `docs/UX-AUTONOMIA.md`)
- Kill Switch con animacion fluida
- Activity Feed en tiempo real del agente
- Dark mode por default (estetica crypto/fintech)
- Glassmorphism en cards de balance

### Calidad del MVP (1-10 pts)

| Puntaje | Criterio |
|---------|----------|
| 1 | No resuelve la problematica |
| 2-3 | Aborda parcialmente con fallas graves |
| 4-5 | Funcional con errores o limitaciones |
| 6-7 | Resuelve la problematica, cumple objetivos |
| 8-9 | Bien implementado, solido, pocos errores |
| **10** | **Aborda completamente la problematica, solucion efectiva y bien implementada** |

**Nuestra estrategia para 8-10/10**:
- Flujo completo funcionando: crear wallet → depositar → yield → herencia
- Contratos deployados y verificados en BSC Testnet (no mocks)
- Agente AI modo Asistente funcionando con sugerencias reales
- Toggle de autonomia conectado a contratos (no solo visual)
- Dead Man's Switch demostrable en la demo

---

## Rubrica de la Presentacion (3 puntos max)

### Video (1-3 pts)

| Puntaje | Criterio |
|---------|----------|
| 1 | Confuso, incompleto, dificil de entender |
| 2 | Presenta problematica y MVP claro, puede mejorar estructura |
| **3** | **Explicacion clara, bien estructurada, atractiva y convincente** |

**Nuestra estrategia para 3/3**:
- Estructura: Problema (30s) → Solucion (30s) → Demo (1-2min) → Modelo de negocio (30s)
- Abrir con dato impactante sobre inflacion argentina / perdida de herencia crypto
- Demo en vivo mostrando el flujo completo
- Cerrar con unit economics y vision de escala

---

## Checklist Pre-Entrega

### Criticos (si falla = descalificado)
- [ ] Proyecto se relaciona con la tematica (verificar cual es)
- [ ] Modelo de negocio definido con numeros
- [ ] MVP ejecutable (deploy o script unico)

### Alto Impacto en Puntaje
- [ ] Problematica con datos duros y evidencia
- [ ] Diferenciador claro vs soluciones existentes
- [ ] UI profesional y fluida (minimo 6/8)
- [ ] MVP con flujo completo funcionando (minimo 7/10)
- [ ] Video bien estructurado

### Nice-to-Have
- [ ] Metricas de uso (aunque sean de testnet)
- [ ] Comparativa con competidores
- [ ] Roadmap post-hackathon credible
