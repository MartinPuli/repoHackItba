# UX/UI Agentico — Perilla de Autonomia

## De Manipulacion Directa a Supervision por Permisos

El paradigma de dashboards estaticos queda obsoleto para finanzas autonomas. La interfaz debe guiar al usuario desde el control manual total hacia una supervision basada en permisos delegados.

## Controles Visuales de Autonomia

### Slider/Dial de 3 Niveles

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   🔒 Asistente ───── Co-Piloto ───── Autonomo 🤖   │
│        ○                 ●                ○         │
│                                                     │
│   "El agente sugiere,   "El agente prepara,        │
│    tu decides todo"      tu apruebas con 1 click"   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Principios de diseno**:
- **Feedback progresivo**: Al mover el slider, la UI muestra en tiempo real que permisos se otorgan/revocan
- **Confirmacion friccional**: Subir de Co-Piloto a Autonomo requiere confirmacion explicita (no basta deslizar)
- **Estado visible**: El nivel actual siempre visible en header/sidebar con indicador de color
  - Asistente: verde (seguro, manual)
  - Co-Piloto: amarillo (semi-autonomo)
  - Autonomo: rojo/naranja (delegacion total)

### Permisos Granulares por Nivel

```
Asistente:
  ✅ Ver sugerencias de inversion
  ✅ Ver analisis de mercado
  ❌ Ejecutar transacciones
  ❌ Rebalancear portafolio
  ❌ Session Keys activas

Co-Piloto:
  ✅ Todo lo de Asistente
  ✅ Compliance UIF/CNV automatico
  ✅ Preparar transacciones (requiere 1-click approval)
  ✅ Notificaciones proactivas
  ❌ Ejecucion sin aprobacion

Autonomo:
  ✅ Todo lo de Co-Piloto
  ✅ Session Keys activas (con limites)
  ✅ Rebalanceo automatico
  ✅ Yield optimization sin intervencion
  ✅ Agentic Commerce (Stripe ACP, PayPal AP2)
```

### Kill Switch — Boton de Panico

Componente tactil siempre accesible que revoca instantaneamente todas las Session Keys:

```
┌──────────────────────────┐
│                          │
│   ⚠️  DETENER AGENTE     │
│                          │
│   [████████████████████] │
│   Desliza para revocar   │
│   todas las Session Keys │
│                          │
└──────────────────────────┘
```

**Comportamiento del Kill Switch**:
1. Patron "slide to confirm" (evita activaciones accidentales)
2. Revoca TODAS las Session Keys activas on-chain en una sola tx
3. Baja autonomia a nivel Asistente inmediatamente
4. Pausa todas las operaciones automaticas del agente
5. Notificacion push/email al usuario confirmando la revocacion
6. Log de la accion con timestamp para auditoria

**Implementacion frontend**:
- Archivo: `frontend/app/components/KillSwitch.tsx`
- Siempre renderizado en overlay/sticky position
- Accesible desde cualquier pantalla de la app
- Latencia objetivo: < 2 segundos desde slide hasta revocacion on-chain

## Activity Feed del Agente

Panel en tiempo real de las acciones del agente para cada nivel:

```
┌─────────────────────────────────────────┐
│ Actividad del Agente              LIVE  │
├─────────────────────────────────────────┤
│ 14:32  Analisis: rBTC yield subio a 8% │
│ 14:30  Sugerencia: rebalancear +5% BTC │
│ 14:28  Compliance: tx aprobada UIF ✅   │
│ 14:25  Auto: resetTime() ejecutado     │
│ 14:20  Yield: colateral Venus OK       │
└─────────────────────────────────────────┘
```

Cada entrada muestra: timestamp, tipo de accion, resultado, y boton para revertir (si aplica).
