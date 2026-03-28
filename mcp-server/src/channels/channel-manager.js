// Channel Manager — Routes messages from any channel to the agent orchestrator
// Channels: app (frontend), telegram, whatsapp
// Each channel has its own adapter but all flow through the same orchestrator

export class ChannelManager {
  constructor({ orchestrator, db }) {
    this.orchestrator = orchestrator;
    this.db = db;
    this.channels = new Map(); // channel_id → config
    this.userSessions = new Map(); // channel:user_id → { wallet_address, last_message }
  }

  // ── Channel Registration ────────────────────────────

  registerChannel(config) {
    const id = config.id;
    this.channels.set(id, {
      id,
      type: config.type, // "app" | "telegram" | "whatsapp"
      enabled: config.enabled !== false,
      config: config.config || {},
      created_at: new Date().toISOString(),
    });
    return { success: true, channel_id: id, type: config.type };
  }

  getChannels() {
    return Array.from(this.channels.values());
  }

  updateChannel(id, updates) {
    const channel = this.channels.get(id);
    if (!channel) return { success: false, error: "channel_not_found" };
    Object.assign(channel, updates);
    return { success: true, channel };
  }

  // ── Message Processing (all channels converge here) ─

  async processIncoming(channelType, userId, message, metadata = {}) {
    const sessionKey = `${channelType}:${userId}`;
    let session = this.userSessions.get(sessionKey);

    // Auto-create session if first message
    if (!session) {
      session = {
        channel: channelType,
        user_id: userId,
        wallet_address: null,
        conversation: [],
        created_at: new Date().toISOString(),
      };
      this.userSessions.set(sessionKey, session);
    }

    // Store message in conversation history
    session.conversation.push({
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
      metadata,
    });

    // Trim conversation to last 20 messages
    if (session.conversation.length > 40) {
      session.conversation = session.conversation.slice(-20);
    }

    // Try to link wallet if we have an email/phone
    if (!session.wallet_address && metadata.email) {
      const wallet = await this.db.getWalletByEmail(metadata.email);
      if (wallet) session.wallet_address = wallet.address;
    }

    // Route to orchestrator with full session context
    const result = await this.orchestrator.processMessage(message, session.wallet_address, {
      sessionKey: sessionKey,
      channel: channelType,
      user_id: userId,
      wallet_address: session.wallet_address,
      ...metadata,
    });

    // If wallet was created, save it to session
    if (result.result?.wallet_address && !session.wallet_address) {
      session.wallet_address = result.result.wallet_address;
    }

    // Store response in conversation
    const response = this._formatResponse(channelType, result);
    session.conversation.push({
      role: "assistant",
      content: response.text,
      timestamp: new Date().toISOString(),
      tool_used: result.tool,
    });

    session.last_activity = new Date().toISOString();

    return response;
  }

  // ── Response Formatting per Channel ─────────────────

  _formatResponse(channelType, result) {
    switch (channelType) {
      case "telegram":
        return this._formatTelegram(result);
      case "whatsapp":
        return this._formatWhatsApp(result);
      case "app":
      default:
        return this._formatApp(result);
    }
  }

  _formatApp(result) {
    // App gets full JSON + formatted text
    return {
      text: result.message || "Operación completada.",
      data: result.result || result,
      tool: result.tool,
      category: result.category,
      blocked: result.blocked || false,
    };
  }

  _formatTelegram(result) {
    // Telegram gets markdown-formatted text
    let text = "";

    if (result.blocked) {
      text = `⛔ *Operación bloqueada*\n${result.message}`;
    } else if (!result.understood) {
      text = result.message;
    } else {
      text = result.message || "✅ Operación completada.";

      // Add relevant data
      const r = result.result;
      if (r) {
        if (r.wallet_address) text += `\n\n💳 Wallet: \`${r.wallet_address}\``;
        if (r.total_usd) text += `\n💰 Balance: $${r.total_usd} USD`;
        if (r.transaction_id) text += `\n📝 TX: \`${r.transaction_id}\``;
        if (r.projected_earnings) text += `\n📈 Rendimiento mensual: ${r.projected_earnings.monthly}`;
        if (r.terms) text += `\n🏦 Interés: ${r.terms.interest_rate}`;
        if (r.health_factor) text += `\n❤️ Health: ${r.health_factor}`;
      }
    }

    return { text, parse_mode: "Markdown" };
  }

  _formatWhatsApp(result) {
    // WhatsApp gets plain text (no markdown bold, use emoji)
    let text = "";

    if (result.blocked) {
      text = `⛔ Operación bloqueada\n${result.message}`;
    } else if (!result.understood) {
      text = result.message.replace(/\*/g, ""); // Remove markdown
    } else {
      text = result.message || "✅ Operación completada.";

      const r = result.result;
      if (r) {
        if (r.wallet_address) text += `\n\n💳 Wallet: ${r.wallet_address}`;
        if (r.total_usd) text += `\n💰 Balance: $${r.total_usd} USD`;
        if (r.transaction_id) text += `\n📝 TX: ${r.transaction_id}`;
      }
    }

    return { text };
  }

  // ── Session Management ──────────────────────────────

  getSession(channelType, userId) {
    return this.userSessions.get(`${channelType}:${userId}`) || null;
  }

  linkWallet(channelType, userId, walletAddress) {
    const sessionKey = `${channelType}:${userId}`;
    let session = this.userSessions.get(sessionKey);
    if (!session) {
      session = { channel: channelType, user_id: userId, conversation: [], created_at: new Date().toISOString() };
      this.userSessions.set(sessionKey, session);
    }
    session.wallet_address = walletAddress;
    return { success: true, linked: walletAddress };
  }
}
