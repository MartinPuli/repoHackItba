# Integración Lemon Cash Mini App SDK

## Resumen

Vaultix funciona como **Mini App** dentro de la app de Lemon Cash. Cuando se abre desde el WebView de Lemon, el SDK autentica automáticamente al usuario y provee acceso a su wallet sin necesidad de WalletConnect ni MetaMask.

**Si se abre desde un browser normal**, todo sigue funcionando con WalletConnect como antes. No se rompe nada.

---

## Arquitectura

```
┌─────────────────────────────────────────────┐
│  ¿Está en Lemon WebView?                    │
│                                             │
│   SÍ → Lemon SDK authenticate()            │
│        → wallet address directo             │
│        → auto-redirect a /role              │
│                                             │
│   NO → WalletConnect (AppKit/wagmi)         │
│        → MetaMask, Trust, Lemon deep-link   │
│        → flujo normal                       │
└─────────────────────────────────────────────┘
```

### Hook unificado: `useUnifiedWallet()`

Todas las páginas usan este hook en vez de `useAccount()` de wagmi directamente.
Combina ambas fuentes de wallet (Lemon SDK + wagmi) en una sola interfaz:

```typescript
const { address, isConnected, isLemon, source } = useUnifiedWallet();
// address     → `0x...` (de Lemon o wagmi según corresponda)
// isConnected → true si hay wallet activa
// isLemon     → true si estamos en el WebView de Lemon
// source      → "lemon" | "wagmi"
```

---

## Archivos de la integración

| Archivo | Propósito |
|---------|-----------|
| `lib/lemon/client.ts` | Wrapper SSR-safe del SDK. Re-exporta las funciones + `isInLemonWebView()` que no rompe en server-side rendering |
| `context/LemonContext.tsx` | React Context + Provider. Detecta WebView, auto-autentica, expone `lemonDeposit()` y `lemonWithdraw()` |
| `hooks/useUnifiedWallet.ts` | Hook unificado que combina wagmi + Lemon. **Todas las páginas usan este hook** |
| `app/providers.tsx` | `<LemonProvider>` envuelve la app en el tree de providers |
| `app/connect/page.tsx` | Detecta Lemon → muestra spinner → auto-redirige |
| `app/role/page.tsx` | Usa `useUnifiedWallet` para chequeo de conexión. Supabase sign-in solo para wagmi |
| `app/safe/configure/page.tsx` | Usa `useUnifiedWallet` para obtener address |
| `app/safe/owner/page.tsx` | Usa `useUnifiedWallet` para obtener address |
| `app/guardian/page.tsx` | Usa `useUnifiedWallet` para obtener address |
| `components/vault/VaultShell.tsx` | Header muestra address de Lemon o wagmi |

---

## SDK de Lemon — Funciones disponibles

### `authenticate({ chainId })`
Pide la wallet del usuario a la app de Lemon. Auto-ejecutado al montar si estamos en WebView.

```typescript
import { authenticate, ChainId, TransactionResult } from '@lemoncash/mini-app-sdk';

const result = await authenticate({ chainId: ChainId.BNB_SMART_CHAIN_TESTNET });
if (result.result === TransactionResult.SUCCESS) {
  console.log(result.data.wallet); // "0x..."
}
```

### `deposit({ amount, tokenName, chainId })`
Deposita tokens en la Mini App wallet del usuario.

```typescript
import { deposit, TokenName, ChainId } from '@lemoncash/mini-app-sdk';

const result = await deposit({
  amount: '100',
  tokenName: TokenName.USDC,
  chainId: ChainId.BNB_SMART_CHAIN_TESTNET,
});
// result.data.txHash → "0x..."
```

### `withdraw({ amount, tokenName, chainId })`
Retira tokens de la Mini App wallet a la Lemon wallet.

```typescript
import { withdraw, TokenName, ChainId } from '@lemoncash/mini-app-sdk';

const result = await withdraw({
  amount: '50',
  tokenName: TokenName.USDC,
  chainId: ChainId.BNB_SMART_CHAIN_TESTNET,
});
```

### `isWebView()` / `isLemonWebView()`
Detecta si estamos corriendo dentro del WebView de Lemon Cash.

### `callSmartContract({ contracts })`
Llama funciones de smart contracts directamente desde el WebView.

---

## Uso desde cualquier componente

```typescript
import { useLemon } from "@/context/LemonContext";
import { TokenName } from "@lemoncash/mini-app-sdk";

function MyComponent() {
  const { isLemon, wallet, lemonDeposit, lemonWithdraw, error } = useLemon();

  if (!isLemon) return null; // Solo mostrar en Lemon

  return (
    <button onClick={() => lemonDeposit("100", TokenName.USDC)}>
      Depositar 100 USDC
    </button>
  );
}
```

---

## Chain configurada

La constante `CHAIN` en `context/LemonContext.tsx` está seteada en:

```typescript
const CHAIN = ChainId.BNB_SMART_CHAIN_TESTNET; // chainId 97
```

Para mainnet, cambiar a `ChainId.BNB_SMART_CHAIN` (chainId 56).

---

## Tokens soportados por Lemon

```
AAVE, ARB, AVAX, AXS, BNB, BTC, CELO, DAI, ETH,
GNO, LINK, OP, PAXG, POL, RIF, UNI, USDC, USDT, USDS, XDAI
```

---

## Cómo publicar como Mini App

1. **Deploy** la app en un hosting público (Vercel, etc.)
2. **Contactar al equipo de Lemon Cash** con la URL pública → te dan un `mini-app-id`
3. Los usuarios abren la app desde Lemon con deeplinks:
   - `lemoncash://app/mini-apps/detail/{mini-app-id}` — ficha de la app
   - `lemoncash://app/mini-apps/webview/{mini-app-id}` — abre directo en WebView

> **Nota**: Aún no hay dashboard de desarrolladores self-service. El `mini-app-id` se pide directamente al equipo de Lemon.

---

## Compatibilidad

| Entorno | Comportamiento |
|---------|---------------|
| **Lemon Cash WebView** | SDK se activa, auth automática, deposit/withdraw nativos |
| **Browser + MetaMask** | WalletConnect normal, SDK inactivo |
| **Browser + Lemon deep-link** | WalletConnect via deep-link `lemon://` |
| **SSR (Next.js server)** | `isInLemonWebView()` retorna `false`, sin errores |
