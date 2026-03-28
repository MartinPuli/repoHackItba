# Integracion Agente AI ↔ Smart Contracts

## Arquitectura de Contratos (actualizada)

```
Factory (email → wallet address)
  │
  ├── createNewWallet(email, userAddress) → deploy Wallet, mapea email→address
  └── createNewStrongBox(wallet)          → deploy StrongBox, mapea wallet→strongbox

Owner (abstract)
  └── OnlyOwner modifier, getOwner()

HeirGuardians (abstract, hereda de Owner)
  └── setHeirGuardian1/2(), OnlyHeirGuardians modifier
  └── _validateHeir: newHeir != otherHeir (sin excepcion address(0))

Wallet
  ├── sendTo(address to, uint256 amount) → envia BNB (onlyOwner)
  ├── receive() payable                  → recibe BNB
  └── getBalance()                       → consulta balance

StrongBox (hereda de Owner + HeirGuardians)
  ├── deposit() payable OnlyOwner                → deposita en caja fuerte (sin emit)
  ├── requestWithdrawal(amount, to) OnlyOwner    → solicita retiro (requiere aprobacion herederos)
  ├── approveWithdrawal(requestId) OnlyHeirGuardians → heredero aprueba retiro
  ├── executeWithdrawal(requestId) OnlyOwner     → ejecuta retiro aprobado por ambos herederos
  ├── inherit() OnlyHeirGuardians onlyAfterTime  → herencia individual (cada heredero reclama su 50%)
  ├── getBalance()                               → consulta balance
  ├── receive() payable OnlyOwner                → recibe BNB solo del owner
  └── (sin updateTime publico — solo _updateTime privado)
```

## Flujo por Canal

```
Usuario (App/Telegram/WhatsApp)
    │
    ▼
[Agent Orchestrator] ──► detecta intent ──► extrae params
    │
    ▼
[MCP Server Tools]
    │
    ├── wallet_create     → Factory.createNewWallet(email)
    ├── wallet_deposit    → Wallet.Receive() (msg.value)
    ├── wallet_transfer   → Wallet.SendTo(to) payable
    ├── wallet_balance    → Wallet.GetBalance()
    │
    ├── strongbox_create  → Factory.createNewStrongBox(walletAddr)
    ├── strongbox_deposit → StrongBox.deposit() payable
    ├── strongbox_info    → StrongBox.getBalance() + getHeirGuardian1/2()
    │
    ├── yield_invest      → StrongBox.deposit() + DeFi strategy
    ├── loan_take         → Lending pool (off-chain + colateral on-chain)
    │
    └── compliance_*      → UIF/CNV checks (off-chain)
```

## Interacciones del Agente por Contrato

### 1. Factory — Onboarding por Email

El nuevo Factory mapea emails a wallets directamente:

```solidity
// Crear wallet para usuario
function createNewWallet(string memory email) public;
// → Emite NewWalletCreated(email, walletAddress)

// Crear StrongBox vinculada a wallet
function createNewStrongBox(address walletAddress) public;
// → Emite NewStrongBoxCreated(walletAddress, strongBoxAddress)

// Consultas
function getWallet(string memory email) public view returns(address);
function getStrongBox(address wallet) public view returns(address);
```

**Flujo del agente**:
1. Usuario da su email (via chat, Telegram, WhatsApp)
2. Agente llama `Factory.getWallet(email)` — si existe, vincula la sesion
3. Si no existe, llama `Factory.createNewWallet(email)` — deploy on-chain
4. Opcionalmente, `Factory.createNewStrongBox(walletAddr)` para caja fuerte

### 2. Wallet — Pagos y Transferencias

```solidity
// Enviar BNB a otra direccion
function SendTo(address to) public payable returns(bool);
// → Valida: msg.value > 0, to != address(0), to != address(this)
// → Emite Tx(from, to, amount)

// Recibir BNB
function Receive() public payable returns(bool);
// → Valida: msg.value > 0, msg.sender != address(this)
// → Emite Tx(sender, this, amount)

// Consultar balance
function GetBalance() public view returns(uint);
```

**Interaccion del agente**:

| Canal | Accion | Contrato |
|-------|--------|----------|
| "depositar 100 BNB" | Wallet.Receive() | msg.value = 100 BNB |
| "mandar 50 a 0x..." | Wallet.SendTo(0x...) | msg.value = 50 BNB |
| "cuanto tengo" | Wallet.GetBalance() | view call |

### 3. StrongBox — Ahorros y Herencia

```solidity
// Depositar en caja fuerte (solo owner)
function deposit() public payable OnlyOwner returns(bool);
// → Actualiza lastTimeUsed (resetea Dead Man's Switch)

// Retirar (solo owner, requiere confirm de herederos)
function withdraw() public payable OnlyOwner returns(bool);
// → TODO: cola de peticiones con aprobacion de herederos

// Herencia (solo herederos, solo despues de 1 año de inactividad)
function inherit() OnlyHeirGuardians OnlyAfterTime returns(bool);
// → Reparte 50% del balance al heredero que llama

// Configurar herederos (solo owner)
function setHeirGuardian1(address newHeirGuardian) public OnlyOwner;
function setHeirGuardian2(address newHeirGuardian) public OnlyOwner;

// Dead Man's Switch
uint private timeLimit = 365 days; // 1 año
function updateTime() public OnlyOwner; // resetea el timer
```

**Flujo de herencia**:
1. Owner deposita en StrongBox — `lastTimeUsed` se actualiza
2. Owner configura herederos — `setHeirGuardian1/2(addr)`
3. Si pasa 1 año sin `updateTime()`:
   - Herederos pueden llamar `inherit()`
   - Cada uno recibe 50% del balance
4. El agente llama `updateTime()` automaticamente al detectar actividad

### 4. Owner + HeirGuardians — Contratos Abstractos

```solidity
// Owner.sol — control de acceso
abstract contract Owner {
    modifier OnlyOwner();
    function getOwner() public view returns(address);
}

// HeirGuardians.sol — gestion de herederos
abstract contract HeirGuardians is Owner {
    modifier OnlyHeirGuardians();
    function setHeirGuardian1(address) public OnlyOwner;
    function setHeirGuardian2(address) public OnlyOwner;
    function getHeirGuardian1() public view returns(address);
    function getHeirGuardian2() public view returns(address);
}
```

## Pendientes de Implementacion en Contratos

Los siguientes puntos estan marcados como TODO en los contratos:

1. **Factory.createNewWallet**: Falta el deploy real del contrato Wallet (variables `walletAddress` y `strongBoxAddress` no declaradas)
2. **Wallet**: Falta agregar `OnlyOwner` modifier (comentario en linea 3 del equipo)
3. **Wallet**: Agregar `receive() external payable` para recibir BNB directo
4. **StrongBox.withdraw**: Falta implementar la cola de peticiones con aprobacion de herederos
5. **StrongBox.inherit**: Falta agregar `public` y `payable` al modifier
6. **StrongBox.deposit**: Bug — `payable(address(this)).call{value: msg.value}` envia a si mismo, deberia solo aceptar el msg.value
7. **Import paths**: Usan `HackITBA2026/` — verificar que matchee con Hardhat remappings
