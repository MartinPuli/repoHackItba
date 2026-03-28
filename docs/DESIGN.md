# StrongBox — Diseño Visual

## Direccion de Diseño

- **Mobile-first**: Priorizar layout de celular, responsive a desktop
- **Profesional y limpio**: Sin mascotas, sin robots, sin animaciones cartoon
- **Fintech seria**: Inspiracion en apps bancarias modernas (Revolut, Wise, Lemon Cash)
- **Minimal**: Pocos elementos por pantalla, acciones claras, sin ruido
- **Tipografia como protagonista**: Numeros grandes, jerarquia visual con peso de fuente

## Paleta de Colores — Pistachio Ice Cream

| Color | Hex | Uso |
|-------|-----|-----|
| Verde medio | `#96CCA8` | Primary / brand, botones principales, iconos activos |
| Verde claro | `#C5EDC8` | Hover states, badges, highlights |
| Verde pastel | `#D8EEDB` | Backgrounds de cards, surfaces secundarias |
| Crema claro | `#FFFEF1` | Background principal, base de la app |
| Crema medio | `#FFF9E5` | Surface alternativa, inputs, modals |
| Crema verdoso | `#F3FCF7` | Background de secciones, paneles laterales |

## Logo

Direccion: escudo verde minimalista, sin mascota. Estilo flat, geometrico.
Candidatos preferidos del moodboard: "Rocket Shield" o "Cloud Guard" (simplificados, sin texto).
El logo debe funcionar a 24x24px (favicon) y 120x120px (splash).

## Flujo de Pantallas (6 pages)

```
[1] Connect Wallet
       |
[2] Role Selection
       |
  ┌────┼────────────┐
  v    v             v
[3] Safe Config   [5] Guardian    [6] Heir
       |           Interface      Interface
       v
[4] Owner Dashboard
```

### Page 1 — Connect Wallet
- Pantalla fullscreen mobile
- Logo StrongBox centrado (escudo verde, sin texto largo)
- Titulo: "StrongBox" + subtitulo corto
- Boton unico: "Connect MetaMask" (verde `#96CCA8`, full-width en mobile)
- Fondo `#FFFEF1`

### Page 2 — Role Selection
- Despues de conectar wallet
- 3 opciones como cards grandes tap-friendly (minimo 56px height):
  - **Create Safe** — "Crear tu caja fuerte"
  - **Become Guardian** — "Ya te asignaron como guardian"
  - **Become Heir** — "Ya te asignaron como recovery contact"
- Cada card con icono simple (Shield, Users, Clock) + texto
- Si la wallet ya tiene vault o roles, ir directo al dashboard correspondiente

### Page 3 — Safe Configuration
- Formulario mobile-friendly, scroll vertical
- Secciones:
  - **Tu Email** (1 input)
  - **Recovery Contacts (x2)**: email + wallet address por cada uno
  - **Guardianes (x2)**: email + wallet address por cada uno
- Inputs con labels claros, bordes `#D8EEDB`, focus `#96CCA8`
- Boton al final: "Crear Safe" (full-width, verde)
- Validacion inline (wallets unicas, formato EVM)

### Page 4 — Owner Dashboard
- **Balance grande** al tope (numero prominente, BNB)
- 2 botones side-by-side: "Depositar" / "Solicitar Retiro"
- **Countdown de inactividad** (barra o timer visual, no numeros crudos)
- **Seccion "Mi Red de Confianza"**: lista de guardianes y recovery contacts con status
- **Historial** (ultimas transacciones, compact list)
- **Solicitudes pendientes** (si hay withdrawal request activa, mostrar estado)

### Page 5 — Guardian Interface
- Header: "Te asignaron como Guardian de [0x123...ABC]"
- Lista de solicitudes pendientes (cards con amount, destino, timestamps)
- Cada solicitud: 2 botones grandes "Aprobar" (verde) / "Rechazar" (outline rojo suave)
- Estado: "Esperando aprobacion del otro guardian" o "Retiro ejecutado"
- Sin acceso al balance del owner (privacidad)

### Page 6 — Heir / Recovery Interface
- Header: "Recovery Contact de [0x123...ABC]"
- **Countdown grande**: tiempo restante para que se habilite el recovery
  - Formato: D:HH:MM:SS
  - Color verde si falta mucho, amarillo si se acerca, rojo si ya paso
- **Estado de fondos**: "Disponible tras inactividad del owner"
- Boton "Reclamar Fondos" — deshabilitado hasta que pase el timeLimit
  - Se habilita y cambia de color cuando `block.timestamp - lastTimeUsed >= timeLimit`
- Info de cuanto le corresponde (50%)

## Componentes Mobile-First

### Botones
- Full-width en mobile (`w-full`)
- Minimo 48px height (tap target)
- Border-radius `rounded-xl`
- Primary: bg `#96CCA8`, texto `#FFFEF1`
- Secondary: border `#96CCA8`, texto `#96CCA8`, bg transparent
- Destructivo: border `#F5A5A5`, texto `#E57373`

### Cards
- Full-width, padding 16px
- Border `#D8EEDB`, bg `#F3FCF7`
- Border-radius `rounded-2xl`
- Shadow: ninguna o `shadow-sm`

### Inputs
- Full-width, height 48px
- bg `#FFF9E5`, border `#D8EEDB`
- Focus: border `#96CCA8`, ring `#C5EDC8`
- Font monospace para wallet addresses

### Navigation
- Bottom tab bar en mobile (4 tabs max):
  - Mi Vault (Shield icon)
  - Guardian (Users icon)
  - Recovery (Clock icon)
  - Settings (Gear icon)
- Solo mostrar tabs relevantes al rol de la wallet conectada

## Colores semanticos

| Estado | Color | Nota |
|--------|-------|------|
| Activo / OK | `#96CCA8` | Verde primary |
| Pendiente | `#FFF9E5` con border `#E8D98A` | Crema con acento amarillo |
| Error / Rechazado | `#F5A5A5` | Rojo suave |
| Inactivo / Disabled | `#D8EEDB` con opacity 50% | Verde pastel apagado |
| Countdown cerca | `#E8D98A` | Amarillo suave |
| Countdown vencido | `#E57373` | Rojo |

## Tokens para Tailwind

```js
// tailwind.config.ts → theme.extend.colors
colors: {
  brand: '#96CCA8',
  'brand-light': '#C5EDC8',
  'brand-pastel': '#D8EEDB',
  'cream': '#FFFEF1',
  'cream-mid': '#FFF9E5',
  'cream-green': '#F3FCF7',
  'ink': '#2D3B2F',
  'ink-muted': '#5A6B5C',
  'ink-faint': '#8A9B8C',
  'line': '#D8EEDB',
  'error': '#F5A5A5',
  'error-text': '#E57373',
  'warning': '#E8D98A',
}
```

## API de Diseño

- **Stitch API**: `AQ.Ab8RN6JCw3lOlle8Az6vzsEwueP2fIiomjXC3UjC9QccQmvwXQ`
