// Chat Handler — POST /api/chat endpoint
// Keyword-based intent detection in Spanish, reads from Supabase via db layer
// Returns natural, concise responses in Argentine Spanish

import { db } from "../db/database.js";
import { MOCK_PRICES } from "../constants.js";

// ── Intent detection by keywords ──────────────────────

const INTENTS = [
  {
    id: "balance",
    keywords: ["balance", "cuanto tengo", "cuánto tengo", "plata", "saldo", "mis fondos"],
    handler: handleBalance,
  },
  {
    id: "transfer",
    keywords: ["enviar", "mandar", "transferir", "enviale", "mandale", "pasale"],
    handler: handleTransfer,
  },
  {
    id: "yield",
    keywords: ["invertir", "yield", "rendimiento", "inversiones", "inversion", "inversión", "rendir"],
    handler: handleYield,
  },
  {
    id: "strongbox",
    keywords: ["ahorro", "caja fuerte", "strongbox", "boveda", "bóveda", "caja"],
    handler: handleStrongbox,
  },
  {
    id: "history",
    keywords: ["historial", "movimientos", "ultimos", "últimos", "transacciones", "operaciones"],
    handler: handleHistory,
  },
  {
    id: "help",
    keywords: ["ayuda", "help", "que puedo hacer", "qué puedo hacer", "comandos", "opciones"],
    handler: handleHelp,
  },
];

function detectIntent(message) {
  const normalized = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  let bestMatch = null;
  let bestLen = 0;

  for (const intent of INTENTS) {
    for (const kw of intent.keywords) {
      const kwNorm = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalized.includes(kwNorm) && kwNorm.length > bestLen) {
        bestLen = kwNorm.length;
        bestMatch = intent;
      }
    }
  }

  return bestMatch;
}

// ── Intent Handlers ───────────────────────────────────

async function handleBalance({ wallet_address }) {
  if (!wallet_address) {
    return {
      text: "No tengo una wallet vinculada. Primero necesito tu direccion de wallet para consultar el balance.",
      tool: "wallet_balance",
    };
  }

  const wallet = await db.getWallet(wallet_address);
  if (!wallet) {
    return {
      text: `No encontre la wallet ${wallet_address.slice(0, 8)}... Revisala y volve a intentar.`,
      tool: "wallet_balance",
    };
  }

  const balances = wallet.balances || {};
  const prices = MOCK_PRICES;
  let totalUsd = 0;
  const lines = [];

  for (const [token, amount] of Object.entries(balances)) {
    const amt = parseFloat(amount);
    if (amt <= 0) continue;
    const usd = amt * (prices[token] || 0);
    totalUsd += usd;
    lines.push(`  ${token}: ${amt.toLocaleString("es-AR")} (~$${usd.toFixed(2)})`);
  }

  // Check for strongbox balance
  const investments = await db.getInvestments(wallet_address);
  let strongboxTotal = 0;
  for (const inv of investments) {
    strongboxTotal += parseFloat(inv.amount_usd || inv.amount || "0");
  }

  if (lines.length === 0 && strongboxTotal === 0) {
    return {
      text: "Tu wallet esta vacia. Deposita fondos para empezar a operar.",
      tool: "wallet_balance",
      data: { total_usd: "0.00", balances: {} },
    };
  }

  let text = `Tenes $${totalUsd.toFixed(2)} USD en tu wallet`;
  if (strongboxTotal > 0) {
    text += ` y $${strongboxTotal.toFixed(2)} en inversiones`;
  }
  text += ".\n\nDetalle:\n" + (lines.length > 0 ? lines.join("\n") : "  (sin tokens en wallet)");
  if (strongboxTotal > 0) {
    text += `\n  Inversiones: $${strongboxTotal.toFixed(2)}`;
  }

  return {
    text,
    tool: "wallet_balance",
    data: { total_usd: totalUsd.toFixed(2), balances, investments_usd: strongboxTotal.toFixed(2) },
  };
}

async function handleTransfer({ wallet_address, message }) {
  if (!wallet_address) {
    return {
      text: "Necesito tu wallet vinculada para preparar una transferencia. Conecta tu wallet primero.",
      tool: "wallet_transfer",
    };
  }

  // Try to extract amount and destination from message
  const normalized = message.toLowerCase();
  const amountMatch = normalized.match(/(\d+[\.,]?\d*)\s*(usdt|usdc|busd|bnb|rbtc)?/i);
  const addrMatch = message.match(/0x[a-fA-F0-9]{40}/);

  const amount = amountMatch ? amountMatch[1].replace(",", ".") : null;
  const token = amountMatch && amountMatch[2] ? amountMatch[2].toUpperCase() : null;
  const destination = addrMatch ? addrMatch[0] : null;

  const parts = [];
  if (!destination) parts.push("la direccion destino (0x...)");
  if (!amount) parts.push("el monto");
  if (!token) parts.push("el token (USDT, BNB, USDC)");

  if (parts.length > 0) {
    return {
      text: `Para preparar la transferencia necesito: ${parts.join(", ")}. Ejemplo: "enviar 100 USDT a 0x..."`,
      tool: "wallet_transfer",
      data: { status: "pending", from: wallet_address, to: destination, amount, token },
    };
  }

  // Log transfer intent (don't execute on-chain)
  const transferData = {
    status: "prepared",
    from: wallet_address,
    to: destination,
    amount,
    token,
    note: "Transferencia preparada, pendiente de confirmacion on-chain",
  };

  return {
    text: `Transferencia preparada: ${amount} ${token} de tu wallet a ${destination.slice(0, 8)}...${destination.slice(-4)}. Esta pendiente de confirmacion.`,
    tool: "wallet_transfer",
    data: transferData,
  };
}

async function handleYield({ wallet_address }) {
  if (!wallet_address) {
    return {
      text: "Conecta tu wallet para ver tus posiciones de yield.",
      tool: "yield_portfolio",
    };
  }

  const investments = await db.getInvestments(wallet_address);

  if (!investments || investments.length === 0) {
    return {
      text: "No tenes inversiones activas. Las estrategias disponibles son:\n" +
        "  1. Ahorro estable: 3.5% APY (bajo riesgo)\n" +
        "  2. Venus USDT: 4.2% APY\n" +
        "  3. Venus BNB: 2.8% APY\n" +
        "  4. Rootstock rBTC: 10.5% APY (riesgo medio)\n" +
        "  5. Venus-RSK spread: 5.3% APY neto\n\n" +
        'Decime "invertir" seguido del monto para empezar.',
      tool: "yield_strategies",
      data: { active_positions: 0 },
    };
  }

  let totalInvested = 0;
  const lines = [];
  for (const inv of investments) {
    const amount = parseFloat(inv.amount || "0");
    totalInvested += parseFloat(inv.amount_usd || amount);
    const strategy = inv.strategy_id || inv.strategy || "desconocida";
    const apy = inv.apy || "?";
    lines.push(`  ${strategy}: ${amount} ${inv.token || "USDT"} (${apy}% APY)`);
  }

  return {
    text: `Tenes ${investments.length} posicion(es) activa(s) por ~$${totalInvested.toFixed(2)} USD:\n${lines.join("\n")}`,
    tool: "yield_portfolio",
    data: { active_positions: investments.length, total_invested_usd: totalInvested.toFixed(2), positions: investments },
  };
}

async function handleStrongbox({ wallet_address }) {
  if (!wallet_address) {
    return {
      text: "Conecta tu wallet para ver info de tu caja fuerte.",
      tool: "strongbox_info",
    };
  }

  // Check investments as proxy for strongbox data
  const investments = await db.getInvestments(wallet_address);
  const wallet = await db.getWallet(wallet_address);

  let strongboxAmount = 0;
  for (const inv of investments) {
    if (inv.strategy_id === "stable-savings" || inv.strategy_id === "strongbox") {
      strongboxAmount += parseFloat(inv.amount_usd || inv.amount || "0");
    }
  }

  if (strongboxAmount === 0) {
    return {
      text: 'Tu caja fuerte esta vacia. Podes depositar diciendo "invertir en ahorro estable". La caja fuerte incluye Dead Man\'s Switch (1 anio) y herencia con guardianes.',
      tool: "strongbox_info",
      data: { balance_usd: "0.00", dead_man_switch: "activo", heir_guardians: 0 },
    };
  }

  return {
    text: `Tu caja fuerte tiene $${strongboxAmount.toFixed(2)} USD.\n` +
      `Dead Man's Switch: activo (1 anio)\n` +
      `Herederos: consultalo con "configurar heredero"`,
    tool: "strongbox_info",
    data: { balance_usd: strongboxAmount.toFixed(2), dead_man_switch: "activo" },
  };
}

async function handleHistory({ wallet_address }) {
  if (!wallet_address) {
    return {
      text: "Conecta tu wallet para ver tus movimientos recientes.",
      tool: "transaction_history",
    };
  }

  const transactions = await db.getTransactions(wallet_address, { limit: 10, type: "all" });

  if (!transactions || transactions.length === 0) {
    return {
      text: "No tenes movimientos todavia.",
      tool: "transaction_history",
      data: { transactions: [] },
    };
  }

  const lines = transactions.map((tx) => {
    const direction = tx.from_wallet === wallet_address ? "Enviaste" : "Recibiste";
    const amount = tx.amount || "?";
    const token = tx.token || "USDT";
    const date = tx.created_at ? new Date(tx.created_at).toLocaleDateString("es-AR") : "";
    const type = tx.type || "transferencia";
    return `  ${date} | ${direction} ${amount} ${token} (${type})`;
  });

  return {
    text: `Ultimos ${transactions.length} movimientos:\n${lines.join("\n")}`,
    tool: "transaction_history",
    data: { count: transactions.length, transactions },
  };
}

async function handleHelp() {
  return {
    text: "Puedo ayudarte con:\n" +
      '  "cuanto tengo" - Ver tu balance\n' +
      '  "enviar 100 USDT a 0x..." - Preparar una transferencia\n' +
      '  "invertir" o "rendimiento" - Ver o crear inversiones\n' +
      '  "caja fuerte" - Info de tu caja fuerte y herencia\n' +
      '  "historial" o "movimientos" - Ver transacciones recientes\n' +
      '  "ayuda" - Este mensaje\n\n' +
      "Escribime lo que necesites en lenguaje natural.",
    tool: "help",
  };
}

// ── Main Route Handler ────────────────────────────────

export async function chatHandler(req, res) {
  // Expect body already parsed (JSON)
  const { message, wallet_address, user_id } = req.body || {};

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "El campo 'message' es requerido." });
    return;
  }

  const intent = detectIntent(message);

  let response;

  if (intent) {
    response = await intent.handler({ wallet_address, user_id, message });
  } else {
    response = {
      text: "No entendi tu mensaje. Proba con:\n" +
        '  "cuanto tengo" para ver tu balance\n' +
        '  "enviar" para transferir\n' +
        '  "invertir" para ver inversiones\n' +
        '  "historial" para ver movimientos\n' +
        '  "ayuda" para ver todos los comandos',
    };
  }

  // Log the interaction to agent_decisions
  try {
    await db.logAgentDecision({
      user_id: user_id || null,
      wallet_address: wallet_address || null,
      message,
      intent: intent ? intent.id : "unknown",
      tool: response.tool || null,
      response: response.text,
      data: response.data || null,
    });
  } catch (err) {
    console.error("[chat-handler] Error logging agent decision:", err.message);
  }

  res.status(200).json({
    text: response.text,
    tool: response.tool || undefined,
    data: response.data || undefined,
  });
}

// ── Express Router (standalone usage) ─────────────────

export function createChatRouter(expressApp) {
  expressApp.post("/api/chat", chatHandler);
  return expressApp;
}
