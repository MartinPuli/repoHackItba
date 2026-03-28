// Telegram Bot — Connects Telegram to the Smart Wallet agent
// Users chat with the bot, the bot routes to the orchestrator via ChannelManager

export class TelegramBot {
  constructor({ channelManager, token }) {
    this.channelManager = channelManager;
    this.token = token;
    this.apiBase = `https://api.telegram.org/bot${token}`;
    this.polling = false;
    this.offset = 0;
  }

  // ── Start Polling ───────────────────────────────────

  async start() {
    if (!this.token) {
      console.error("[Telegram] No bot token configured. Skipping.");
      return;
    }

    // Register channel
    this.channelManager.registerChannel({
      id: "telegram",
      type: "telegram",
      enabled: true,
      config: { bot_token: "***configured***" },
    });

    // Verify bot token
    const me = await this._api("getMe");
    if (!me.ok) {
      console.error("[Telegram] Invalid bot token:", me.description);
      return;
    }

    console.error(`[Telegram] Bot @${me.result.username} connected. Polling...`);
    this.polling = true;
    this._poll();
  }

  stop() {
    this.polling = false;
  }

  // ── Polling Loop ────────────────────────────────────

  async _poll() {
    while (this.polling) {
      try {
        const updates = await this._api("getUpdates", {
          offset: this.offset,
          timeout: 30,
          allowed_updates: ["message"],
        });

        if (updates.ok && updates.result.length > 0) {
          for (const update of updates.result) {
            this.offset = update.update_id + 1;
            await this._handleUpdate(update);
          }
        }
      } catch (err) {
        console.error("[Telegram] Polling error:", err.message);
        await this._sleep(5000);
      }
    }
  }

  // ── Handle Incoming Messages ────────────────────────

  async _handleUpdate(update) {
    const msg = update.message;
    if (!msg || !msg.text) return;

    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const text = msg.text;

    // Handle /start command
    if (text === "/start") {
      await this._send(chatId,
        "👋 *Bienvenido a Smart Wallet*\n\n" +
        "Soy tu asistente financiero. Podés:\n" +
        "💳 Crear wallet: \"quiero crear mi wallet\"\n" +
        "💰 Ver balance: \"cuánto tengo\"\n" +
        "💸 Depositar: \"depositar 100 USDT\"\n" +
        "📈 Invertir: \"quiero invertir\"\n" +
        "🏦 Préstamo: \"necesito un préstamo\"\n" +
        "📋 Historial: \"mis movimientos\"\n\n" +
        "Escribime lo que necesites en español, yo entiendo. 🤖",
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Handle /link command (link telegram to existing wallet)
    if (text.startsWith("/link ")) {
      const walletAddress = text.replace("/link ", "").trim();
      if (walletAddress.startsWith("0x") && walletAddress.length === 42) {
        this.channelManager.linkWallet("telegram", userId, walletAddress);
        await this._send(chatId, `✅ Wallet vinculada: \`${walletAddress}\``, { parse_mode: "Markdown" });
      } else {
        await this._send(chatId, "❌ Dirección inválida. Usá: /link 0x...");
      }
      return;
    }

    // Handle /balance shortcut
    if (text === "/balance" || text === "/saldo") {
      const response = await this.channelManager.processIncoming("telegram", userId, "cuánto tengo", {
        telegram_chat_id: chatId,
        telegram_username: msg.from.username,
      });
      await this._send(chatId, response.text, { parse_mode: response.parse_mode });
      return;
    }

    // Handle /invest shortcut
    if (text === "/invertir" || text === "/invest") {
      const response = await this.channelManager.processIncoming("telegram", userId, "qué estrategias de inversión hay", {
        telegram_chat_id: chatId,
      });
      await this._send(chatId, response.text, { parse_mode: response.parse_mode });
      return;
    }

    // Handle /loan shortcut
    if (text === "/prestamo" || text === "/loan") {
      const response = await this.channelManager.processIncoming("telegram", userId, "opciones de préstamo", {
        telegram_chat_id: chatId,
      });
      await this._send(chatId, response.text, { parse_mode: response.parse_mode });
      return;
    }

    // Natural language — route to orchestrator
    const response = await this.channelManager.processIncoming("telegram", userId, text, {
      telegram_chat_id: chatId,
      telegram_username: msg.from.username,
      telegram_first_name: msg.from.first_name,
    });

    await this._send(chatId, response.text, { parse_mode: response.parse_mode });
  }

  // ── Telegram API ────────────────────────────────────

  async _api(method, body = {}) {
    const res = await fetch(`${this.apiBase}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async _send(chatId, text, options = {}) {
    // Telegram has a 4096 char limit
    if (text.length > 4000) {
      text = text.substring(0, 4000) + "\n...";
    }

    return this._api("sendMessage", {
      chat_id: chatId,
      text,
      ...options,
    });
  }

  _sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
