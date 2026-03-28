// WhatsApp Bot — Connects WhatsApp to the Smart Wallet agent via Twilio
// Users send WhatsApp messages, Twilio webhooks route to the orchestrator

export class WhatsAppBot {
  constructor({ channelManager, accountSid, authToken, fromNumber }) {
    this.channelManager = channelManager;
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = WhatsAppBot.normalizeWhatsAppFrom(fromNumber);
    this.apiBase = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`;
  }

  /** Twilio WhatsApp exige From/To como whatsapp:+E164; si .env trae solo +1... falla el envío sin sid. */
  static normalizeWhatsAppFrom(raw) {
    const fallback = "whatsapp:+14155238886";
    if (raw == null || String(raw).trim() === "") return fallback;
    const s = String(raw).trim();
    if (s.toLowerCase().startsWith("whatsapp:")) return s;
    const digits = s.replace(/\D/g, "");
    if (!digits) return fallback;
    return s.startsWith("+") ? `whatsapp:${s}` : `whatsapp:+${digits}`;
  }

  // ── Initialize ──────────────────────────────────────

  init() {
    if (!this.accountSid || !this.authToken) {
      console.error("[WhatsApp] No Twilio credentials configured. Skipping.");
      return false;
    }

    this.channelManager.registerChannel({
      id: "whatsapp",
      type: "whatsapp",
      enabled: true,
      config: { from_number: this.fromNumber },
    });

    console.error(`[WhatsApp] Configured with number ${this.fromNumber}`);
    return true;
  }

  // ── Handle Incoming Webhook (called by HTTP server) ─

  async handleWebhook(body) {
    const from = body.From; // "whatsapp:+5491123456789"
    const text = (body.Body || body.ButtonPayload || "").trim();
    const profileName = body.ProfileName || "Usuario";

    if (!from || !text) {
      console.error("[WhatsApp] Webhook ignorado: falta From o texto", {
        hasFrom: !!from,
        hasText: !!text,
        MessageSid: body.MessageSid,
      });
      return { error: "missing_fields" };
    }

    console.error("[WhatsApp] Mensaje entrante", { from, text: text.slice(0, 200), profileName });

    if (text.toLowerCase() === "hola") {
      console.error("[WhatsApp] Respuesta smoke hola → enviando Hola 👋");
      await this._sendMessage(from, "Hola 👋");
      return { success: true, response: "Hola 👋" };
    }

    // Clean phone number for user ID
    const userId = from.replace("whatsapp:", "").replace("+", "");

    // Route to orchestrator via channel manager
    const response = await this.channelManager.processIncoming("whatsapp", userId, text, {
      whatsapp_number: from,
      profile_name: profileName,
      phone: userId,
    });

    // Send reply via Twilio
    console.error("[WhatsApp] Respuesta agente, enviando por Twilio…");
    await this._sendMessage(from, response.text);

    return { success: true, response: response.text };
  }

  // ── Send Message via Twilio ─────────────────────────

  async _sendMessage(to, text) {
    if (!this.accountSid || !this.authToken) {
      console.error("[WhatsApp] _sendMessage omitido: faltan TWILIO_ACCOUNT_SID o TWILIO_AUTH_TOKEN");
      return;
    }

    // WhatsApp has a 1600 char practical limit
    if (text.length > 1500) {
      text = text.substring(0, 1500) + "\n...";
    }

    const params = new URLSearchParams();
    params.append("To", to);
    params.append("From", this.fromNumber);
    params.append("Body", text);

    const authHeader = "Basic " + Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");

    try {
      const res = await fetch(`${this.apiBase}/Messages.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: authHeader,
        },
        body: params.toString(),
      });

      const data = await res.json();

      if (!res.ok || data.code || data.error_code) {
        console.error(
          "[WhatsApp] Send error:",
          res.status,
          data.message || data.msg || JSON.stringify(data).slice(0, 200)
        );
      } else if (data.sid) {
        console.error("[WhatsApp] Enviado OK, sid=", data.sid);
      } else {
        console.error("[WhatsApp] Send respuesta inesperada:", res.status, Object.keys(data));
      }
      return data;
    } catch (err) {
      console.error("[WhatsApp] Send error:", err.message);
    }
  }
}
