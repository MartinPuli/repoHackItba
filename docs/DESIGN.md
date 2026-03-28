# StrongBox — Diseño Visual

## Paleta de Colores — Pistachio Ice Cream

| Color | Hex | Uso |
|-------|-----|-----|
| Verde medio | `#96CCA8` | Primary / brand, botones principales, iconos activos |
| Verde claro | `#C5EDC8` | Hover states, badges, highlights |
| Verde pastel | `#D8EEDB` | Backgrounds de cards, surfaces secundarias |
| Crema claro | `#FFFEF1` | Background principal, base de la app |
| Crema medio | `#FFF9E5` | Surface alternativa, inputs, modals |
| Crema verdoso | `#F3FCF7` | Background de secciones, paneles laterales |

## Aplicacion por componente

| Componente | Background | Texto | Accento |
|------------|-----------|-------|---------|
| Body / App | `#FFFEF1` | `#2D3B2F` (verde oscuro) | — |
| Cards | `#F3FCF7` | `#2D3B2F` | border `#D8EEDB` |
| Sidebar | `#F3FCF7` | `#2D3B2F` | activo `#96CCA8` |
| Botones primarios | `#96CCA8` | `#FFFEF1` | hover `#C5EDC8` |
| Botones secundarios | `transparent` | `#96CCA8` | border `#C5EDC8` |
| Inputs | `#FFF9E5` | `#2D3B2F` | focus border `#96CCA8` |
| Badges / status | `#C5EDC8` | `#2D3B2F` | — |
| Alerts / warning | `#FFF9E5` | `#2D3B2F` | border `#96CCA8` |
| TopBar | `#FFFEF1` | `#2D3B2F` | border-bottom `#D8EEDB` |

## Tipografia

- **Font**: Inter o System UI (sans-serif)
- **Headings**: semibold, tracking-tight
- **Body**: regular, text-sm/text-base
- **Labels**: medium, text-xs, uppercase para categorias

## Estilo general

- Light mode (la paleta es clara, no dark mode)
- Bordes suaves, radius `rounded-lg` / `rounded-xl`
- Sombras minimas (`shadow-sm`)
- Espaciado generoso
- Sin glassmorphism — estilo limpio y organico
- Micro-animaciones en transiciones de estado (hover, active)

## Colores semanticos

| Estado | Color | Nota |
|--------|-------|------|
| Activo / OK | `#96CCA8` | Verde primary |
| Pendiente | `#FFF9E5` con border `#E8D98A` | Crema con acento amarillo |
| Error / Rechazado | `#F5A5A5` | Rojo suave (fuera de paleta, solo para errores) |
| Inactivo / Disabled | `#D8EEDB` con opacity 50% | Verde pastel apagado |

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
}
```
