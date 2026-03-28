# Componentes UI — 21st.dev

## Que es 21st.dev

Plataforma con miles de componentes React + Tailwind CSS listos para copiar y usar. Componentes creados por la comunidad, con calidad profesional. Ideal para hackathons: UI premium sin perder tiempo diseñando desde cero.

**URL**: https://21st.dev/home

## Categorias Disponibles

| Categoria | Uso en Nuestro Proyecto |
|-----------|------------------------|
| **Heros** | Landing page / pantalla de bienvenida |
| **Features** | Secciones explicativas del producto |
| **Buttons** | CTAs, Kill Switch, acciones primarias |
| **AI Chat Components** | Interfaz del Agente AI / Activity Feed |
| **Calls to Action** | Onboarding, crear wallet, depositar |
| **Testimonials** | Social proof (si aplica) |
| **Pricing** | Mostrar niveles de autonomia como "planes" |
| **Text Components** | Tipografia, headings, badges |
| **Shaders** | Efectos visuales premium en backgrounds |

## Componentes Prioritarios para Nuestro Dashboard

### 1. Dashboard Layout

Buscar en 21st.dev:
- **Sidebar navigation** con iconos para: Dashboard, Wallet, CajaFuerte, Agente, Settings
- **Top bar** con wallet connection (address truncada + balance)
- **Card grid** para mostrar balances, yield, actividad

```
┌──────┬──────────────────────────────────────┐
│      │  TopBar: wallet + balance + nivel    │
│ Side │──────────────────────────────────────│
│ bar  │  ┌──────┐ ┌──────┐ ┌──────┐        │
│      │  │Balance│ │Yield │ │Agente│        │
│      │  │ Card  │ │ Card │ │Status│        │
│      │  └──────┘ └──────┘ └──────┘        │
│      │                                      │
│      │  ┌──────────────────────────────┐   │
│      │  │     Activity Feed            │   │
│      │  │     (acciones del agente)    │   │
│      │  └──────────────────────────────┘   │
└──────┴──────────────────────────────────────┘
```

### 2. Balance Cards (Glassmorphism)

Estilo glassmorphism para cards de balance — tendencia 2025-2026 en fintech:

```
Buscar en 21st.dev: "glass card", "blur card", "gradient card"

Aplicar a:
  - Card de balance total (Wallet + CajaFuerte)
  - Card de yield acumulado
  - Card de estado del agente
  - Card de Dead Man's Switch status

Estilos CSS clave:
  background: rgba(255, 255, 255, 0.05)
  backdrop-filter: blur(12px)
  border: 1px solid rgba(255, 255, 255, 0.1)
  border-radius: 16px
```

### 3. Slider de Autonomia

Buscar en 21st.dev: "slider", "toggle", "range", "segmented control"

```
Requisitos del componente:
  - 3 posiciones discretas (no continuo)
  - Labels: Asistente / Co-Piloto / Autonomo
  - Colores progresivos: verde → amarillo → naranja
  - Animacion suave entre estados
  - Tooltip explicativo en cada nivel
  - Confirmacion modal al subir a Autonomo
```

### 4. AI Chat / Activity Feed

Buscar en 21st.dev: "AI chat", "chat bubble", "message list", "activity feed"

```
Componentes necesarios:
  - Message bubble (agente vs sistema)
  - Timestamp badge
  - Action button inline (revertir, aprobar)
  - Status indicator (pensando, ejecutando, completado)
  - Scroll infinito con lazy loading
```

### 5. Kill Switch Button

Buscar en 21st.dev: "danger button", "slide to confirm", "destructive action"

```
Requisitos:
  - Color rojo/warning prominente
  - Patron "slide to confirm" o "hold to activate"
  - Animacion de confirmacion
  - Siempre visible (sticky/overlay)
  - Feedback haptico (si mobile)
```

### 6. Modals de Confirmacion

Buscar en 21st.dev: "modal", "dialog", "confirmation"

```
Usos:
  - Confirmar subida a nivel Autonomo
  - Confirmar deposito/retiro
  - Confirmar creacion de Session Keys
  - Mostrar detalles de tx antes de firmar
  - Alerta de Dead Man's Switch expirando
```

### 7. Tablas y Listas

Buscar en 21st.dev: "table", "data table", "list"

```
Usos:
  - Historial de transacciones
  - Lista de herederos
  - Posiciones DeFi activas
  - Session Keys activas con permisos
```

## Tendencias de Diseno a Aplicar

### Dark Mode First
- Background: #0a0a0a o #111111
- Cards: rgba(255, 255, 255, 0.05) con blur
- Texto primario: #ffffff
- Texto secundario: #888888
- Acentos: gradientes de azul-violeta para crypto, verde para profit, rojo para loss

### Glassmorphism
- Cards con backdrop-filter: blur
- Bordes sutiles semitransparentes
- Sombras suaves con color
- Ideal para: balance cards, modals, sidebar

### Micro-animaciones
- Transiciones suaves en cambio de estado del slider
- Numeros que "cuentan" al actualizar balances
- Pulse animation en el indicador de "Agente activo"
- Skeleton loading mientras cargan datos on-chain

### Gradientes
- Header/hero: gradiente sutil azul-violeta
- Botones primarios: gradiente con hover shift
- Cards de yield: gradiente verde sutil indicando ganancias
- Kill Switch: gradiente rojo intenso

### Tipografia
- Font principal: Inter o Geist (standard en crypto/fintech)
- Monospace para addresses y hashes: JetBrains Mono o Fira Code
- Tamaños: numeros de balance grandes (2xl-4xl), labels small

## Workflow de Implementacion

```
1. Ir a 21st.dev/home
2. Buscar componente por categoria
3. Copiar codigo del componente
4. Pegar en frontend/app/components/
5. Adaptar colores/estilos al dark theme
6. Conectar con datos de contratos via Wagmi hooks
```

## Componentes Custom que NO estan en 21st.dev

Estos hay que construirlos:
- **AutonomySlider**: Slider de 3 posiciones con confirmacion
- **KillSwitch**: Slide-to-confirm con revocacion on-chain
- **DeadManStatus**: Indicador visual de tiempo restante del switch
- **YieldBreakdown**: Desglose Venus APY vs Rootstock APY vs neto
- **AgentDecisionCard**: Card mostrando razonamiento del agente (para modo Asistente)
