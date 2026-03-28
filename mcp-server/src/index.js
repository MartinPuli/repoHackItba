// Smart Wallet MCP Server
// Rail de pagos y wallet para humanos y agentes AI
// Cualquier agente MCP-compatible puede: abrir wallet, depositar, pagar, invertir, cobrar

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { WalletManager } from "./tools/wallet-manager.js";
import { PaymentEngine } from "./tools/payment-engine.js";
import { InvestmentEngine } from "./tools/investment-engine.js";
import { ComplianceEngine } from "./tools/compliance-engine.js";
import { db } from "./db/database.js";

const server = new McpServer({
  name: "smartwallet",
  version: "0.1.0",
  description: "Smart Wallet Agent-First — Rail de pagos y wallet para humanos y agentes AI. Abrí tu wallet, depositá, pagá, invertí, cobrá.",
});

const walletManager = new WalletManager(db);
const paymentEngine = new PaymentEngine(db);
const investmentEngine = new InvestmentEngine(db);
const complianceEngine = new ComplianceEngine(db);

// ═══════════════════════════════════════════════════════════
// WALLET TOOLS — Crear, consultar, administrar wallets
// ═══════════════════════════════════════════════════════════

server.tool(
  "wallet_create",
  "Crear una nueva Smart Wallet. Funciona tanto para humanos como para agentes AI. Devuelve la dirección de la wallet creada.",
  {
    owner_email: z.string().email().describe("Email del dueño (humano o del operador del agente)"),
    owner_name: z.string().min(1).describe("Nombre del dueño o identificador del agente"),
    owner_type: z.enum(["human", "agent"]).describe("Tipo de dueño: human o agent"),
    agent_id: z.string().optional().describe("ID único del agente (solo si owner_type es agent)"),
    agent_platform: z.string().optional().describe("Plataforma del agente: claude, openai, gemini, openclaw, etc."),
  },
  async (params) => {
    const result = await walletManager.createWallet(params);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "wallet_balance",
  "Consultar el balance de una wallet. Muestra todos los tokens y su valor en USD.",
  {
    wallet_address: z.string().describe("Dirección de la wallet"),
  },
  async (params) => {
    const result = await walletManager.getBalance(params.wallet_address);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "wallet_info",
  "Obtener información completa de una wallet: dueño, tipo, balances, historial reciente.",
  {
    wallet_address: z.string().describe("Dirección de la wallet"),
  },
  async (params) => {
    const result = await walletManager.getWalletInfo(params.wallet_address);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ═══════════════════════════════════════════════════════════
// PAYMENT TOOLS — Depositar, retirar, transferir, cobrar
// ═══════════════════════════════════════════════════════════

server.tool(
  "wallet_deposit",
  "Depositar fondos en una wallet. Genera una dirección de depósito o procesa un depósito directo.",
  {
    wallet_address: z.string().describe("Dirección de la wallet destino"),
    amount: z.string().describe("Monto a depositar (en formato string para precisión)"),
    token: z.enum(["BNB", "USDT", "USDC", "BUSD", "rBTC"]).describe("Token a depositar"),
    source: z.enum(["external", "onramp"]).default("external").describe("Fuente: transferencia externa o compra con fiat"),
  },
  async (params) => {
    const compliance = await complianceEngine.checkDeposit(params);
    if (!compliance.approved) {
      return { content: [{ type: "text", text: JSON.stringify({ error: "Compliance check failed", reason: compliance.reason }, null, 2) }] };
    }
    const result = await paymentEngine.deposit(params);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "wallet_withdraw",
  "Retirar fondos de una wallet a una dirección externa o a fiat.",
  {
    wallet_address: z.string().describe("Dirección de la wallet origen"),
    amount: z.string().describe("Monto a retirar"),
    token: z.enum(["BNB", "USDT", "USDC", "BUSD", "rBTC"]).describe("Token a retirar"),
    destination: z.string().describe("Dirección destino o 'fiat' para off-ramp"),
  },
  async (params) => {
    const compliance = await complianceEngine.checkWithdraw(params);
    if (!compliance.approved) {
      return { content: [{ type: "text", text: JSON.stringify({ error: "Compliance check failed", reason: compliance.reason }, null, 2) }] };
    }
    const result = await paymentEngine.withdraw(params);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "wallet_transfer",
  "Transferir fondos entre wallets de la plataforma. Instantáneo y sin gas para transfers internos.",
  {
    from_wallet: z.string().describe("Wallet origen"),
    to_wallet: z.string().describe("Wallet destino"),
    amount: z.string().describe("Monto a transferir"),
    token: z.enum(["BNB", "USDT", "USDC", "BUSD", "rBTC"]).describe("Token"),
    memo: z.string().optional().describe("Nota o referencia del pago"),
  },
  async (params) => {
    const compliance = await complianceEngine.checkTransfer(params);
    if (!compliance.approved) {
      return { content: [{ type: "text", text: JSON.stringify({ error: "Compliance check failed", reason: compliance.reason }, null, 2) }] };
    }
    const result = await paymentEngine.transfer(params);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "wallet_pay",
  "Realizar un pago a otro usuario/agente. Puede incluir referencia de factura o servicio.",
  {
    from_wallet: z.string().describe("Wallet que paga"),
    to_wallet: z.string().describe("Wallet que cobra"),
    amount: z.string().describe("Monto del pago"),
    token: z.enum(["BNB", "USDT", "USDC", "BUSD"]).describe("Token de pago"),
    concept: z.string().describe("Concepto del pago: factura, servicio, suscripción, etc."),
    invoice_id: z.string().optional().describe("ID de factura si aplica"),
  },
  async (params) => {
    const compliance = await complianceEngine.checkPayment(params);
    if (!compliance.approved) {
      return { content: [{ type: "text", text: JSON.stringify({ error: "Compliance check failed", reason: compliance.reason }, null, 2) }] };
    }
    const result = await paymentEngine.pay(params);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "wallet_request_payment",
  "Solicitar un pago a otro wallet. Genera un link/request que el pagador puede aprobar.",
  {
    requester_wallet: z.string().describe("Wallet que solicita el cobro"),
    payer_wallet: z.string().optional().describe("Wallet al que se le cobra (opcional, puede ser público)"),
    amount: z.string().describe("Monto a cobrar"),
    token: z.enum(["BNB", "USDT", "USDC", "BUSD"]).describe("Token"),
    concept: z.string().describe("Concepto del cobro"),
    expires_in_hours: z.number().default(24).describe("Horas hasta que expira el request"),
  },
  async (params) => {
    const result = await paymentEngine.requestPayment(params);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ═══════════════════════════════════════════════════════════
// INVESTMENT TOOLS — Yield, estrategias, CajaFuerte
// ═══════════════════════════════════════════════════════════

server.tool(
  "yield_strategies",
  "Listar las estrategias de inversión disponibles con sus APY estimados y niveles de riesgo.",
  {},
  async () => {
    const result = await investmentEngine.getStrategies();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "yield_invest",
  "Invertir fondos de la wallet en una estrategia de yield. Mueve fondos a la CajaFuerte.",
  {
    wallet_address: z.string().describe("Wallet origen"),
    strategy_id: z.string().describe("ID de la estrategia (ej: venus-bnb, rsk-rbtc, stable-lending)"),
    amount: z.string().describe("Monto a invertir"),
    token: z.enum(["BNB", "USDT", "USDC", "BUSD", "rBTC"]).describe("Token a invertir"),
  },
  async (params) => {
    const compliance = await complianceEngine.checkInvestment(params);
    if (!compliance.approved) {
      return { content: [{ type: "text", text: JSON.stringify({ error: "Compliance check failed", reason: compliance.reason }, null, 2) }] };
    }
    const result = await investmentEngine.invest(params);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "yield_withdraw",
  "Retirar fondos de una estrategia de inversión de vuelta a la wallet.",
  {
    wallet_address: z.string().describe("Wallet destino"),
    strategy_id: z.string().describe("ID de la estrategia"),
    amount: z.string().describe("Monto a retirar (o 'all' para todo)"),
  },
  async (params) => {
    const result = await investmentEngine.withdrawInvestment(params);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "yield_portfolio",
  "Ver el portfolio de inversiones activas de una wallet.",
  {
    wallet_address: z.string().describe("Dirección de la wallet"),
  },
  async (params) => {
    const result = await investmentEngine.getPortfolio(params.wallet_address);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ═══════════════════════════════════════════════════════════
// COMPLIANCE TOOLS — UIF/CNV checks, límites, KYA
// ═══════════════════════════════════════════════════════════

server.tool(
  "compliance_status",
  "Ver el estado de compliance de una wallet: nivel de verificación, límites, alertas.",
  {
    wallet_address: z.string().describe("Dirección de la wallet"),
  },
  async (params) => {
    const result = await complianceEngine.getStatus(params.wallet_address);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "compliance_verify",
  "Iniciar o completar verificación KYC/KYA para subir el nivel de una wallet.",
  {
    wallet_address: z.string().describe("Dirección de la wallet"),
    verification_level: z.enum(["basic", "standard", "full"]).describe("Nivel de verificación deseado"),
    data: z.object({
      full_name: z.string().optional(),
      document_type: z.string().optional(),
      document_number: z.string().optional(),
      country: z.string().optional(),
    }).describe("Datos de verificación"),
  },
  async (params) => {
    const result = await complianceEngine.verify(params);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ═══════════════════════════════════════════════════════════
// DISCOVERY TOOLS — Para que agentes descubran qué pueden hacer
// ═══════════════════════════════════════════════════════════

server.tool(
  "platform_info",
  "Información de la plataforma: qué tokens soporta, qué cadenas, fees, y cómo funciona.",
  {},
  async () => {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          name: "Smart Wallet Agent-First",
          description: "Plataforma de pagos y wallet para humanos y agentes AI. Abrí tu wallet, depositá, pagá, invertí, cobrá.",
          supported_chains: ["BSC Testnet", "Rootstock Testnet"],
          supported_tokens: ["BNB", "USDT", "USDC", "BUSD", "rBTC"],
          features: [
            "Wallet creation for humans and AI agents",
            "Internal transfers (gasless, instant)",
            "External deposits and withdrawals",
            "Payment requests and invoicing",
            "DeFi yield strategies (Venus, Rootstock)",
            "UIF/CNV compliance checks",
            "KYA (Know Your Agent) verification",
            "Agent-to-agent payments",
            "Agent service billing",
          ],
          fees: {
            internal_transfer: "0%",
            external_withdrawal: "0.1%",
            yield_performance: "5% of profits",
            onramp: "1.5%",
            offramp: "1.5%",
          },
          onboarding: "Call wallet_create with your email and info. That's it.",
        }, null, 2),
      }],
    };
  }
);

server.tool(
  "transaction_history",
  "Ver el historial de transacciones de una wallet.",
  {
    wallet_address: z.string().describe("Dirección de la wallet"),
    limit: z.number().default(20).describe("Cantidad de transacciones a mostrar"),
    type: z.enum(["all", "deposits", "withdrawals", "transfers", "payments", "investments"]).default("all").describe("Filtro por tipo"),
  },
  async (params) => {
    const result = await paymentEngine.getHistory(params);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Smart Wallet MCP Server running on stdio");
