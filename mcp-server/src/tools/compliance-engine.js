// Compliance Engine — UIF/CNV rules, KYC/KYA verification, daily limits
// Inspired by Argentine financial regulations for crypto operations
import { MOCK_PRICES } from "../constants.js";

export class ComplianceEngine {
  constructor(db) {
    this.db = db;

    // UIF (Unidad de Información Financiera) thresholds in USD
    this.thresholds = {
      basic: { daily: 1000, monthly: 5000, single_tx: 500 },
      standard: { daily: 5000, monthly: 25000, single_tx: 2500 },
      full: { daily: 50000, monthly: 200000, single_tx: 25000 },
    };

    // CNV (Comisión Nacional de Valores) rules
    this.cnvRules = {
      max_crypto_investment_unverified: 1000, // USD
      required_cooling_period_hours: 24, // for first large withdrawal
      suspicious_patterns: {
        rapid_in_out_minutes: 30, // deposit then immediate withdrawal
        structuring_threshold: 0.8, // tx close to limit = suspicious
      },
    };
  }

  // ── Pre-transaction checks ──────────────────────────

  async checkDeposit(params) {
    const wallet = await this.db.getWallet(params.wallet_address);
    if (!wallet) return { approved: false, reason: "Wallet no encontrada" };

    const amount_usd = this._toUSD(params.amount, params.token);
    const limits = this.thresholds[wallet.verification_level || "basic"];

    if (amount_usd > limits.single_tx) {
      return {
        approved: false,
        reason: `Depósito de $${amount_usd} USD excede el límite por transacción ($${limits.single_tx}) para nivel ${wallet.verification_level}. Verificá tu identidad para subir el límite.`,
        action: "upgrade_verification",
      };
    }

    return { approved: true, checks: ["deposit_limit_ok", "source_ok"] };
  }

  async checkWithdraw(params) {
    const wallet = await this.db.getWallet(params.wallet_address);
    if (!wallet) return { approved: false, reason: "Wallet no encontrada" };

    const amount_usd = this._toUSD(params.amount, params.token);
    const limits = this.thresholds[wallet.verification_level || "basic"];
    const dailyVolume = await this.db.getDailyVolume(params.wallet_address);

    if (amount_usd > limits.single_tx) {
      return {
        approved: false,
        reason: `Retiro de $${amount_usd} USD excede límite por tx ($${limits.single_tx}). Nivel: ${wallet.verification_level}.`,
        action: "upgrade_verification",
      };
    }

    if (dailyVolume + amount_usd > limits.daily) {
      return {
        approved: false,
        reason: `Volumen diario alcanzado. Ya operaste $${dailyVolume.toFixed(2)} hoy, límite: $${limits.daily}.`,
        remaining: (limits.daily - dailyVolume).toFixed(2),
      };
    }

    // Check for suspicious rapid in/out pattern
    const recentDeposits = await this._getRecentDeposits(params.wallet_address, 30);
    if (recentDeposits.length > 0 && amount_usd > 500) {
      return {
        approved: true,
        warning: "Patrón de depósito→retiro rápido detectado. Se registra para monitoreo UIF.",
        checks: ["withdraw_limit_ok", "daily_limit_ok", "uif_flagged"],
      };
    }

    return { approved: true, checks: ["withdraw_limit_ok", "daily_limit_ok"] };
  }

  async checkTransfer(params) {
    const wallet = await this.db.getWallet(params.from_wallet);
    if (!wallet) return { approved: false, reason: "Wallet origen no encontrada" };

    const amount_usd = this._toUSD(params.amount, params.token);
    const limits = this.thresholds[wallet.verification_level || "basic"];
    const dailyVolume = await this.db.getDailyVolume(params.from_wallet);

    if (dailyVolume + amount_usd > limits.daily) {
      return {
        approved: false,
        reason: `Límite diario alcanzado ($${limits.daily}). Volumen hoy: $${dailyVolume.toFixed(2)}.`,
      };
    }

    // Structuring detection (tx close to limit)
    if (amount_usd > limits.single_tx * this.cnvRules.suspicious_patterns.structuring_threshold) {
      return {
        approved: true,
        warning: "Transacción cercana al límite. Se registra para monitoreo anti-structuring.",
        checks: ["transfer_limit_ok", "structuring_monitor"],
      };
    }

    return { approved: true, checks: ["transfer_limit_ok", "daily_limit_ok"] };
  }

  async checkPayment(params) {
    return this.checkTransfer(params);
  }

  async checkInvestment(params) {
    const wallet = await this.db.getWallet(params.wallet_address);
    if (!wallet) return { approved: false, reason: "Wallet no encontrada" };

    const amount_usd = this._toUSD(params.amount, params.token);

    // CNV rule: unverified users can't invest more than threshold
    if (wallet.verification_level === "basic" && amount_usd > this.cnvRules.max_crypto_investment_unverified) {
      return {
        approved: false,
        reason: `Para invertir más de $${this.cnvRules.max_crypto_investment_unverified} USD necesitás verificación "standard" o superior.`,
        action: "upgrade_verification",
      };
    }

    return { approved: true, checks: ["investment_limit_ok", "cnv_compliant"] };
  }

  async checkLoan(params) {
    const wallet = await this.db.getWallet(params.wallet_address);
    if (!wallet) return { approved: false, reason: "Wallet no encontrada" };

    // Loans require at least standard verification
    if (wallet.verification_level === "basic") {
      return {
        approved: false,
        reason: "Para tomar un préstamo necesitás verificación nivel 'standard' como mínimo.",
        action: "upgrade_verification",
      };
    }

    return { approved: true, checks: ["loan_verification_ok", "cnv_compliant"] };
  }

  // ── Status & Verification ──────────────────────────

  async getStatus(wallet_address) {
    const wallet = await this.db.getWallet(wallet_address);
    if (!wallet) return { success: false, error: "wallet_not_found" };

    const dailyVolume = await this.db.getDailyVolume(wallet_address);
    const limits = this.thresholds[wallet.verification_level || "basic"];

    return {
      success: true,
      wallet_address,
      verification_level: wallet.verification_level || "basic",
      limits: {
        daily: { limit: limits.daily, used: dailyVolume.toFixed(2), remaining: (limits.daily - dailyVolume).toFixed(2) },
        monthly: { limit: limits.monthly },
        single_tx: { limit: limits.single_tx },
      },
      uif_status: "compliant",
      cnv_status: "compliant",
      upgrade_options: this._getUpgradeOptions(wallet.verification_level),
    };
  }

  async verify(params) {
    const wallet = await this.db.getWallet(params.wallet_address);
    if (!wallet) return { success: false, error: "wallet_not_found" };

    const level = params.verification_level;
    const data = params.data;

    // Validate required data per level
    if (level === "standard" && (!data.full_name || !data.document_number)) {
      return {
        success: false,
        error: "missing_data",
        message: "Para nivel 'standard' necesitás: nombre completo y número de documento.",
        required: ["full_name", "document_type", "document_number"],
      };
    }

    if (level === "full" && (!data.full_name || !data.document_number || !data.country)) {
      return {
        success: false,
        error: "missing_data",
        message: "Para nivel 'full' necesitás: nombre, documento y país.",
        required: ["full_name", "document_type", "document_number", "country"],
      };
    }

    // Update verification level
    await this.db.updateWalletCompliance(params.wallet_address, {
      verification_level: level,
      kyc_data: data,
      verified_at: new Date().toISOString(),
    });

    const newLimits = this.thresholds[level];

    return {
      success: true,
      wallet_address: params.wallet_address,
      new_level: level,
      new_limits: {
        daily: newLimits.daily,
        monthly: newLimits.monthly,
        single_tx: newLimits.single_tx,
        currency: "USD",
      },
      message: `Verificación actualizada a nivel "${level}". Nuevos límites aplicados.`,
    };
  }

  // ── Helpers ─────────────────────────────────────────

  _toUSD(amount, token) {
    return parseFloat(amount) * (MOCK_PRICES[token] || 1);
  }

  _getUpgradeOptions(currentLevel) {
    if (currentLevel === "full") return [];
    if (currentLevel === "standard") {
      return [{
        level: "full",
        requires: ["full_name", "document_type", "document_number", "country"],
        benefits: "Límites máximos: $50,000/día, $200,000/mes",
      }];
    }
    return [
      {
        level: "standard",
        requires: ["full_name", "document_type", "document_number"],
        benefits: "Límites: $5,000/día, $25,000/mes. Acceso a préstamos.",
      },
      {
        level: "full",
        requires: ["full_name", "document_type", "document_number", "country"],
        benefits: "Límites máximos: $50,000/día, $200,000/mes",
      },
    ];
  }

  async _getRecentDeposits(wallet_address, minutesAgo) {
    const cutoff = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
    // In-memory check
    const txs = await this.db.getTransactions(wallet_address, { limit: 10, type: "deposit" });
    return txs.filter((t) => t.created_at > cutoff);
  }
}
