// WhatsApp Bot — Connects WhatsApp to the Smart Wallet agent via Twilio
// Users send WhatsApp messages, Twilio webhooks route to the orchestrator

export class WhatsAppBot {
  constructor({ channelManager, accountSid, authToken, fromNumber }) {
    this.channelManager = channelManager;
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber; // "whatsapp:+14155238886" (Twilio sandbox)
    this.apiBase = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`;
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
    const text = body.Body;
    const profileName = body.ProfileName || "Usuario";

    if (!from || !text) {
      return { error: "missing_fields" };
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
    await this._sendMessage(from, response.text);

    return { success: true, response: response.text };
  }

  // ── Send Message via Twilio ─────────────────────────

  async _sendMessage(to, text) {
    if (!this.accountSid || !this.authToken) return;

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
          "Authorization": authHeader,
        },
        body: params.toString(),
      });

      const data = await res.json();
      if (data.error_code) {
        console.error("[WhatsApp] Send error:", data.message);
      }
      return data;
    } catch (err) {
      console.error("[WhatsApp] Send error:", err.message);
    }
  }
}
