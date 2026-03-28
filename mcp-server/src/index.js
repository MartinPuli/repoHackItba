// Smart Wallet MCP Server
// Rail de pagos y wallet para humanos y agentes AI
// Cualquier agente MCP-compatible puede: abrir wallet, depositar, pagar, invertir, cobrar

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { WalletManager } from "./tools/wallet-manager.js";
import { PaymentEngine } from "./tools/payment-engine.js";
import { InvestmentEngine } from "./tools/investment-engine.js";
import { ComplianceEngine } from "./tools/compliance-engine.js";
import { LendingEngine } from "./tools/lending-engine.js";
import { AgentOrchestrator } from "./tools/agent-orchestrator.js";
import { ChannelManager } from "./channels/channel-manager.js";
import { TelegramBot } from "./channels/telegram-bot.js";
import { WhatsAppBot } from "./channels/whatsapp-bot.js";
import { HttpServer } from "./channels/http-server.js";
import { db } from "./db/database.js";

const server = new McpServer({
  name: "smartwallet",
  version: "0.1.0",
  description: "Smart Wallet Agent-First — Rail de pagos y wallet para humanos y agentes AI. Abrí tu wallet, depositá, pagá, invertí, cobrá. Pedí préstamos con colateral crypto.",
});

const walletManager = new WalletManager(db);
const paymentEngine = new PaymentEngine(db);
const investmentEngine = new InvestmentEngine(db);
const complianceEngine = new ComplianceEngine(db);
const lendingEngine = new LendingEngine(db);
const orchestrator = new AgentOrchestrator({ walletManager, paymentEngine, investmentEngine, complianceEngine, lendingEngine, db });

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
// LENDING TOOLS — Préstamos con colateral crypto
// ═══════════════════════════════════════════════════════════

server.tool(
  "loan_options",
  "Ver opciones de préstamo disponibles según tu colateral. Muestra cuánto podés pedir prestado contra tus tokens.",
  {
    wallet_address: z.string().describe("Dirección de la wallet"),
  },
  async (params) => {
    const result = await lendingEngine.getLoanOptions(params);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "loan_take",
  "Pedir un préstamo usando tokens como colateral. El colateral se bloquea y recibís los tokens prestados en tu wallet.",
  {
    wallet_address: z.string().describe("Wallet que toma el préstamo"),
    collateral_token: z.enum(["BNB", "USDT", "USDC", "BUSD", "rBTC"]).describe("Token a usar como colateral"),
    collateral_amount: z.string().describe("Cantidad de colateral a depositar"),
    borrow_token: z.enum(["BNB", "USDT", "USDC", "BUSD", "rBTC"]).describe("Token que querés pedir prestado"),
    borrow_amount: z.string().describe("Cantidad a pedir prestada"),
  },
  async (params) => {
    const compliance = await complianceEngine.checkLoan(params);
    if (!compliance.approved) {
      return { content: [{ type: "text", text: JSON.stringify({ error: "Compliance check failed", reason: compliance.reason }, null, 2) }] };
    }
    const result = await lendingEngine.takeLoan(params);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "loan_repay",
  "Repagar un préstamo activo. Podés pagar parcial o total. Si pagás todo, tu colateral se desbloquea.",
  {
    wallet_address: z.string().describe("Wallet con el préstamo activo"),
    amount: z.string().describe("Monto a repagar (o 'all' para repago total)"),
  },
  async (params) => {
    const result = await lendingEngine.repayLoan(params);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  "loan_status",
  "Ver estado de tus préstamos activos: deuda, interés acumulado, health factor, riesgo de liquidación.",
  {
    wallet_address: z.string().describe("Dirección de la wallet"),
  },
  async (params) => {
    const result = await lendingEngine.getLoanStatus(params.wallet_address);
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
            "Crypto-collateralized loans (borrow against your tokens)",
            "UIF/CNV compliance checks",
            "KYA (Know Your Agent) verification",
            "Agent-to-agent payments",
            "Agent service billing",
            "Dead Man's Switch for crypto inheritance",
          ],
          fees: {
            internal_transfer: "0%",
            external_withdrawal: "0.1%",
            yield_performance: "5% of profits",
            loan_interest: "3.5-5.2% APY (varies by token)",
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

// ═══════════════════════════════════════════════════════════
// AGENT CHAT — Natural language interface (para el viejo que pregunta)
// ═══════════════════════════════════════════════════════════

server.tool(
  "agent_chat",
  "Hablale al agente en lenguaje natural. Ej: 'quiero invertir 100 USDT', 'cuánto tengo', 'necesito un préstamo'. El agente entiende qué hacer y ejecuta la acción.",
  {
    message: z.string().describe("Mensaje en lenguaje natural del usuario"),
    wallet_address: z.string().optional().describe("Wallet del usuario (si ya tiene una)"),
  },
  async (params) => {
    const result = await orchestrator.processMessage(params.message, params.wallet_address);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ═══════════════════════════════════════════════════════════
// CHANNEL CONFIG TOOLS — Configurar canales de comunicación
// ═══════════════════════════════════════════════════════════

// Initialize multi-channel system
const channelMgr = new ChannelManager({ orchestrator, db });

// Register app channel (always available)
channelMgr.registerChannel({ id: "app", type: "app", enabled: true });

// Telegram bot (optional, needs TELEGRAM_BOT_TOKEN env)
const telegramBot = new TelegramBot({
  channelManager: channelMgr,
  token: process.env.TELEGRAM_BOT_TOKEN,
});

// WhatsApp bot (optional, needs Twilio env vars)
const whatsAppBot = new WhatsAppBot({
  channelManager: channelMgr,
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886",
});

server.tool(
  "channel_list",
  "Ver los canales de comunicación configurados (app, telegram, whatsapp).",
  {},
  async () => {
    return {
      content: [{ type: "text", text: JSON.stringify({ channels: channelMgr.getChannels() }, null, 2) }],
    };
  }
);

server.tool(
  "channel_configure",
  "Configurar un canal de comunicación. Habilitar/deshabilitar telegram o whatsapp.",
  {
    channel: z.enum(["telegram", "whatsapp", "app"]).describe("Canal a configurar"),
    enabled: z.boolean().describe("Habilitar o deshabilitar el canal"),
    config: z.object({
      bot_token: z.string().optional().describe("Token del bot de Telegram"),
      twilio_sid: z.string().optional().describe("Twilio Account SID para WhatsApp"),
      twilio_token: z.string().optional().describe("Twilio Auth Token"),
      twilio_number: z.string().optional().describe("Número de WhatsApp de Twilio"),
    }).optional().describe("Configuración específica del canal"),
  },
  async (params) => {
    const result = channelMgr.updateChannel(params.channel, {
      enabled: params.enabled,
      config: params.config,
    });

    if (!result.success) {
      // Register if doesn't exist
      channelMgr.registerChannel({
        id: params.channel,
        type: params.channel,
        enabled: params.enabled,
        config: params.config,
      });
    }

    return {
      content: [{ type: "text", text: JSON.stringify({
        success: true,
        channel: params.channel,
        enabled: params.enabled,
        message: params.enabled
          ? `Canal ${params.channel} habilitado.`
          : `Canal ${params.channel} deshabilitado.`,
      }, null, 2) }],
    };
  }
);

server.tool(
  "channel_link_wallet",
  "Vincular una wallet a un usuario en un canal específico. Así cuando escriba por Telegram/WhatsApp, el agente sabe qué wallet usar.",
  {
    channel: z.enum(["telegram", "whatsapp", "app"]).describe("Canal"),
    user_id: z.string().describe("ID del usuario en el canal (telegram user ID, número de WhatsApp, etc.)"),
    wallet_address: z.string().describe("Dirección de la wallet a vincular"),
  },
  async (params) => {
    const result = channelMgr.linkWallet(params.channel, params.user_id, params.wallet_address);
    return {
      content: [{ type: "text", text: JSON.stringify({
        ...result,
        message: `Wallet ${params.wallet_address} vinculada al usuario ${params.user_id} en canal ${params.channel}.`,
      }, null, 2) }],
    };
  }
);

// ═══════════════════════════════════════════════════════════
// START EVERYTHING
// ═══════════════════════════════════════════════════════════

// Start MCP server (stdio)
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Smart Wallet MCP Server running on stdio");

// Start HTTP API server for frontend + webhooks
const httpServer = new HttpServer({
  channelManager: channelMgr,
  whatsAppBot,
  port: parseInt(process.env.API_PORT || "3001"),
});
httpServer.start();

// Start Telegram bot (if token configured)
if (process.env.TELEGRAM_BOT_TOKEN) {
  telegramBot.start();
}

// Initialize WhatsApp (if Twilio configured)
if (process.env.TWILIO_ACCOUNT_SID) {
  whatsAppBot.init();
}
