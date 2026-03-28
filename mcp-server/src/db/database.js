// Database layer — Supabase for persistence, in-memory for hackathon fallback
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// In-memory store for hackathon (no Supabase project needed to demo)
const store = {
  wallets: new Map(),
  transactions: [],
  investments: [],
  payment_requests: [],
  compliance: new Map(),
};

class Database {
  constructor() {
    this.supabase = null;
    this.useMemory = true;

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (url && key) {
      this.supabase = createClient(url, key);
      this.useMemory = false;
    }
  }

  // ── Wallets ──────────────────────────────────────────
  async createWallet(wallet) {
    const record = {
      id: randomUUID(),
      address: wallet.address,
      owner_email: wallet.owner_email,
      owner_name: wallet.owner_name,
      owner_type: wallet.owner_type,
      agent_id: wallet.agent_id || null,
      agent_platform: wallet.agent_platform || null,
      balances: {},
      verification_level: "basic",
      daily_limit: wallet.owner_type === "agent" ? "1000" : "5000",
      monthly_limit: wallet.owner_type === "agent" ? "10000" : "50000",
      created_at: new Date().toISOString(),
      status: "active",
    };

    if (this.useMemory) {
      store.wallets.set(wallet.address, record);
      return record;
    }

    const { data, error } = await this.supabase.from("wallets").insert(record).select().single();
    if (error) throw new Error(`DB error: ${error.message}`);
    return data;
  }

  async getWallet(address) {
    if (this.useMemory) {
      return store.wallets.get(address) || null;
    }
    const { data } = await this.supabase.from("wallets").select("*").eq("address", address).single();
    return data;
  }

  async getWalletByEmail(email) {
    if (this.useMemory) {
      for (const w of store.wallets.values()) {
        if (w.owner_email === email) return w;
      }
      return null;
    }
    const { data } = await this.supabase.from("wallets").select("*").eq("owner_email", email).single();
    return data;
  }

  async updateWalletBalances(address, balances) {
    if (this.useMemory) {
      const w = store.wallets.get(address);
      if (w) w.balances = balances;
      return w;
    }
    const { data } = await this.supabase.from("wallets").update({ balances }).eq("address", address).select().single();
    return data;
  }

  async updateWalletCompliance(address, updates) {
    if (this.useMemory) {
      const w = store.wallets.get(address);
      if (w) Object.assign(w, updates);
      return w;
    }
    const { data } = await this.supabase.from("wallets").update(updates).eq("address", address).select().single();
    return data;
  }

  // ── Transactions ─────────────────────────────────────
  async recordTransaction(tx) {
    const record = {
      id: randomUUID(),
      ...tx,
      created_at: new Date().toISOString(),
      status: tx.status || "completed",
    };

    if (this.useMemory) {
      store.transactions.push(record);
      return record;
    }

    const { data, error } = await this.supabase.from("transactions").insert(record).select().single();
    if (error) throw new Error(`DB error: ${error.message}`);
    return data;
  }

  async getTransactions(wallet_address, { limit = 20, type = "all" } = {}) {
    if (this.useMemory) {
      let txs = store.transactions.filter(
        (t) => t.from_wallet === wallet_address || t.to_wallet === wallet_address
      );
      if (type !== "all") {
        txs = txs.filter((t) => t.type === type);
      }
      return txs.slice(-limit).reverse();
    }

    let query = this.supabase
      .from("transactions")
      .select("*")
      .or(`from_wallet.eq.${wallet_address},to_wallet.eq.${wallet_address}`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (type !== "all") {
      query = query.eq("type", type);
    }
    const { data } = await query;
    return data || [];
  }

  // ── Investments ──────────────────────────────────────
  async recordInvestment(investment) {
    const record = {
      id: randomUUID(),
      ...investment,
      created_at: new Date().toISOString(),
      status: "active",
    };

    if (this.useMemory) {
      store.investments.push(record);
      return record;
    }

    const { data, error } = await this.supabase.from("investments").insert(record).select().single();
    if (error) throw new Error(`DB error: ${error.message}`);
    return data;
  }

  async getInvestments(wallet_address) {
    if (this.useMemory) {
      return store.investments.filter((i) => i.wallet_address === wallet_address && i.status === "active");
    }
    const { data } = await this.supabase
      .from("investments")
      .select("*")
      .eq("wallet_address", wallet_address)
      .eq("status", "active");
    return data || [];
  }

  async updateInvestment(id, updates) {
    if (this.useMemory) {
      const inv = store.investments.find((i) => i.id === id);
      if (inv) Object.assign(inv, updates);
      return inv;
    }
    const { data } = await this.supabase.from("investments").update(updates).eq("id", id).select().single();
    return data;
  }

  // ── Payment Requests ─────────────────────────────────
  async createPaymentRequest(request) {
    const record = {
      id: randomUUID(),
      ...request,
      created_at: new Date().toISOString(),
      status: "pending",
    };

    if (this.useMemory) {
      store.payment_requests.push(record);
      return record;
    }

    const { data, error } = await this.supabase.from("payment_requests").insert(record).select().single();
    if (error) throw new Error(`DB error: ${error.message}`);
    return data;
  }

  async getPaymentRequest(id) {
    if (this.useMemory) {
      return store.payment_requests.find((r) => r.id === id) || null;
    }
    const { data } = await this.supabase.from("payment_requests").select("*").eq("id", id).single();
    return data;
  }

  // ── Daily volume tracking (compliance) ───────────────
  async getDailyVolume(wallet_address) {
    const today = new Date().toISOString().split("T")[0];
    if (this.useMemory) {
      return store.transactions
        .filter(
          (t) =>
            t.from_wallet === wallet_address &&
            t.created_at.startsWith(today) &&
            t.status === "completed"
        )
        .reduce((sum, t) => sum + parseFloat(t.amount_usd || "0"), 0);
    }

    const { data } = await this.supabase
      .from("transactions")
      .select("amount_usd")
      .eq("from_wallet", wallet_address)
      .gte("created_at", `${today}T00:00:00`)
      .eq("status", "completed");

    return (data || []).reduce((sum, t) => sum + parseFloat(t.amount_usd || "0"), 0);
  }
}

export const db = new Database();
