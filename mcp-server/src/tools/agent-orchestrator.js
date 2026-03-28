// Agent Orchestrator — Gemini AI + NLP fallback → MCP tool routing
// Architecture: Orchestrator (cheap model) classifies → sub-agents execute
// Guard: if no wallet, blocks and guides to onboarding
// Sub-agents: WalletAgent (payments/wallet), InvestAgent (yield/lending), InfoAgent (general/compliance)
// Works from: App, Telegram, WhatsApp, MCP (other agents)

const GEMINI_KEY = process.env.GEMINI_API_KEY;

const MODELS = {
  orchestrator: 'gemini-2.5-flash-lite',
  wallet_agent: 'gemini-2.5-flash',
  invest_agent: 'gemini-2.5-flash',
  info_agent:   'gemini-2.0-flash',
  guard:        'gemini-2.5-flash-lite',
};

const SUB_AGENT_PROMPTS = {
  orchestrator: `Sos el orquestador de Smart Wallet. Tu UNICO trabajo es clasificar el mensaje del usuario.
Responde SOLO con JSON valido, nada mas.

Categorias:
- "guard" → El usuario NO tiene wallet (has_wallet=false). SIEMPRE guard si no tiene wallet, EXCEPTO si quiere crear una (ahi va wallet_agent).
- "wallet_agent" → Crear wallet, ver balance, depositar, retirar, transferir, pagar, cobrar.
- "invest_agent" → Invertir, yield, estrategias, prestamos, colateral, DeFi, rendimientos.
- "info_agent" → Verificacion KYC, compliance, historial, info plataforma, preguntas generales, saludos, caja fuerte, herencia.

Responde asi: {"agent":"<categoria>","tool_hint":"<tool>","reason":"<1 linea>"}

Tools: wallet_create, wallet_balance, wallet_info, wallet_deposit, wallet_withdraw, wallet_transfer, wallet_pay, wallet_request_payment, yield_strategies, yield_invest, yield_withdraw, yield_portfolio, loan_options, loan_take, loan_repay, loan_status, strongbox_create, strongbox_set_heir, strongbox_info, compliance_verify, compliance_status, platform_info, transaction_history`,

  guard: `Sos el asistente de bienvenida de Smart Wallet. El usuario NO tiene wallet.
Hablas en espanol argentino informal (vos, che, dale).
- Decile que necesita crear su wallet primero
- Que escriba "quiero crear mi wallet"
- Si pregunta que puede hacer, contale las funciones
- Ser amigable y motivarlo
Responde en 2-3 oraciones.`,

  wallet_agent: `Sos el Wallet Agent de Smart Wallet, experto en pagos y movimientos.
Hablas en espanol argentino informal.
Ayudas con depositos, retiros, transferencias y pagos.
Responde conciso (2-3 oraciones). Usa datos del contexto.`,

  invest_agent: `Sos el Investment Agent de Smart Wallet, experto en DeFi y rendimientos.
Hablas en espanol argentino informal.
Conoces Venus BSC, Rootstock rBTC, stable savings.
Ayudas con yield, prestamos, position sizing.
Responde conciso. Da numeros. Aclara que no es consejo financiero.`,

  info_agent: `Sos el Info Agent de Smart Wallet.
Hablas en espanol argentino informal.
Explicas la plataforma, guias en KYC, mostras historial, gestionas caja fuerte y herencia.
Responde conciso y claro.`,
};

async function callGemini(model, systemPrompt, userMessage, config = {}) {
  if (!GEMINI_KEY) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: config.temperature ?? 0.3,
          maxOutputTokens: config.maxTokens ?? 200,
          topP: 0.9,
        }
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    console.error('[Gemini] Error:', e.message);
    return null;
  }
}

export class AgentOrchestrator {
  constructor({ walletManager, paymentEngine, investmentEngine, complianceEngine, lendingEngine, db }) {
    this.walletManager = walletManager;
    this.paymentEngine = paymentEngine;
    this.investmentEngine = investmentEngine;
    this.complianceEngine = complianceEngine;
    this.lendingEngine = lendingEngine;
    this.db = db;
    this.pendingFlows = new Map();

    this.intents = [
      { patterns: ["crear wallet", "crear mi wallet", "abrir cuenta", "nueva wallet", "registrarme", "quiero empezar", "crear mi billetera", "abrir wallet", "crear cuenta", "quiero una wallet", "dame una wallet", "abrir mi wallet", "necesito wallet", "necesito una wallet", "quiero wallet"],
        tool: "wallet_create", category: "wallet" },
      { patterns: ["balance", "cuanto tengo", "mis fondos", "saldo", "cuanta plata", "mi balance", "mi plata"],
        tool: "wallet_balance", category: "wallet" },
      { patterns: ["info wallet", "mi cuenta", "datos de mi wallet", "informacion", "mi wallet"],
        tool: "wallet_info", category: "wallet" },
      { patterns: ["depositar", "meter plata", "cargar", "ingresar fondos", "poner plata"],
        tool: "wallet_deposit", category: "payment" },
      { patterns: ["retirar", "sacar plata", "sacar fondos", "retirar fondos", "quiero sacar"],
        tool: "wallet_withdraw", category: "payment" },
      { patterns: ["transferir", "mandar plata", "enviar", "pasar fondos", "mandale"],
        tool: "wallet_transfer", category: "payment" },
      { patterns: ["pagar", "pago", "abonar", "cobrar factura"],
        tool: "wallet_pay", category: "payment" },
      { patterns: ["cobrar", "pedir pago", "generar cobro", "link de pago", "que me paguen"],
        tool: "wallet_request_payment", category: "payment" },
      { patterns: ["invertir", "inversion", "poner a rendir", "rendimiento", "yield", "meter en defi", "generar intereses"],
        tool: "yield_invest", category: "investment" },
      { patterns: ["estrategias", "opciones de inversion", "donde invertir", "que rinde", "que opciones hay"],
        tool: "yield_strategies", category: "investment" },
      { patterns: ["portfolio", "mis inversiones", "como van mis inversiones", "rendimientos"],
        tool: "yield_portfolio", category: "investment" },
      { patterns: ["retirar inversion", "sacar inversion", "rescatar", "desinvertir"],
        tool: "yield_withdraw", category: "investment" },
      { patterns: ["prestamo", "pedir prestado", "necesito plata", "credito", "quiero un prestamo"],
        tool: "loan_take", category: "lending" },
      { patterns: ["opciones de prestamo", "cuanto puedo pedir", "colateral", "garantia"],
        tool: "loan_options", category: "lending" },
      { patterns: ["pagar prestamo", "devolver prestamo", "repagar", "cancelar deuda"],
        tool: "loan_repay", category: "lending" },
      { patterns: ["estado prestamo", "mi deuda", "cuanto debo", "health factor"],
        tool: "loan_status", category: "lending" },
      { patterns: ["caja fuerte", "strongbox", "crear caja fuerte", "crear strongbox", "quiero caja fuerte", "boveda", "ahorros largo plazo"],
        tool: "strongbox_create", category: "strongbox" },
      { patterns: ["heredero", "herederos", "configurar heredero", "guardian", "guardianes", "herencia"],
        tool: "strongbox_set_heir", category: "strongbox" },
      { patterns: ["info caja fuerte", "info strongbox", "estado caja fuerte", "dead man", "dead man switch", "mi caja fuerte"],
        tool: "strongbox_info", category: "strongbox" },
      { patterns: ["verificar", "kyc", "verificacion", "subir nivel", "identidad"],
        tool: "compliance_verify", category: "compliance" },
      { patterns: ["limites", "compliance", "estado de verificacion"],
        tool: "compliance_status", category: "compliance" },
      { patterns: ["que puedo hacer", "ayuda", "help", "como funciona", "que es esto", "que servicios", "explicame"],
        tool: "platform_info", category: "info" },
      { patterns: ["historial", "transacciones", "movimientos", "ultimas operaciones"],
        tool: "transaction_history", category: "info" },
    ];
  }

  // ── Main: AI orchestrator → sub-agent routing ───────

  async processMessage(message, wallet_address, sessionContext = {}) {
    const normalized = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const sessionKey = sessionContext.sessionKey || "default";
    const hasWallet = !!wallet_address;

    // 1. Check pending conversational flow
    const pendingFlow = this.pendingFlows.get(sessionKey);
    if (pendingFlow) {
      return this._continuePendingFlow(sessionKey, pendingFlow, message, normalized, sessionContext);
    }

    // 2. AI Orchestrator classifies intent (cheapest model)
    let routeTo = null;
    let toolHint = null;

    const orchContext = `ESTADO: has_wallet=${hasWallet}, wallet_address=${wallet_address || 'ninguna'}`;
    const aiClassification = await callGemini(
      MODELS.orchestrator,
      SUB_AGENT_PROMPTS.orchestrator + '\n' + orchContext,
      message,
      { temperature: 0.1, maxTokens: 100 }
    );

    if (aiClassification) {
      try {
        const cleaned = aiClassification.replace(/```json\n?/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        routeTo = parsed.agent;
        toolHint = parsed.tool_hint;
      } catch (e) { /* fallback to regex */ }
    }

    // 3. Fallback: regex intent detection if AI failed
    let intent = null;
    if (toolHint) intent = this.intents.find(i => i.tool === toolHint);
    if (!intent) intent = this._detectIntent(normalized);

    // 4. Guard: no wallet = no financial ops (except wallet_create and platform_info)
    if (!hasWallet && intent?.tool !== 'wallet_create' && intent?.tool !== 'platform_info') {
      const guardReply = await callGemini(MODELS.guard, SUB_AGENT_PROMPTS.guard, message, { maxTokens: 150 });
      return {
        understood: true,
        agent: 'guard',
        message: guardReply || "Todavia no tenes wallet. Escribi \"crear wallet\" para arrancar. 💳",
      };
    }

    // 5. No intent at all → AI info agent for general chat
    if (!intent) {
      const infoReply = await callGemini(MODELS.info_agent, SUB_AGENT_PROMPTS.info_agent, message, { maxTokens: 200 });
      if (infoReply) return { understood: true, agent: 'info_agent', message: infoReply };
      return {
        understood: false,
        message: "No entendi bien. Podes preguntarme sobre:\n💳 Crear wallet\n💰 Balance\n💸 Pagos\n📈 Inversiones\n🏦 Prestamos\n🔒 Verificacion\n📋 Historial",
      };
    }

    // 6. Extract parameters
    const params = this._extractParams(normalized, intent, wallet_address, sessionContext);

    // 7. Check missing data → conversational flow
    const missingData = this._checkMissingData(intent, params, wallet_address);
    if (missingData) {
      this.pendingFlows.set(sessionKey, { intent, params, step: missingData.step, steps: missingData.steps, collectedData: { ...params } });
      return { understood: true, tool: intent.tool, agent: routeTo || this._categorizeAgent(intent), awaiting_input: true, message: missingData.question };
    }

    // 8. Multi-agent consensus for critical ops
    if (this._isCriticalOperation(intent)) {
      const consensus = await this._runMultiAgentCheck(intent, params);
      if (!consensus.approved) {
        return { understood: true, tool: intent.tool, blocked: true, reason: consensus.reason, agent_votes: consensus.votes, message: `⛔ Operacion bloqueada: ${consensus.reason}` };
      }
    }

    // 9. Execute tool
    const result = await this._executeTool(intent.tool, params);
    const baseMessage = this._humanizeResult(intent.tool, result);
    const agent = routeTo || this._categorizeAgent(intent);

    // 10. AI commentary for complex operations
    let enrichedMessage = baseMessage;
    if (['yield_invest', 'loan_take', 'wallet_transfer'].includes(intent.tool) && result.success) {
      const agentModel = MODELS[agent] || MODELS.info_agent;
      const agentPrompt = SUB_AGENT_PROMPTS[agent] || SUB_AGENT_PROMPTS.info_agent;
      const commentary = await callGemini(agentModel, agentPrompt + '\nRESULTADO: ' + baseMessage,
        `El usuario ejecuto ${intent.tool}. Dame un comentario breve.`, { maxTokens: 100 });
      if (commentary) enrichedMessage = baseMessage + '\n\n💡 ' + commentary;
    }

    return { understood: true, tool: intent.tool, category: intent.category, agent, params_extracted: params, result, message: enrichedMessage };
  }

  _categorizeAgent(intent) {
    if (['wallet', 'payment'].includes(intent.category)) return 'wallet_agent';
    if (['investment', 'lending'].includes(intent.category)) return 'invest_agent';
    return 'info_agent';
  }

  // ── Conversational Flows ───────────────────────────

  _checkMissingData(intent, params, wallet_address) {
    if (intent.tool === "wallet_create") {
      const steps = [];
      if (!params.name) steps.push({ field: "name", question: "¿Cómo te llamás? (nombre completo)" });
      if (!params.email) steps.push({ field: "email", question: "¿Cuál es tu email?" });
      if (!params.owner_type) steps.push({ field: "owner_type", question: "¿Sos una persona o un agente AI? (persona / agente)" });
      if (steps.length > 0) return { step: 0, steps, question: steps[0].question };
    }
    if (intent.tool === "wallet_deposit") {
      if (!wallet_address && !params.wallet_address) return { step: 0, steps: [{ field: "wallet_address", question: "No tenés wallet vinculada. ¿Cuál es tu dirección? (o escribí 'crear' para una nueva)" }], question: "No tenés wallet vinculada. ¿Cuál es tu dirección? (o escribí 'crear' para una nueva)" };
      const steps = [];
      if (!params.amount) steps.push({ field: "amount", question: "¿Cuánto querés depositar? (ej: 100)" });
      if (!params.token) steps.push({ field: "token", question: "¿En qué token? (USDT, BNB, USDC, BUSD, rBTC)" });
      if (steps.length > 0) return { step: 0, steps, question: steps[0].question };
    }
    if (intent.tool === "wallet_transfer" || intent.tool === "wallet_pay") {
      const steps = [];
      if (!params.to_wallet) steps.push({ field: "to_wallet", question: "¿A qué wallet querés enviar? (0x...)" });
      if (!params.amount) steps.push({ field: "amount", question: "¿Cuánto querés enviar?" });
      if (!params.token) steps.push({ field: "token", question: "¿En qué token? (USDT, BNB, USDC)" });
      if (intent.tool === "wallet_pay" && !params.concept) steps.push({ field: "concept", question: "¿Concepto del pago?" });
      if (steps.length > 0) return { step: 0, steps, question: steps[0].question };
    }
    if (intent.tool === "yield_invest") {
      const steps = [];
      if (!params.strategy_id) steps.push({ field: "strategy_id", question: "¿En qué estrategia?\n1. stable-savings (3.5% APY)\n2. venus-usdt-lending (4.2%)\n3. venus-bnb-lending (2.8%)\n4. rsk-rbtc-yield (10.5%)\n5. venus-rsk-spread (5.3%)\nEscribí el número o nombre." });
      if (!params.amount) steps.push({ field: "amount", question: "¿Cuánto querés invertir?" });
      if (steps.length > 0) return { step: 0, steps, question: steps[0].question };
    }
    if (intent.tool === "loan_take") {
      const steps = [];
      if (!params.collateral_token) steps.push({ field: "collateral_token", question: "¿Qué token como colateral? (USDT, BNB, USDC, rBTC)" });
      if (!params.collateral_amount) steps.push({ field: "collateral_amount", question: "¿Cuánto colateral?" });
      if (!params.borrow_token) steps.push({ field: "borrow_token", question: "¿Qué token querés pedir prestado?" });
      if (!params.borrow_amount) steps.push({ field: "borrow_amount", question: "¿Cuánto querés pedir?" });
      if (steps.length > 0) return { step: 0, steps, question: steps[0].question };
    }
    if (intent.tool === "compliance_verify") {
      const steps = [];
      if (!params.verification_level) steps.push({ field: "verification_level", question: "¿Qué nivel?\n1. standard ($5,000/día)\n2. full ($50,000/día)" });
      if (!params.full_name) steps.push({ field: "full_name", question: "¿Tu nombre completo?" });
      if (!params.document_number) steps.push({ field: "document_number", question: "¿Tu DNI/CUIT?" });
      if (steps.length > 0) return { step: 0, steps, question: steps[0].question };
    }
    return null;
  }

  async _continuePendingFlow(sessionKey, flow, rawMessage, normalized, sessionContext) {
    const currentStep = flow.steps[flow.step];
    const field = currentStep.field;
    const words = normalized.split(/\s+/);
    if (words.includes("cancelar") || words.includes("salir") || (words.length === 1 && words[0] === "no")) {
      this.pendingFlows.delete(sessionKey);
      return { understood: true, message: "Operación cancelada. ¿En qué más te puedo ayudar?" };
    }
    if (field === "wallet_address" && (normalized.includes("crear") || normalized.includes("nueva"))) {
      this.pendingFlows.delete(sessionKey);
      return this.processMessage("crear wallet", null, sessionContext);
    }
    const value = this._parseFieldValue(field, rawMessage.trim(), normalized);
    flow.collectedData[field] = value;
    flow.step++;
    if (flow.step < flow.steps.length) {
      return { understood: true, tool: flow.intent.tool, awaiting_input: true, message: flow.steps[flow.step].question };
    }
    this.pendingFlows.delete(sessionKey);
    const params = { ...flow.collectedData };
    if (sessionContext.wallet_address) { params.wallet_address = params.wallet_address || sessionContext.wallet_address; params.from_wallet = params.from_wallet || sessionContext.wallet_address; }
    if (this._isCriticalOperation(flow.intent)) {
      const consensus = await this._runMultiAgentCheck(flow.intent, params);
      if (!consensus.approved) return { understood: true, tool: flow.intent.tool, blocked: true, message: `Operación bloqueada: ${consensus.reason}` };
    }
    const result = await this._executeTool(flow.intent.tool, params);
    return { understood: true, tool: flow.intent.tool, category: flow.intent.category, params_extracted: params, result, message: this._humanizeResult(flow.intent.tool, result) };
  }

  _parseFieldValue(field, raw, normalized) {
    if (field === "email") { const m = raw.match(/[\w.-]+@[\w.-]+\.\w+/); return m ? m[0] : raw; }
    if (field === "token" || field === "collateral_token" || field === "borrow_token") {
      const map = { usdt: "USDT", usdc: "USDC", busd: "BUSD", bnb: "BNB", rbtc: "rBTC", bitcoin: "rBTC" };
      return map[normalized.replace(/\s/g, "")] || raw.toUpperCase();
    }
    if (field === "owner_type") {
      if (normalized.includes("persona") || normalized.includes("humano")) return "human";
      if (normalized.includes("agente") || normalized.includes("bot")) return "agent";
      return "human";
    }
    if (field === "strategy_id") {
      const m = { "1": "stable-savings", "2": "venus-usdt-lending", "3": "venus-bnb-lending", "4": "rsk-rbtc-yield", "5": "venus-rsk-spread" };
      if (m[normalized.trim()]) return m[normalized.trim()];
      if (normalized.includes("stable") || normalized.includes("ahorro")) return "stable-savings";
      if (normalized.includes("spread")) return "venus-rsk-spread";
      if (normalized.includes("rsk") || normalized.includes("rbtc")) return "rsk-rbtc-yield";
      if (normalized.includes("venus") && normalized.includes("bnb")) return "venus-bnb-lending";
      if (normalized.includes("venus")) return "venus-usdt-lending";
      return raw.trim();
    }
    if (field === "verification_level") {
      if (normalized.includes("1") || normalized.includes("standard")) return "standard";
      if (normalized.includes("2") || normalized.includes("full")) return "full";
      return "standard";
    }
    if (field === "amount" || field === "collateral_amount" || field === "borrow_amount") {
      const m = raw.match(/[\d,.]+/); return m ? m[0].replace(",", ".") : raw;
    }
    if (field === "wallet_address" || field === "to_wallet" || field === "destination") {
      const m = raw.match(/0x[a-fA-F0-9]{40}/); return m ? m[0] : raw.trim();
    }
    return raw.trim();
  }

  // ── Intent Detection (regex fallback) ──────────────

  _detectIntent(text) {
    let bestMatch = null, bestScore = 0;
    for (const intent of this.intents) {
      for (const pattern of intent.patterns) {
        const p = pattern.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (text.includes(p) && p.length > bestScore) { bestScore = p.length; bestMatch = intent; }
      }
    }
    return bestMatch;
  }

  // ── Parameter Extraction ───────────────────────────

  _extractParams(text, intent, wallet_address, sessionContext = {}) {
    const params = {};
    if (wallet_address) { params.wallet_address = wallet_address; params.from_wallet = wallet_address; }
    const nameMatch = text.match(/(?:me llamo|soy|nombre es|mi nombre)\s+([a-z\s]+)/i);
    if (nameMatch) params.name = this._capitalize(nameMatch[1].trim());
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) params.email = emailMatch[0];
    if (sessionContext.telegram_first_name && !params.name) params.name = sessionContext.telegram_first_name;
    if (sessionContext.telegram_username && !params.email) params.email = `${sessionContext.telegram_username}@telegram.user`;
    if (sessionContext.phone && !params.email) params.email = `${sessionContext.phone}@whatsapp.user`;
    if (sessionContext.profile_name && !params.name) params.name = sessionContext.profile_name;
    if (sessionContext.agent_email) params.email = sessionContext.agent_email;
    if (sessionContext.agent_name) params.name = sessionContext.agent_name;
    if (sessionContext.agent_id) { params.agent_id = sessionContext.agent_id; params.owner_type = "agent"; }
    const amountMatch = text.match(/(\d+[\.,]?\d*)\s*(usdt|usdc|busd|bnb|rbtc|dolar|peso|usd)/i);
    if (amountMatch) {
      params.amount = amountMatch[1].replace(",", ".");
      const tokenMap = { usdt: "USDT", usdc: "USDC", busd: "BUSD", bnb: "BNB", rbtc: "rBTC", dolar: "USDT", usd: "USDT", peso: "USDT" };
      params.token = tokenMap[amountMatch[2].toLowerCase()] || "USDT";
    }
    if (!params.amount) { const m = text.match(/(\d+[\.,]?\d*)/); if (m) params.amount = m[1].replace(",", "."); }
    const addrMatch = text.match(/0x[a-fA-F0-9]{40}/);
    if (addrMatch) { params.to_wallet = addrMatch[0]; params.destination = addrMatch[0]; }
    if (intent.category === "investment") {
      if ((text.includes("venus") && text.includes("rootstock")) || text.includes("spread")) params.strategy_id = "venus-rsk-spread";
      else if (text.includes("venus") && text.includes("bnb")) params.strategy_id = "venus-bnb-lending";
      else if (text.includes("venus")) params.strategy_id = "venus-usdt-lending";
      else if (text.includes("rootstock") || text.includes("rsk") || text.includes("rbtc")) params.strategy_id = "rsk-rbtc-yield";
      else if (text.includes("ahorro") || text.includes("seguro") || text.includes("simple")) params.strategy_id = "stable-savings";
    }
    if (intent.category === "lending") {
      const cm = text.match(/colateral\s+(\d+[\.,]?\d*)\s*(usdt|usdc|busd|bnb|rbtc)/i);
      if (cm) { params.collateral_amount = cm[1].replace(",", "."); params.collateral_token = cm[2].toUpperCase(); }
      if (text.includes("pedir") || text.includes("prestar")) {
        const bm = text.match(/(\d+[\.,]?\d*)\s*(usdt|usdc|busd|bnb|rbtc)/i);
        if (bm) { params.borrow_amount = bm[1].replace(",", "."); params.borrow_token = bm[2].toUpperCase(); }
      }
    }
    if (intent.tool === "wallet_pay" || intent.tool === "wallet_request_payment") {
      const cm = text.match(/(?:por|concepto|de)\s+["']?(.+?)["']?\s*$/i);
      if (cm) params.concept = cm[1];
    }
    return params;
  }

  // ── Multi-Agent Consensus ──────────────────────────

  _isCriticalOperation(intent) {
    return ["yield_invest", "loan_take", "wallet_withdraw"].includes(intent.tool) || intent.category === "lending";
  }

  async _runMultiAgentCheck(intent, params) {
    const votes = [];
    votes.push({ agent: "compliance", ...await this._complianceAgentVote(intent, params) });
    votes.push({ agent: "risk", ...await this._riskAgentVote(intent, params) });
    if (intent.category === "investment" || intent.category === "lending") {
      votes.push({ agent: "investment", ...await this._investmentAgentVote(intent, params) });
    }
    const blocks = votes.filter(v => v.decision === "block");
    if (blocks.length > 0) return { approved: false, reason: blocks.map(b => `[${b.agent}] ${b.reason}`).join("; "), votes };
    return { approved: true, votes };
  }

  async _complianceAgentVote(intent, params) {
    if (!params.wallet_address) return { decision: "approve", reason: "No wallet context" };
    const wallet = await this.db.getWallet(params.wallet_address);
    if (!wallet) return { decision: "block", reason: "Wallet no encontrada" };
    const amount_usd = this._estimateUSD(params.amount, params.token);
    const dailyVolume = await this.db.getDailyVolume(params.wallet_address);
    const limits = { basic: 1000, standard: 5000, full: 50000 };
    const dailyLimit = limits[wallet.verification_level] || 1000;
    if (dailyVolume + amount_usd > dailyLimit) return { decision: "block", reason: `Excede límite diario UIF ($${dailyLimit}).` };
    if (intent.tool === "loan_take" && wallet.verification_level === "basic") return { decision: "block", reason: "Préstamos requieren verificación 'standard'." };
    return { decision: "approve", reason: "Dentro de límites", confidence: 0.95 };
  }

  async _riskAgentVote(intent, params) {
    const amount_usd = this._estimateUSD(params.amount, params.token);
    if (amount_usd > 10000) return { decision: "warn", reason: `Operación alto valor ($${amount_usd.toFixed(2)}).`, confidence: 0.7 };
    if (intent.tool === "loan_take") {
      const bUSD = this._estimateUSD(params.borrow_amount || params.amount, params.borrow_token || params.token);
      if (bUSD > 5000) return { decision: "warn", reason: `Préstamo alto ($${bUSD.toFixed(2)}).`, confidence: 0.65 };
    }
    return { decision: "approve", reason: "Riesgo aceptable", confidence: 0.9 };
  }

  async _investmentAgentVote(intent, params) {
    if (intent.tool === "yield_invest" && !params.strategy_id) return { decision: "warn", reason: "Sin estrategia. Recomiendo 'stable-savings'.", confidence: 0.6 };
    return { decision: "approve", reason: "OK", confidence: 0.85 };
  }

  // ── Tool Execution ─────────────────────────────────

  async _executeTool(tool, params) {
    switch (tool) {
      case "wallet_create": return this.walletManager.createWallet({ owner_email: params.email || "user@smartwallet.ai", owner_name: params.name || "Usuario", owner_type: params.owner_type || "human", agent_id: params.agent_id, agent_platform: params.agent_platform });
      case "wallet_balance": return this.walletManager.getBalance(params.wallet_address);
      case "wallet_info": return this.walletManager.getWalletInfo(params.wallet_address);
      case "wallet_deposit": return this.paymentEngine.deposit(params);
      case "wallet_withdraw": return this.paymentEngine.withdraw(params);
      case "wallet_transfer": return this.paymentEngine.transfer(params);
      case "wallet_pay": return this.paymentEngine.pay({ ...params, concept: params.concept || "Pago via Smart Wallet" });
      case "wallet_request_payment": return this.paymentEngine.requestPayment({ requester_wallet: params.wallet_address, ...params, concept: params.concept || "Cobro" });
      case "yield_strategies": return this.investmentEngine.getStrategies();
      case "yield_invest": return this.investmentEngine.invest(params);
      case "yield_withdraw": return this.investmentEngine.withdrawInvestment(params);
      case "yield_portfolio": return this.investmentEngine.getPortfolio(params.wallet_address);
      case "loan_options": return this.lendingEngine.getLoanOptions(params);
      case "loan_take": return this.lendingEngine.takeLoan(params);
      case "loan_repay": return this.lendingEngine.repayLoan(params);
      case "loan_status": return this.lendingEngine.getLoanStatus(params.wallet_address);
      case "strongbox_create": return { success: true, message: `StrongBox creada para wallet ${params.wallet_address}. Configurá herederos con "configurar heredero".` };
      case "strongbox_set_heir": return { success: true, message: `Heredero configurado.` };
      case "strongbox_info": return { success: true, message: "StrongBox info: balance, herederos, Dead Man's Switch (1 año)." };
      case "compliance_status": return this.complianceEngine.getStatus(params.wallet_address);
      case "compliance_verify": return this.complianceEngine.verify({ wallet_address: params.wallet_address, verification_level: params.verification_level || "standard", data: { full_name: params.full_name || params.name, document_number: params.document_number, document_type: "DNI", country: "AR" } });
      case "platform_info": return { success: true, message: "Smart Wallet Agent-First — Tu billetera inteligente.\n\n💳 Crear y administrar tu wallet\n💸 Depositar, retirar, transferir y pagar\n📈 Invertir en yield (3.5% a 10.5% APY)\n🏦 Préstamos con colateral\n🔒 Verificación de identidad\n📋 Historial de transacciones\n\nEscribime lo que necesites!" };
      case "transaction_history": return this.paymentEngine.getHistory({ wallet_address: params.wallet_address, limit: 20, type: "all" });
      default: return { error: "tool_not_found", message: `Tool ${tool} no implementado.` };
    }
  }

  _humanizeResult(tool, result) {
    if (!result.success && result.message) return result.message;
    if (result.message) return result.message;
    return JSON.stringify(result, null, 2);
  }

  _estimateUSD(amount, token) {
    const prices = { BNB: 600, USDT: 1, USDC: 1, BUSD: 1, rBTC: 85000 };
    return parseFloat(amount || "0") * (prices[token] || 1);
  }

  _capitalize(str) {
    return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
}
