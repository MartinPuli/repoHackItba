# Agentic Commerce — Stripe ACP y PayPal AP2

## Concepto

El contrato WALLET interactua algoritmicamente con sistemas de pagos tradicionales a traves de protocolos disenados para que agentes AI ejecuten pagos de forma segura y auditable.

## Stripe ACP (Agentic Commerce Protocol)

Protocolo desarrollado por Stripe y OpenAI para pagos iniciados por agentes.

### Shared Payment Tokens (SPT)

```
Flujo SPT:
1. Usuario autoriza al agente para pagos (nivel Autonomo)
2. Agente solicita SPT a Stripe con parametros:
   - merchant_id: comercio especifico
   - max_amount: monto maximo permitido
   - currency: moneda (USD, ARS, crypto)
   - expiry: vencimiento del token
3. Stripe emite SPT vinculado a la wallet del usuario
4. Agente usa SPT para iniciar pago al comercio
5. Stripe procesa el pago sin exponer credenciales crypto
```

**Propiedades de seguridad**:
- SPT limitado programaticamente a UN comercio y UN monto maximo
- No expone claves privadas ni credenciales crypto subyacentes
- Revocable en cualquier momento (integrado con Kill Switch)
- Cada uso genera registro auditable

### Integracion con nuestro contrato Wallet

```
Usuario ──► [Frontend: Toggle Autonomo]
                 │
                 ▼
            [Agente AI]
                 │
         ┌───────┴────────┐
         ▼                ▼
  [Wallet.enviar()]   [Stripe ACP]
   (pagos crypto)     (pagos fiat)
         │                │
         ▼                ▼
   On-chain tx       SPT → Comercio
```

## PayPal AP2 (Agent Payments Protocol)

Protocolo de Google y PayPal basado en mandatos firmados criptograficamente.

### Mandatos Firmados

```
Estructura del mandato:
{
  "agent_id": "smart-wallet-agent-001",
  "user_intent": "Pagar servicio X hasta $Y mensuales",
  "max_per_tx": 50000,       // en centavos ARS
  "max_monthly": 200000,     // limite mensual
  "merchant_whitelist": ["merchant_abc", "merchant_def"],
  "valid_until": "2026-04-30",
  "signature": "0x..."       // firma del usuario
}
```

**Garantias del protocolo**:
- Cada transaccion del agente captura la intencion original del usuario
- Mandato firmado criptograficamente → no falsificable
- Limites granulares: por transaccion, mensual, por comercio
- Audit trail completo: cada pago vinculado al mandato que lo autorizo

### Flujo con la Wallet

```
1. Usuario firma mandato AP2 (una vez, via Metamask)
2. Agente almacena mandato firmado
3. Cuando necesita pagar:
   a. Verifica que el pago esta dentro de los limites del mandato
   b. Presenta mandato + detalles del pago a PayPal
   c. PayPal valida firma y limites
   d. Pago ejecutado
4. Si excede limites → rechazado, usuario notificado
```

## Tabla Comparativa

| Caracteristica | Stripe ACP (SPT) | PayPal AP2 (Mandatos) |
|---------------|-------------------|----------------------|
| Autorizacion | Token por comercio/monto | Mandato firmado con multiples limites |
| Granularidad | Por transaccion individual | Por periodo + comercio |
| Revocacion | Instantanea via API | Revocacion del mandato |
| Crypto nativo | Parcial (via Stripe crypto) | No (fiat only) |
| Auditabilidad | Log de uso de SPT | Mandato + firma como prueba |
| Mejor para | Pagos puntuales del agente | Suscripciones/pagos recurrentes |

## Implementacion en el Proyecto

```
agent/
  integrations/
    stripe-acp.ts       → Cliente SPT, creacion/revocacion de tokens
    paypal-ap2.ts        → Gestion de mandatos firmados
    payment-router.ts    → Decide ACP vs AP2 segun tipo de pago
```

**Logica del payment router**:
- Pago unico a comercio nuevo → Stripe ACP (SPT acotado)
- Pago recurrente/suscripcion → PayPal AP2 (mandato con limites mensuales)
- Pago crypto on-chain → Wallet.enviar() directo
- Off-ramp crypto→ARS → Wallet.enviar() a contrato de conversion + QR
