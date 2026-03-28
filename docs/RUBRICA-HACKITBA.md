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

| Puntaje | Criterio |
|---------|----------|
| 1 | Problema no definido o irrelevante |
| 2 | Problema vago o poco relevante |
| 3 | Relevante pero mal argumentado |
| 4 | Relevante con respaldo, podria fortalecerse |
| **5** | **Relevante, bien argumentado, respaldado con evidencia** |

**Estrategia para 5/5**:
- Dato duro: Se estima que entre 3 y 4 millones de BTC estan perdidos para siempre por perdida de claves (~$170B+)
- Problema concreto: Si perdes tu seed phrase o te hackean, no hay forma de recuperar tus fondos
- Evidencia: Casos reales de perdida masiva (James Howells, Stefan Thomas, QuadrigaCX)
- Angulo humano: Familias que pierden acceso al patrimonio digital de un familiar fallecido

### Relacion con la Tematica (0-3 pts)

| Puntaje | Criterio |
|---------|----------|
| **0** | **No se relaciona (DESCALIFICADO)** |
| 1 | Relacion forzada |
| **3** | **Relacion clara y directa** |

**Estrategia para 3/3**:
- Verificar tematica del hackathon y mencionarla explicitamente
- StrongBox es infraestructura de seguridad blockchain — conectar directamente

### Innovacion y Oportunidad (1-5 pts)

| Puntaje | Criterio |
|---------|----------|
| 1 | No innovadora |
| 3 | Creativa con diferencia clara |
| **5** | **Altamente innovadora, enfoque unico, ventaja competitiva clara** |

**Estrategia para 5/5**:
- **Diferenciador**: No es una wallet mas — es una capa de seguridad y recuperacion sobre cualquier wallet
- **Guardianes para retiros**: Nadie puede drenar tu vault sin aprobacion humana
- **Recovery social on-chain**: Si perdes acceso, tu red de confianza te rescata
- **Dead Man's Switch**: Inactividad prolongada no congela fondos para siempre

### Impacto y Alcance (1-5 pts)

| Puntaje | Criterio |
|---------|----------|
| 1 | Impacto minimo |
| 3 | Impacto en sector especifico |
| **5** | **Impacto transformador a gran escala** |

**Estrategia para 5/5**:
- Problema universal: toda persona con crypto necesita proteger sus fondos
- No depende de un pais o regulacion — funciona globalmente
- Escalabilidad: puede soportar cualquier chain EVM
- Inclusion: baja la barrera tecnica de seguridad crypto

### Monetizable (0-5 pts)

| Puntaje | Criterio |
|---------|----------|
| **0** | **No monetizable (DESCALIFICADO)** |
| 3 | Coherente pero falta detalle |
| **5** | **Solido, con pricing e ingresos bien definidos** |

**Estrategia para 5/5**:
- **Fee de creacion**: Fee unico al deployar vault on-chain
- **Fee por retiro**: Porcentaje en retiros ejecutados (ej: 0.1-0.5%)
- **Premium**: Features avanzadas (mas guardianes, timelimits custom, notificaciones multi-canal, auditorias)
- Mostrar numeros concretos en la presentacion

---

## Rubrica para el MVP (21 puntos max)

### Facilidad de Ejecucion (0-3 pts)

| Puntaje | Criterio |
|---------|----------|
| **0** | **No puede ejecutarse (DESCALIFICADO)** |
| 2 | Instrucciones claras, multiples servicios |
| **3** | **Deployado o ejecutable con un unico script** |

**Estrategia para 3/3**:
- [ ] Deploy en Vercel (frontend) + contratos verificados en BSC Testnet
- [ ] Link a la app deployada para que el juez no tenga que correr nada
- [ ] README con instrucciones paso a paso

### Interfaz de Usuario (1-8 pts)

| Puntaje | Criterio |
|---------|----------|
| 1 | Poco intuitiva |
| 4 | Bien disenada, UX clara |
| 6 | Atractiva y profesional |
| **8** | **Excelente, intuitiva, altos estandares** |

**Estrategia para 7-8/8**:
- 3 dashboards por rol: Owner, Guardian, Recovery Contact
- Countdown visual de inactividad (Dead Man's Switch)
- Flujo de retiro paso a paso con estados claros
- Dark mode, UI profesional fintech
- Notificaciones en tiempo real de solicitudes pendientes

### Calidad del MVP (1-10 pts)

| Puntaje | Criterio |
|---------|----------|
| 1 | No resuelve la problematica |
| 4-5 | Funcional con errores |
| 8-9 | Bien implementado, solido |
| **10** | **Aborda completamente la problematica** |

**Estrategia para 8-10/10**:
- Flujo completo: crear vault → depositar → solicitar retiro → guardianes aprueban → ejecutar
- Recovery por inactividad demostrable en demo
- Contratos deployados y verificados (no mocks)
- 3 vistas funcionales (owner, guardian, recovery)
- Seguridad real: validaciones on-chain, no solo UI

---

## Rubrica de la Presentacion (3 puntos max)

### Video (1-3 pts)

| Puntaje | Criterio |
|---------|----------|
| 1 | Confuso |
| 2 | Claro, puede mejorar |
| **3** | **Clara, bien estructurada, convincente** |

**Estrategia para 3/3**:
- Abrir con dato impactante: "$170B en BTC perdidos para siempre"
- Problema (30s) → Solucion (30s) → Demo (1-2min) → Negocio (30s)
- Demo mostrando los 3 roles interactuando

---

## Checklist Pre-Entrega

### Criticos (si falla = descalificado)
- [ ] Proyecto se relaciona con la tematica
- [ ] Modelo de negocio definido con numeros
- [ ] MVP ejecutable (deploy o script unico)

### Alto Impacto en Puntaje
- [ ] Problematica con datos duros (BTC perdidos, casos reales)
- [ ] Diferenciador claro: guardianes + recovery + dead man switch
- [ ] UI profesional con 3 dashboards por rol
- [ ] MVP con flujo completo funcionando
- [ ] Video bien estructurado

### Nice-to-Have
- [ ] Demo con multiples wallets interactuando en vivo
- [ ] Metricas de testnet
- [ ] Roadmap post-hackathon
