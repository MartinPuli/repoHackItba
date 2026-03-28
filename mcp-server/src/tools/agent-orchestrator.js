// Agent Orchestrator — Natural language → MCP tool routing
// "Un viejo le pregunta algo y el sistema entiende qué hacer"
// Conversational: when data is missing, asks step by step
// Works from: App, Telegram, WhatsApp, MCP (other agents)

export class AgentOrchestrator {
  constructor({ walletManager, paymentEngine, investmentEngine, complianceEngine, lendingEngine, db }) {
    this.walletManager = walletManager;
    this.paymentEngine = paymentEngine;
    this.investmentEngine = investmentEngine;
    this.complianceEngine = complianceEngine;
    this.lendingEngine = lendingEngine;
    this.db = db;

    // Pending flows per session (channel:userId → flow state)
    this.pendingFlows = new Map();

    // Intent patterns — what the user might say and what tool to use
    this.intents = [
      // Wallet
      { patterns: ["crear wallet", "crear mi wallet", "abrir cuenta", "nueva wallet", "registrarme", "quiero empezar", "crear mi billetera", "abrir wallet", "crear cuenta", "quiero una wallet", "dame una wallet", "abrir mi wallet", "necesito wallet", "necesito una wallet", "quiero wallet"],
        tool: "wallet_create", category: "wallet" },
      { patterns: ["balance", "cuanto tengo", "mis fondos", "saldo", "cuanta plata", "mi balance", "mi plata"],
        tool: "wallet_balance", category: "wallet" },
      { patterns: ["info wallet", "mi cuenta", "datos de mi wallet", "informacion", "mi wallet"],
        tool: "wallet_info", category: "wallet" },

      // Payments
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

      // Investment
      { patterns: ["invertir", "inversion", "poner a rendir", "rendimiento", "yield", "meter en defi", "generar intereses"],
        tool: "yield_invest", category: "investment" },
      { patterns: ["estrategias", "opciones de inversion", "donde invertir", "que rinde", "que opciones hay"],
        tool: "yield_strategies", category: "investment" },
      { patterns: ["portfolio", "mis inversiones", "como van mis inversiones", "rendimientos"],
        tool: "yield_portfolio", category: "investment" },
      { patterns: ["retirar inversion", "sacar inversion", "rescatar", "desinvertir"],
        tool: "yield_withdraw", category: "investment" },

      // Lending
      { patterns: ["prestamo", "pedir prestado", "necesito plata", "credito", "quiero un prestamo"],
        tool: "loan_take", category: "lending" },
      { patterns: ["opciones de prestamo", "cuanto puedo pedir", "colateral", "garantia"],
        tool: "loan_options", category: "lending" },
      { patterns: ["pagar prestamo", "devolver prestamo", "repagar", "cancelar deuda"],
        tool: "loan_repay", category: "lending" },
      { patterns: ["estado prestamo", "mi deuda", "cuanto debo", "health factor"],
        tool: "loan_status", category: "lending" },

      // Compliance
      { patterns: ["verificar", "kyc", "verificacion", "subir nivel", "identidad"],
        tool: "compliance_verify", category: "compliance" },
      { patterns: ["limites", "compliance", "estado de verificacion"],
        tool: "compliance_status", category: "compliance" },

      // Info
      { patterns: ["que puedo hacer", "ayuda", "help", "como funciona", "que es esto", "que servicios", "explicame"],
        tool: "platform_info", category: "info" },
      { patterns: ["historial", "transacciones", "movimientos", "ultimas operaciones"],
        tool: "transaction_history", category: "info" },
    ];
  }

  // ── Main: understand what the user wants ────────────

  async processMessage(message, wallet_address, sessionContext = {}) {
    const normalized = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const sessionKey = sessionContext.sessionKey || "default";

    // 1. Check if there's a pending conversational flow
    const pendingFlow = this.pendingFlows.get(sessionKey);
    if (pendingFlow) {
      return this._continuePendingFlow(sessionKey, pendingFlow, message, normalized, sessionContext);
    }

    // 2. Detect intent
    const intent = this._detectIntent(normalized);

    if (!intent) {
      return {
        understood: false,
        message: "No entendi bien que queres hacer. Podés preguntarme sobre:\n" +
          "- 💳 Crear wallet (\"quiero crear mi wallet\")\n" +
          "- 💰 Balance (\"cuánto tengo\")\n" +
          "- 💸 Pagos (\"depositar\", \"transferir\", \"pagar\")\n" +
          "- 📈 Inversiones (\"invertir\", \"estrategias\")\n" +
          "- 🏦 Préstamos (\"quiero un préstamo\")\n" +
          "- 🔒 Verificación (\"verificar identidad\")\n" +
          "- 📋 Historial (\"mis movimientos\")",
        suggested_tools: ["platform_info", "wallet_create"],
      };
    }

    // 3. Extract parameters from natural language
    const params = this._extractParams(normalized, intent, wallet_address, sessionContext);

    // 4. Check if we need more data (conversational flow)
    const missingData = this._checkMissingData(intent, params, wallet_address);
    if (missingData) {
      this.pendingFlows.set(sessionKey, {
        intent,
        params,
        step: missingData.step,
        steps: missingData.steps,
        collectedData: { ...params },
      });
      return {
        understood: true,
        tool: intent.tool,
        awaiting_input: true,
        message: missingData.question,
      };
    }

    // 5. For critical operations, run multi-agent consensus
    if (this._isCriticalOperation(intent)) {
      const consensus = await this._runMultiAgentCheck(intent, params);
      if (!consensus.approved) {
        return {
          understood: true,
          tool: intent.tool,
          blocked: true,
          reason: consensus.reason,
          agent_votes: consensus.votes,
          message: `La operación fue bloqueada: ${consensus.reason}`,
        };
      }
    }

    // 6. Execute the tool
    const result = await this._executeTool(intent.tool, params);

    return {
      understood: true,
      tool: intent.tool,
      category: intent.category,
      params_extracted: params,
      result,
      message: this._humanizeResult(intent.tool, result),
    };
  }

  // ── Conversational Flows (step by step data collection) ─

  _checkMissingData(intent, params, wallet_address) {
    // WALLET CREATE — needs name and email
    if (intent.tool === "wallet_create") {
      const steps = [];
      if (!params.name) steps.push({ field: "name", question: "¿Cómo te llamás? (nombre completo)" });
      if (!params.email) steps.push({ field: "email", question: "¿Cuál es tu email?" });
      if (!params.owner_type) steps.push({ field: "owner_type", question: "¿Sos una persona o un agente AI? (persona / agente)" });

      if (steps.length > 0) {
        return { step: 0, steps, question: steps[0].question };
      }
    }

    // DEPOSIT — needs wallet + amount + token
    if (intent.tool === "wallet_deposit") {
      if (!wallet_address && !params.wallet_address) {
        return { step: 0, steps: [{ field: "wallet_address", question: "¿Cuál es la dirección de tu wallet? (o escribí 'crear' si no tenés una)" }], question: "No tenés una wallet vinculada. ¿Cuál es la dirección de tu wallet? (o escribí 'crear' para crear una nueva)" };
      }
      const steps = [];
      if (!params.amount) steps.push({ field: "amount", question: "¿Cuánto querés depositar? (ej: 100)" });
      if (!params.token) steps.push({ field: "token", question: "¿En qué token? (USDT, BNB, USDC, BUSD, rBTC)" });
      if (steps.length > 0) return { step: 0, steps, question: steps[0].question };
    }

    // TRANSFER — needs to_wallet + amount + token
    if (intent.tool === "wallet_transfer" || intent.tool === "wallet_pay") {
      const steps = [];
      if (!params.to_wallet) steps.push({ field: "to_wallet", question: "¿A qué wallet querés enviar? (dirección 0x...)" });
      if (!params.amount) steps.push({ field: "amount", question: "¿Cuánto querés enviar?" });
      if (!params.token) steps.push({ field: "token", question: "¿En qué token? (USDT, BNB, USDC)" });
      if (intent.tool === "wallet_pay" && !params.concept) steps.push({ field: "concept", question: "¿Cuál es el concepto del pago?" });
      if (steps.length > 0) return { step: 0, steps, question: steps[0].question };
    }

    // INVEST — needs strategy + amount
    if (intent.tool === "yield_invest") {
      const steps = [];
      if (!params.strategy_id) steps.push({ field: "strategy_id", question: "¿En qué estrategia querés invertir?\n\n1. stable-savings (3.5% APY, bajo riesgo)\n2. venus-usdt-lending (4.2% APY)\n3. venus-bnb-lending (2.8% APY)\n4. rsk-rbtc-yield (10.5% APY, riesgo medio)\n5. venus-rsk-spread (5.3% APY, avanzado)\n\nEscribí el número o nombre." });
      if (!params.amount) steps.push({ field: "amount", question: "¿Cuánto querés invertir?" });
      if (steps.length > 0) return { step: 0, steps, question: steps[0].question };
    }

    // LOAN — needs collateral + borrow details
    if (intent.tool === "loan_take") {
      const steps = [];
      if (!params.collateral_token) steps.push({ field: "collateral_token", question: "¿Qué token querés usar como colateral? (USDT, BNB, USDC, rBTC)" });
      if (!params.collateral_amount) steps.push({ field: "collateral_amount", question: "¿Cuánto colateral querés depositar?" });
      if (!params.borrow_token) steps.push({ field: "borrow_token", question: "¿Qué token querés pedir prestado? (USDT, BNB, USDC)" });
      if (!params.borrow_amount) steps.push({ field: "borrow_amount", question: "¿Cuánto querés pedir prestado?" });
      if (steps.length > 0) return { step: 0, steps, question: steps[0].question };
    }

    // VERIFY — needs level + data
    if (intent.tool === "compliance_verify") {
      const steps = [];
      if (!params.verification_level) steps.push({ field: "verification_level", question: "¿Qué nivel de verificación querés?\n1. standard — DNI + nombre ($5,000/día)\n2. full — DNI + nombre + país ($50,000/día)" });
      if (!params.full_name) steps.push({ field: "full_name", question: "¿Cuál es tu nombre completo?" });
      if (!params.document_number) steps.push({ field: "document_number", question: "¿Cuál es tu número de documento (DNI/CUIT)?" });
      if (steps.length > 0) return { step: 0, steps, question: steps[0].question };
    }

    return null; // No missing data
  }

  async _continuePendingFlow(sessionKey, flow, rawMessage, normalized, sessionContext) {
    const currentStep = flow.steps[flow.step];
    const field = currentStep.field;

    // Special: if user says "cancelar" or "salir" (exact word match, not substring)
    const words = normalized.split(/\s+/);
    if (words.includes("cancelar") || words.includes("salir") || (words.length === 1 && words[0] === "no")) {
      this.pendingFlows.delete(sessionKey);
      return { understood: true, message: "Operación cancelada. ¿En qué más te puedo ayudar?" };
    }

    // Special: redirect to wallet creation if user says "crear"
    if (field === "wallet_address" && (normalized.includes("crear") || normalized.includes("nueva"))) {
      this.pendingFlows.delete(sessionKey);
      return this.processMessage("crear wallet", null, sessionContext);
    }

    // Parse the answer based on field type
    const value = this._parseFieldValue(field, rawMessage.trim(), normalized);
    flow.collectedData[field] = value;

    // Move to next step
    flow.step++;

    // If more steps, ask next question
    if (flow.step < flow.steps.length) {
      const nextStep = flow.steps[flow.step];
      return {
        understood: true,
        tool: flow.intent.tool,
        awaiting_input: true,
        message: nextStep.question,
      };
    }

    // All data collected — execute
    this.pendingFlows.delete(sessionKey);

    const params = { ...flow.collectedData };

    // Add wallet from session if available
    if (sessionContext.wallet_address) {
      params.wallet_address = params.wallet_address || sessionContext.wallet_address;
      params.from_wallet = params.from_wallet || sessionContext.wallet_address;
    }

    // Multi-agent check for critical ops
    if (this._isCriticalOperation(flow.intent)) {
      const consensus = await this._runMultiAgentCheck(flow.intent, params);
      if (!consensus.approved) {
        return {
          understood: true,
          tool: flow.intent.tool,
          blocked: true,
          message: `Operación bloqueada: ${consensus.reason}`,
        };
      }
    }

    const result = await this._executeTool(flow.intent.tool, params);

    return {
      understood: true,
      tool: flow.intent.tool,
      category: flow.intent.category,
      params_extracted: params,
      result,
      message: this._humanizeResult(flow.intent.tool, result),
    };
  }

  _parseFieldValue(field, raw, normalized) {
    // Email validation
    if (field === "email") {
      const emailMatch = raw.match(/[\w.-]+@[\w.-]+\.\w+/);
      return emailMatch ? emailMatch[0] : raw;
    }

    // Token normalization
    if (field === "token" || field === "collateral_token" || field === "borrow_token") {
      const map = { usdt: "USDT", usdc: "USDC", busd: "BUSD", bnb: "BNB", rbtc: "rBTC", bitcoin: "rBTC" };
      return map[normalized.replace(/\s/g, "")] || raw.toUpperCase();
    }

    // Owner type
    if (field === "owner_type") {
      if (normalized.includes("persona") || normalized.includes("humano") || normalized.includes("human")) return "human";
      if (normalized.includes("agente") || normalized.includes("agent") || normalized.includes("bot")) return "agent";
      return "human";
    }

    // Strategy selection (by number or name)
    if (field === "strategy_id") {
      const strategyMap = { "1": "stable-savings", "2": "venus-usdt-lending", "3": "venus-bnb-lending", "4": "rsk-rbtc-yield", "5": "venus-rsk-spread" };
      if (strategyMap[normalized.trim()]) return strategyMap[normalized.trim()];
      if (normalized.includes("stable") || normalized.includes("ahorro")) return "stable-savings";
      if (normalized.includes("spread") || normalized.includes("avanzad")) return "venus-rsk-spread";
      if (normalized.includes("rootstock") || normalized.includes("rsk") || normalized.includes("rbtc")) return "rsk-rbtc-yield";
      if (normalized.includes("venus") && normalized.includes("bnb")) return "venus-bnb-lending";
      if (normalized.includes("venus")) return "venus-usdt-lending";
      return raw.trim();
    }

    // Verification level
    if (field === "verification_level") {
      if (normalized.includes("1") || normalized.includes("standard")) return "standard";
      if (normalized.includes("2") || normalized.includes("full") || normalized.includes("completo")) return "full";
      return "standard";
    }

    // Amounts — clean up
    if (field === "amount" || field === "collateral_amount" || field === "borrow_amount") {
      const numMatch = raw.match(/[\d,.]+/);
      return numMatch ? numMatch[0].replace(",", ".") : raw;
    }

    // Addresses
    if (field === "wallet_address" || field === "to_wallet" || field === "destination") {
      const addrMatch = raw.match(/0x[a-fA-F0-9]{40}/);
      return addrMatch ? addrMatch[0] : raw.trim();
    }

    return raw.trim();
  }

  // ── Intent Detection ────────────────────────────────

  _detectIntent(text) {
    let bestMatch = null;
    let bestScore = 0;

    for (const intent of this.intents) {
      for (const pattern of intent.patterns) {
        const patternNorm = pattern.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (text.includes(patternNorm)) {
          const score = patternNorm.length;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = intent;
          }
        }
      }
    }

    return bestMatch;
  }

  // ── Parameter Extraction ────────────────────────────

  _extractParams(text, intent, wallet_address, sessionContext = {}) {
    const params = {};

    if (wallet_address) {
      params.wallet_address = wallet_address;
      params.from_wallet = wallet_address;
    }

    // Extract name (for wallet creation: "me llamo Juan", "soy Pedro Garcia")
    const nameMatch = text.match(/(?:me llamo|soy|nombre es|mi nombre)\s+([a-z\s]+)/i);
    if (nameMatch) params.name = this._capitalize(nameMatch[1].trim());

    // Extract email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) params.email = emailMatch[0];

    // Use metadata from channels
    if (sessionContext.telegram_first_name && !params.name) params.name = sessionContext.telegram_first_name;
    if (sessionContext.telegram_username && !params.email) params.email = `${sessionContext.telegram_username}@telegram.user`;
    if (sessionContext.phone && !params.email) params.email = `${sessionContext.phone}@whatsapp.user`;
    if (sessionContext.profile_name && !params.name) params.name = sessionContext.profile_name;

    // For agents calling via MCP, they pass params directly
    if (sessionContext.agent_email) params.email = sessionContext.agent_email;
    if (sessionContext.agent_name) params.name = sessionContext.agent_name;
    if (sessionContext.agent_id) { params.agent_id = sessionContext.agent_id; params.owner_type = "agent"; }

    // Extract amounts (numbers with token)
    const amountMatch = text.match(/(\d+[\.,]?\d*)\s*(usdt|usdc|busd|bnb|rbtc|dolar|peso|usd)/i);
    if (amountMatch) {
      params.amount = amountMatch[1].replace(",", ".");
      const tokenMap = { usdt: "USDT", usdc: "USDC", busd: "BUSD", bnb: "BNB", rbtc: "rBTC", dolar: "USDT", usd: "USDT", peso: "USDT" };
      params.token = tokenMap[amountMatch[2].toLowerCase()] || "USDT";
    }

    // Standalone numbers
    if (!params.amount) {
      const numMatch = text.match(/(\d+[\.,]?\d*)/);
      if (numMatch) params.amount = numMatch[1].replace(",", ".");
    }

    // Extract addresses (0x...)
    const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
    if (addressMatch) {
      params.to_wallet = addressMatch[0];
      params.destination = addressMatch[0];
    }

    // Extract strategy mentions
    if (intent.category === "investment") {
      if ((text.includes("venus") && text.includes("rootstock")) || text.includes("spread")) {
        params.strategy_id = "venus-rsk-spread";
      } else if (text.includes("venus") && text.includes("bnb")) {
        params.strategy_id = "venus-bnb-lending";
      } else if (text.includes("venus")) {
        params.strategy_id = "venus-usdt-lending";
      } else if (text.includes("rootstock") || text.includes("rsk") || text.includes("rbtc")) {
        params.strategy_id = "rsk-rbtc-yield";
      } else if (text.includes("ahorro") || text.includes("seguro") || text.includes("simple")) {
        params.strategy_id = "stable-savings";
      }
    }

    // Extract lending params
    if (intent.category === "lending") {
      const collateralMatch = text.match(/colateral\s+(\d+[\.,]?\d*)\s*(usdt|usdc|busd|bnb|rbtc)/i);
      if (collateralMatch) {
        params.collateral_amount = collateralMatch[1].replace(",", ".");
        params.collateral_token = collateralMatch[2].toUpperCase();
      }
      if (text.includes("pedir") || text.includes("prestar")) {
        const borrowMatch = text.match(/(\d+[\.,]?\d*)\s*(usdt|usdc|busd|bnb|rbtc)/i);
        if (borrowMatch) {
          params.borrow_amount = borrowMatch[1].replace(",", ".");
          params.borrow_token = borrowMatch[2].toUpperCase();
        }
      }
    }

    // Extract concept for payments
    if (intent.tool === "wallet_pay" || intent.tool === "wallet_request_payment") {
      const conceptMatch = text.match(/(?:por|concepto|de)\s+["']?(.+?)["']?\s*$/i);
      if (conceptMatch) params.concept = conceptMatch[1];
    }

    return params;
  }

  // ── Multi-Agent Consensus ───────────────────────────

  _isCriticalOperation(intent) {
    return ["yield_invest", "loan_take", "wallet_withdraw"].includes(intent.tool) ||
           intent.category === "lending";
  }

  async _runMultiAgentCheck(intent, params) {
    const votes = [];

    const complianceVote = await this._complianceAgentVote(intent, params);
    votes.push({ agent: "compliance", ...complianceVote });

    const riskVote = await this._riskAgentVote(intent, params);
    votes.push({ agent: "risk", ...riskVote });

    if (intent.category === "investment" || intent.category === "lending") {
      const investVote = await this._investmentAgentVote(intent, params);
      votes.push({ agent: "investment", ...investVote });
    }

    const blocks = votes.filter((v) => v.decision === "block");

    if (blocks.length > 0) {
      return {
        approved: false,
        reason: blocks.map((b) => `[${b.agent}] ${b.reason}`).join("; "),
        votes,
      };
    }

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

    if (dailyVolume + amount_usd > dailyLimit) {
      return { decision: "block", reason: `Excede límite diario UIF ($${dailyLimit}). Hoy: $${dailyVolume.toFixed(2)}.` };
    }
    if (intent.tool === "loan_take" && wallet.verification_level === "basic") {
      return { decision: "block", reason: "Préstamos requieren verificación nivel 'standard'." };
    }
    return { decision: "approve", reason: "Dentro de límites regulatorios", confidence: 0.95 };
  }

  async _riskAgentVote(intent, params) {
    const amount_usd = this._estimateUSD(params.amount, params.token);
    if (amount_usd > 10000) return { decision: "warn", reason: `Operación de alto valor ($${amount_usd.toFixed(2)}).`, confidence: 0.7 };
    if (intent.tool === "loan_take") {
      const borrowUSD = this._estimateUSD(params.borrow_amount || params.amount, params.borrow_token || params.token);
      if (borrowUSD > 5000) return { decision: "warn", reason: `Préstamo alto ($${borrowUSD.toFixed(2)}).`, confidence: 0.65 };
    }
    return { decision: "approve", reason: "Riesgo aceptable", confidence: 0.9 };
  }

  async _investmentAgentVote(intent, params) {
    if (intent.tool === "yield_invest" && !params.strategy_id) {
      return { decision: "warn", reason: "Sin estrategia. Recomiendo 'stable-savings'.", confidence: 0.6 };
    }
    return { decision: "approve", reason: "OK", confidence: 0.85 };
  }

  // ── Tool Execution ──────────────────────────────────

  async _executeTool(tool, params) {
    switch (tool) {
      case "wallet_create":
        return this.walletManager.createWallet({
          owner_email: params.email || "user@smartwallet.ai",
          owner_name: params.name || "Usuario",
          owner_type: params.owner_type || "human",
          agent_id: params.agent_id,
          agent_platform: params.agent_platform,
        });
      case "wallet_balance":
        return this.walletManager.getBalance(params.wallet_address);
      case "wallet_info":
        return this.walletManager.getWalletInfo(params.wallet_address);
      case "wallet_deposit":
        return this.paymentEngine.deposit(params);
      case "wallet_withdraw":
        return this.paymentEngine.withdraw(params);
      case "wallet_transfer":
        return this.paymentEngine.transfer(params);
      case "wallet_pay":
        return this.paymentEngine.pay({ ...params, concept: params.concept || "Pago via Smart Wallet" });
      case "wallet_request_payment":
        return this.paymentEngine.requestPayment({ requester_wallet: params.wallet_address, ...params, concept: params.concept || "Cobro" });
      case "yield_strategies":
        return this.investmentEngine.getStrategies();
      case "yield_invest":
        return this.investmentEngine.invest(params);
      case "yield_withdraw":
        return this.investmentEngine.withdrawInvestment(params);
      case "yield_portfolio":
        return this.investmentEngine.getPortfolio(params.wallet_address);
      case "loan_options":
        return this.lendingEngine.getLoanOptions(params);
      case "loan_take":
        return this.lendingEngine.takeLoan(params);
      case "loan_repay":
        return this.lendingEngine.repayLoan(params);
      case "loan_status":
        return this.lendingEngine.getLoanStatus(params.wallet_address);
      case "compliance_status":
        return this.complianceEngine.getStatus(params.wallet_address);
      case "compliance_verify":
        return this.complianceEngine.verify({
          wallet_address: params.wallet_address,
          verification_level: params.verification_level || "standard",
          data: {
            full_name: params.full_name || params.name,
            document_number: params.document_number,
            document_type: params.document_type || "DNI",
            country: params.country || "AR",
          },
        });
      case "platform_info":
        return {
          success: true,
          message: "Smart Wallet Agent-First — Tu billetera inteligente.\n\n" +
            "Lo que puedo hacer:\n" +
            "💳 Crear y administrar tu wallet\n" +
            "💸 Depositar, retirar, transferir y pagar\n" +
            "📈 Invertir en estrategias de yield (3.5% a 10.5% APY)\n" +
            "🏦 Préstamos con colateral crypto\n" +
            "🔒 Verificación de identidad para subir límites\n" +
            "📋 Ver historial de transacciones\n\n" +
            "Escribime lo que necesites!",
        };
      case "transaction_history":
        return this.paymentEngine.getHistory({ wallet_address: params.wallet_address, limit: 20, type: "all" });
      default:
        return { error: "tool_not_found", message: `Tool ${tool} no implementado.` };
    }
  }

  // ── Humanize Results ────────────────────────────────

  _humanizeResult(tool, result) {
    if (!result.success && result.message) return result.message;
    if (result.message) return result.message;
    return JSON.stringify(result, null, 2);
  }

  // ── Helpers ─────────────────────────────────────────

  _estimateUSD(amount, token) {
    const prices = { BNB: 600, USDT: 1, USDC: 1, BUSD: 1, rBTC: 85000 };
    return parseFloat(amount || "0") * (prices[token] || 1);
  }

  _capitalize(str) {
    return str.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
}
