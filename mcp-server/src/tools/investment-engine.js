// Investment Engine — Yield strategies, Venus→Rootstock, portfolio management
// The agent uses this to manage user investments autonomously
import { MOCK_PRICES } from "../constants.js";

export class InvestmentEngine {
  constructor(db) {
    this.db = db;

    // Available yield strategies
    this.strategies = [
      {
        id: "venus-usdt-lending",
        name: "Venus USDT Lending",
        description: "Prestá tus USDT en Venus Protocol (BSC) y ganá intereses. Bajo riesgo.",
        chain: "BSC",
        protocol: "Venus",
        token_in: "USDT",
        apy: 4.2,
        risk: "low",
        min_amount: "10",
        lock_period_days: 0,
        type: "lending",
      },
      {
        id: "venus-bnb-lending",
        name: "Venus BNB Lending",
        description: "Depositá BNB en Venus y ganá intereses. Riesgo bajo-medio.",
        chain: "BSC",
        protocol: "Venus",
        token_in: "BNB",
        apy: 2.8,
        risk: "low",
        min_amount: "0.01",
        lock_period_days: 0,
        type: "lending",
      },
      {
        id: "rsk-rbtc-yield",
        name: "Rootstock rBTC Yield Farming",
        description: "Yield farming con rBTC en Rootstock. Mayor rendimiento, mayor riesgo. Cross-chain.",
        chain: "Rootstock",
        protocol: "RSK DeFi",
        token_in: "rBTC",
        apy: 10.5,
        risk: "medium",
        min_amount: "0.0001",
        lock_period_days: 7,
        type: "yield_farming",
      },
      {
        id: "venus-rsk-spread",
        name: "Venus→Rootstock Yield Spread",
        description: "Estrategia avanzada: colateral USDT en Venus, préstamo BTCB, bridge a Rootstock para yield. Spread neto ~5.3% APY.",
        chain: "BSC + Rootstock",
        protocol: "Venus + RSK DeFi",
        token_in: "USDT",
        apy: 5.3,
        risk: "medium-high",
        min_amount: "100",
        lock_period_days: 30,
        type: "yield_spread",
        details: {
          step1: "Depositar USDT como colateral en Venus (BSC)",
          step2: "Tomar préstamo BTCB a ~4% APY",
          step3: "Bridge BTCB → rBTC via Rootstock bridge",
          step4: "Yield farming rBTC en Rootstock a ~10% APY",
          net_spread: "10% - 4% - gas - bridge ≈ 5.3% APY neto",
          performance_fee: "15% del yield (80% usuario / 15% protocolo / 5% agente)",
        },
      },
      {
        id: "stable-savings",
        name: "CajaFuerte Stablecoin Savings",
        description: "Ahorro simple en stablecoins. Sin riesgo de IL. Ideal para principiantes.",
        chain: "BSC",
        protocol: "Smart Wallet CajaFuerte",
        token_in: "USDT",
        apy: 3.5,
        risk: "very-low",
        min_amount: "1",
        lock_period_days: 0,
        type: "savings",
      },
    ];
  }

  // ── Strategies ──────────────────────────────────────

  async getStrategies() {
    return {
      success: true,
      strategies: this.strategies.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        chain: s.chain,
        protocol: s.protocol,
        token_in: s.token_in,
        apy: `${s.apy}%`,
        risk: s.risk,
        min_amount: `${s.min_amount} ${s.token_in}`,
        lock_period: s.lock_period_days === 0 ? "Sin lock" : `${s.lock_period_days} días`,
        type: s.type,
        ...(s.details ? { details: s.details } : {}),
      })),
      recommendation: "Para principiantes: 'stable-savings'. Para mayor rendimiento: 'venus-rsk-spread'.",
    };
  }

  // ── Invest ──────────────────────────────────────────

  async invest(params) {
    const wallet = await this.db.getWallet(params.wallet_address);
    if (!wallet) return { success: false, error: "wallet_not_found" };

    const strategy = this.strategies.find((s) => s.id === params.strategy_id);
    if (!strategy) {
      return {
        success: false,
        error: "strategy_not_found",
        message: `Estrategia "${params.strategy_id}" no encontrada. Usá yield_strategies para ver las disponibles.`,
      };
    }

    const amount = parseFloat(params.amount);
    const minAmount = parseFloat(strategy.min_amount);

    if (amount < minAmount) {
      return {
        success: false,
        error: "below_minimum",
        message: `Monto mínimo para ${strategy.name}: ${strategy.min_amount} ${strategy.token_in}. Querés invertir ${params.amount}.`,
      };
    }

    // Check balance
    const currentBalance = parseFloat(wallet.balances[params.token] || "0");
    if (currentBalance < amount) {
      return {
        success: false,
        error: "insufficient_balance",
        message: `Balance insuficiente. Tenés ${currentBalance} ${params.token}, querés invertir ${amount}.`,
      };
    }

    // Deduct from wallet balance
    const balances = { ...wallet.balances };
    balances[params.token] = (currentBalance - amount).toString();
    await this.db.updateWalletBalances(params.wallet_address, balances);

    // Calculate projected earnings
    const amount_usd = amount * (MOCK_PRICES[params.token] || 1);
    const daily_yield = (amount_usd * (strategy.apy / 100)) / 365;
    const monthly_yield = daily_yield * 30;

    // Record investment
    const investment = await this.db.recordInvestment({
      wallet_address: params.wallet_address,
      strategy_id: strategy.id,
      strategy_name: strategy.name,
      amount: params.amount,
      token: params.token,
      amount_usd: amount_usd.toFixed(2),
      apy: strategy.apy,
      chain: strategy.chain,
      protocol: strategy.protocol,
      lock_until: strategy.lock_period_days > 0
        ? new Date(Date.now() + strategy.lock_period_days * 86400000).toISOString()
        : null,
    });

    // Record as transaction
    await this.db.recordTransaction({
      type: "investment",
      from_wallet: params.wallet_address,
      to_wallet: `strategy:${strategy.id}`,
      amount: params.amount,
      token: params.token,
      amount_usd: amount_usd.toFixed(2),
      memo: `Inversión en ${strategy.name}`,
    });

    return {
      success: true,
      investment_id: investment.id,
      strategy: {
        id: strategy.id,
        name: strategy.name,
        apy: `${strategy.apy}%`,
        risk: strategy.risk,
        chain: strategy.chain,
      },
      invested: {
        amount: params.amount,
        token: params.token,
        usd_value: amount_usd.toFixed(2),
      },
      projected_earnings: {
        daily: `$${daily_yield.toFixed(2)} USD`,
        monthly: `$${monthly_yield.toFixed(2)} USD`,
        annual: `$${(daily_yield * 365).toFixed(2)} USD`,
      },
      lock_period: strategy.lock_period_days === 0
        ? "Sin lock — podés retirar cuando quieras"
        : `${strategy.lock_period_days} días (hasta ${investment.lock_until})`,
      remaining_balance: `${balances[params.token]} ${params.token}`,
      message: `Invertiste ${params.amount} ${params.token} en ${strategy.name} al ${strategy.apy}% APY. Rendimiento estimado: $${monthly_yield.toFixed(2)}/mes.`,
    };
  }

  // ── Withdraw Investment ─────────────────────────────

  async withdrawInvestment(params) {
    const investments = await this.db.getInvestments(params.wallet_address);
    const investment = investments.find((i) => i.strategy_id === params.strategy_id);

    if (!investment) {
      return {
        success: false,
        error: "no_active_investment",
        message: `No tenés inversión activa en "${params.strategy_id}".`,
      };
    }

    // Check lock period
    if (investment.lock_until && new Date(investment.lock_until) > new Date()) {
      return {
        success: false,
        error: "locked",
        message: `Inversión bloqueada hasta ${investment.lock_until}. No podés retirar antes.`,
        unlocks_at: investment.lock_until,
      };
    }

    const withdrawAmount = params.amount === "all"
      ? parseFloat(investment.amount)
      : parseFloat(params.amount);

    const investedAmount = parseFloat(investment.amount);
    if (withdrawAmount > investedAmount) {
      return {
        success: false,
        error: "exceeds_investment",
        message: `Querés retirar ${withdrawAmount} pero solo tenés ${investedAmount} invertidos.`,
      };
    }

    // Calculate accrued yield
    const daysInvested = (Date.now() - new Date(investment.created_at).getTime()) / 86400000;
    const yieldEarned = (investedAmount * (investment.apy / 100) * daysInvested) / 365;
    const totalReturn = withdrawAmount + yieldEarned;

    // Return to wallet
    const wallet = await this.db.getWallet(params.wallet_address);
    const balances = { ...wallet.balances };
    const token = investment.token;
    balances[token] = (parseFloat(balances[token] || "0") + totalReturn).toString();
    await this.db.updateWalletBalances(params.wallet_address, balances);

    // Update or close investment
    const remainingInvestment = investedAmount - withdrawAmount;
    if (remainingInvestment <= 0) {
      await this.db.updateInvestment(investment.id, { status: "closed", closed_at: new Date().toISOString() });
    } else {
      await this.db.updateInvestment(investment.id, { amount: remainingInvestment.toString() });
    }

    // Record transaction
    await this.db.recordTransaction({
      type: "investment_withdrawal",
      from_wallet: `strategy:${investment.strategy_id}`,
      to_wallet: params.wallet_address,
      amount: totalReturn.toFixed(6),
      token,
      amount_usd: (totalReturn * (this._getPrice(token))).toFixed(2),
      memo: `Retiro de ${investment.strategy_name} + yield`,
    });

    return {
      success: true,
      withdrawn: {
        principal: withdrawAmount.toFixed(6),
        yield_earned: yieldEarned.toFixed(6),
        total: totalReturn.toFixed(6),
        token,
      },
      days_invested: Math.floor(daysInvested),
      effective_apy: `${investment.apy}%`,
      remaining_investment: remainingInvestment > 0 ? `${remainingInvestment} ${token}` : "Cerrada",
      new_wallet_balance: `${balances[token]} ${token}`,
      message: `Retiraste ${withdrawAmount.toFixed(4)} ${token} + ${yieldEarned.toFixed(4)} de yield (${Math.floor(daysInvested)} días). Total: ${totalReturn.toFixed(4)} ${token}.`,
    };
  }

  // ── Portfolio ───────────────────────────────────────

  async getPortfolio(wallet_address) {
    const investments = await this.db.getInvestments(wallet_address);

    if (investments.length === 0) {
      return {
        success: true,
        wallet_address,
        portfolio: [],
        total_invested_usd: "0",
        total_yield_usd: "0",
        message: "No tenés inversiones activas. Usá yield_strategies para ver opciones.",
      };
    }

    let totalInvested = 0;
    let totalYield = 0;

    const portfolio = investments.map((inv) => {
      const amount = parseFloat(inv.amount);
      const daysInvested = (Date.now() - new Date(inv.created_at).getTime()) / 86400000;
      const yieldEarned = (amount * (inv.apy / 100) * daysInvested) / 365;
      const price = this._getPrice(inv.token);
      const invested_usd = amount * price;
      const yield_usd = yieldEarned * price;

      totalInvested += invested_usd;
      totalYield += yield_usd;

      return {
        strategy_id: inv.strategy_id,
        strategy_name: inv.strategy_name,
        amount: `${amount} ${inv.token}`,
        invested_usd: invested_usd.toFixed(2),
        apy: `${inv.apy}%`,
        chain: inv.chain,
        days_invested: Math.floor(daysInvested),
        yield_earned: `${yieldEarned.toFixed(6)} ${inv.token} ($${yield_usd.toFixed(2)})`,
        total_value: `${(amount + yieldEarned).toFixed(6)} ${inv.token}`,
        lock_until: inv.lock_until || "Sin lock",
        status: inv.status,
      };
    });

    return {
      success: true,
      wallet_address,
      portfolio,
      summary: {
        total_invested_usd: totalInvested.toFixed(2),
        total_yield_usd: totalYield.toFixed(2),
        total_value_usd: (totalInvested + totalYield).toFixed(2),
        weighted_apy: investments.length > 0
          ? `${(investments.reduce((sum, i) => sum + i.apy, 0) / investments.length).toFixed(1)}%`
          : "0%",
        active_strategies: investments.length,
      },
    };
  }

  // ── Helpers ─────────────────────────────────────────

  _getPrice(token) {
    return MOCK_PRICES[token] || 1;
  }
}
