// HTTP Server — REST API for frontend chat, Telegram webhook, WhatsApp webhook
// Runs alongside the MCP stdio server on a configurable port

import { createServer } from "http";

export class HttpServer {
  constructor({ channelManager, whatsAppBot, port = 3001 }) {
    this.channelManager = channelManager;
    this.whatsAppBot = whatsAppBot;
    this.port = port;
  }

  start() {
    const server = createServer(async (req, res) => {
      // CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://localhost:${this.port}`);
      const path = url.pathname;

      try {
        // ── App Chat (frontend) ──────────────────
        if (path === "/api/chat" && req.method === "POST") {
          const body = await this._readBody(req);
          const { message, wallet_address, user_id } = body;

          if (!message) {
            this._json(res, 400, { error: "message is required" });
            return;
          }

          const response = await this.channelManager.processIncoming(
            "app",
            user_id || "web-user",
            message,
            { wallet_address }
          );

          this._json(res, 200, response);
          return;
        }

        // ── App Chat History ─────────────────────
        if (path === "/api/chat/history" && req.method === "GET") {
          const userId = url.searchParams.get("user_id") || "web-user";
          const session = this.channelManager.getSession("app", userId);

          this._json(res, 200, {
            conversation: session?.conversation || [],
            wallet_address: session?.wallet_address || null,
          });
          return;
        }

        // ── Link Wallet to Channel ───────────────
        if (path === "/api/link-wallet" && req.method === "POST") {
          const body = await this._readBody(req);
          const { channel, user_id, wallet_address } = body;

          const result = this.channelManager.linkWallet(
            channel || "app",
            user_id || "web-user",
            wallet_address
          );

          this._json(res, 200, result);
          return;
        }

        // ── WhatsApp Webhook (Twilio) ────────────
        if (path === "/api/webhook/whatsapp" && req.method === "POST") {
          const body = await this._readFormBody(req);
          const result = await this.whatsAppBot.handleWebhook(body);

          // Twilio expects TwiML response
          res.writeHead(200, { "Content-Type": "text/xml" });
          res.end("<Response></Response>");
          return;
        }

        // ── Channel Management ───────────────────
        if (path === "/api/channels" && req.method === "GET") {
          const channels = this.channelManager.getChannels();
          this._json(res, 200, { channels });
          return;
        }

        if (path === "/api/channels" && req.method === "POST") {
          const body = await this._readBody(req);
          const result = this.channelManager.registerChannel(body);
          this._json(res, 200, result);
          return;
        }

        // ── Health Check ─────────────────────────
        if (path === "/api/health") {
          this._json(res, 200, {
            status: "ok",
            service: "Smart Wallet Agent",
            channels: this.channelManager.getChannels().map((c) => ({
              id: c.id,
              type: c.type,
              enabled: c.enabled,
            })),
            timestamp: new Date().toISOString(),
          });
          return;
        }

        // ── 404 ──────────────────────────────────
        this._json(res, 404, { error: "Not found", available_endpoints: [
          "POST /api/chat — Send message to agent (app channel)",
          "GET  /api/chat/history — Get chat history",
          "POST /api/link-wallet — Link wallet to channel",
          "POST /api/webhook/whatsapp — Twilio WhatsApp webhook",
          "GET  /api/channels — List configured channels",
          "POST /api/channels — Register new channel",
          "GET  /api/health — Health check",
        ]});

      } catch (err) {
        console.error("[HTTP] Error:", err.message);
        this._json(res, 500, { error: err.message });
      }
    });

    server.listen(this.port, () => {
      console.error(`[HTTP] API server running on http://localhost:${this.port}`);
      console.error(`[HTTP] Endpoints:`);
      console.error(`  POST /api/chat          — App chat (frontend)`);
      console.error(`  POST /api/webhook/whatsapp — WhatsApp webhook`);
      console.error(`  GET  /api/channels      — List channels`);
      console.error(`  GET  /api/health        — Health check`);
    });

    return server;
  }

  // ── Helpers ─────────────────────────────────────────

  _json(res, status, data) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data, null, 2));
  }

  _readBody(req) {
    return new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({});
        }
      });
      req.on("error", reject);
    });
  }

  _readFormBody(req) {
    return new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => {
        const params = new URLSearchParams(data);
        const obj = {};
        for (const [key, val] of params) obj[key] = val;
        resolve(obj);
      });
      req.on("error", reject);
    });
  }
}
