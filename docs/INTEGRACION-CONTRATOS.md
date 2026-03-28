# Integracion Agente AI ↔ Smart Contracts

## Arquitectura General

```
OWNER (Metamask)
    │
    ▼
┌──────────┐     ┌──────────────┐
│  FACTORY │────►│    WALLET    │ (liquidez diaria)
│          │     │  owner=EOA   │
│ CREAR()  │     │  ENVIAR()    │
│          │     │  DEPOSITAR() │
└──────────┘     └──────┬───────┘
                        │ owner
                        ▼
                 ┌──────────────┐
                 │ CAJA FUERTE  │ (ahorros + DeFi)
                 │ owner=Wallet │
                 │ DEPOSITAR()  │
                 │ RETIRAR()    │
                 │ RESET TIME() │
                 └──────┬───────┘
                        │ Dead Man's Switch
                        ▼
                 ┌──────────────┐
                 │  HEREDEROS   │
                 │  H1 (50%)    │
                 │  H2 (50%)    │
                 └──────────────┘
```

## Interacciones del Agente por Contrato

### 1. Factory — Onboarding Automatizado

El agente AI orquesta el flujo de creacion de cuentas:

```solidity
// El agente llama a CREAR() para registrar nuevos usuarios
function crear(address _owner) external returns (address wallet, address cajaFuerte);

// Modificador de proteccion: evita duplicados
modifier checkUserHasAccount(address _owner) {
    require(accounts[_owner] == address(0), "User already has account");
    _;
}

// El agente puede consultar contratos existentes
function getWallet(address _owner) external view returns (address);
function getCajaFuerte(address _owner) external view returns (address);
```

**Flujo del agente**:
1. Usuario inicia onboarding en frontend
2. Agente verifica que no exista cuenta previa via `getWallet()`
3. Agente prepara UserOperation para `crear()`
4. Segun nivel de autonomia: pide firma al usuario o ejecuta con Session Key
5. Agente registra la wallet y caja fuerte creadas para operaciones futuras

### 2. Wallet — Liquidez Diaria y Off-Ramp

```solidity
// Envio de fondos (pagos QR, transferencias)
function enviar(address _to, uint256 _amount) external onlyOwner;

// Deposito a CajaFuerte
function depositar(uint256 _amount) external onlyOwner;

// Modifier critico: msg.sender == owner (EOA del usuario)
modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
}
```

**Interaccion del agente segun nivel de autonomia**:

| Nivel | Accion del Agente | Firma |
|-------|-------------------|-------|
| Asistente | Sugiere montos y destinatarios optimos | Humano firma via Metamask |
| Co-Piloto | Prepara tx + notifica, compliance UIF automatico | Humano aprueba con 1 click |
| Autonomo | Ejecuta via Session Keys pre-aprobadas | Sin intervencion humana |

**Flujo Off-Ramp (pago QR en ARS)**:
1. Agente aplica R-MCTS para determinar mejor momento de conversion
2. Agente prepara `enviar()` hacia contrato de off-ramp
3. Conversion crypto → ARS con spread del modelo de negocio
4. QR generado para el usuario

### 3. CajaFuerte — Yield Strategy y Herencia

```solidity
// Depositar ahorros (solo la Wallet puede llamar)
function depositar(uint256 _amount) external onlyOwner;

// Retirar fondos (solo la Wallet puede llamar)
function retirar(uint256 _amount) external onlyOwner;

// Reset del Dead Man's Switch
function resetTime() external onlyOwner;

// Retiro por herederos (cuando expira el switch)
function retirarFondos() external onlyHeredero;

// Modifier de herencia
modifier onlyHeredero() {
    require(
        msg.sender == heredero1 || msg.sender == heredero2,
        "Not heredero"
    );
    require(block.timestamp > lastActivity + deadManTimeout, "Owner still active");
    _;
}
```

**Estrategia de Yield orquestada por el agente**:

```
Flujo Venus-Rootstock:
1. Agente deposita colateral en Venus Protocol (BSC)
   └── Ej: depositar USDT como colateral
2. Agente toma prestamo contra el colateral
   └── Ej: borrowear BTCB a tasa baja
3. Agente bridgea a Rootstock
   └── BTCB → rBTC via bridge
4. Agente invierte en yield farming en Rootstock
   └── rBTC en pools de rendimiento
5. Performance fee sobre el spread de tasas
   └── (yield Rootstock) - (interes Venus) - gas = beneficio neto
```

**Parametros que el agente optimiza via AutoResearch**:
- Ratio colateral/prestamo (LTV) optimo
- Momento de entrada/salida de posiciones
- Seleccion de pools en Rootstock por APY ajustado a riesgo
- Frecuencia de rebalanceo

### 4. Dead Man's Switch — Gestion Automatizada

El agente tiene la tarea programada de mantener activo el Dead Man's Switch:

```
Deteccion de actividad:
  - Login en la plataforma
  - Transaccion firmada
  - Interaccion biometrica (si disponible)
  - Cualquier llamada a contratos desde la wallet del usuario

Accion del agente:
  Si actividad_detectada → llamar resetTime() via Wallet
  Si NO actividad por X dias → notificar al usuario urgentemente
  Si timeout expira → el contrato permite a herederos llamar retirarFondos()
```

**Flujo de herencia cuando expira el switch**:
1. `block.timestamp > lastActivity + deadManTimeout` se cumple
2. Modifier `onlyHeredero` permite a H1 o H2 ejecutar
3. `retirarFondos()` reparte 50% a cada heredero designado
4. Agente notifica a herederos que los fondos estan disponibles

## Session Keys para Modo Autonomo

Para que el agente opere sin requerir firma del usuario en cada tx:

```
Session Key = clave temporal con permisos limitados

Parametros de la Session Key:
  - Duracion: configurable (ej: 24h, 7 dias)
  - Monto maximo por tx: limitado
  - Monto maximo acumulado: limitado
  - Funciones permitidas: whitelist (ej: solo depositar, retirar < X)
  - Contratos permitidos: solo Wallet y CajaFuerte propios
```

El usuario aprueba la Session Key una vez (firmando con Metamask), y el agente opera dentro de esos limites sin pedir mas firmas.

## Diagrama de Flujo Completo

```
Usuario abre app
    │
    ▼
[Frontend] ──► [Agente AI] ──► Analisis de mercado (R-MCTS)
                    │
                    ├── Nivel Asistente: muestra sugerencias en UI
                    │
                    ├── Nivel Co-Piloto: prepara tx + pide aprobacion
                    │
                    └── Nivel Autonomo: ejecuta via Session Keys
                              │
                              ▼
                    [Smart Contracts (BSC)]
                    ├── Factory.crear()
                    ├── Wallet.enviar()
                    ├── Wallet.depositar()
                    ├── CajaFuerte.depositar()
                    ├── CajaFuerte.retirar()
                    ├── CajaFuerte.resetTime()
                    │
                    ▼
                    [DeFi Cross-Chain]
                    ├── Venus Protocol (BSC) → colateral + prestamo
                    ├── Bridge BSC ↔ Rootstock
                    └── Yield Farming (Rootstock) → rendimiento en rBTC
```
