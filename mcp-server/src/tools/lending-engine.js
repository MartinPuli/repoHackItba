// Lending Engine — Préstamos con colateral crypto (Venus-style)
// Un viejo puede decir "quiero un préstamo" y el agente lo maneja
import { MOCK_PRICES } from "../constants.js";

export class LendingEngine {
  constructor(db) {
    this.db = db;

    // Lending parameters
    this.config = {
      // Loan-to-Value ratios by collateral token
      ltv: {
        BNB: 0.65,   // Can borrow up to 65% of BNB collateral value
        USDT: 0.80,  // Stablecoins have higher LTV
        USDC: 0.80,
        BUSD: 0.80,
        rBTC: 0.60,  // BTC more volatile, lower LTV
      },
      // Liquidation threshold (if LTV exceeds this, position gets liquidated)
      liquidation_threshold: {
        BNB: 0.75,
        USDT: 0.90,
        USDC: 0.90,
        BUSD: 0.90,
        rBTC: 0.70,
      },
      // Interest rates (APY) for borrowing
      borrow_rates: {
        USDT: 3.5,
        USDC: 3.5,
        BUSD: 3.5,
        BNB: 5.2,
        rBTC: 4.0,
      },
      // Interest rates earned on collateral (supply APY)
      supply_rates: {
        BNB: 1.2,
        USDT: 4.2,
        USDC: 4.0,
        BUSD: 3.8,
        rBTC: 1.5,
      },
      min_collateral_usd: 10,
      liquidation_penalty: 0.05, // 5% penalty on liquidation
    };

    this.prices = MOCK_PRICES;
  }

  // ── Loan Info ───────────────────────────────────────

  async getLoanOptions(params) {
    const wallet = await this.db.getWallet(params.wallet_address);
    if (!wallet) return { success: false, error: "wallet_not_found" };

    const balances = wallet.balances || {};
    const options = [];

    for (const [token, amount] of Object.entries(balances)) {
      const balance = parseFloat(amount);
      if (balance <= 0) continue;

      const price = this.prices[token] || 0;
      const collateral_usd = balance * price;
      const ltv = this.config.ltv[token] || 0.5;
      const max_borrow_usd = collateral_usd * ltv;

      if (max_borrow_usd < this.config.min_collateral_usd) continue;

      // What can you borrow against this collateral?
      const borrowable_tokens = Object.entries(this.config.borrow_rates).map(([bToken, rate]) => ({
        token: bToken,
        max_amount: (max_borrow_usd / (this.prices[bToken] || 1)).toFixed(6),
        interest_rate: `${rate}% APY`,
        monthly_interest: `$${((max_borrow_usd * rate / 100) / 12).toFixed(2)}`,
      }));

      options.push({
        collateral_token: token,
        collateral_amount: balance.toString(),
        collateral_value_usd: collateral_usd.toFixed(2),
        ltv_ratio: `${(ltv * 100).toFixed(0)}%`,
        liquidation_at: `${(this.config.liquidation_threshold[token] * 100).toFixed(0)}%`,
        max_borrow_usd: max_borrow_usd.toFixed(2),
        supply_apy: `${this.config.supply_rates[token]}%`,
        borrowable: borrowable_tokens,
      });
    }

    return {
      success: true,
      wallet_address: params.wallet_address,
      loan_options: options,
      message: options.length > 0
        ? `Tenés ${options.length} opciones de colateral para pedir un préstamo.`
        : "No tenés tokens suficientes como colateral. Depositá fondos primero.",
    };
  }

  // ── Take Loan ───────────────────────────────────────

  async takeLoan(params) {
    const wallet = await this.db.getWallet(params.wallet_address);
    if (!wallet) return { success: false, error: "wallet_not_found" };

    const collateralAmount = parseFloat(params.collateral_amount);
    const borrowAmount = parseFloat(params.borrow_amount);
    const collateralBalance = parseFloat(wallet.balances[params.collateral_token] || "0");

    // Validate collateral
    if (collateralBalance < collateralAmount) {
      return {
        success: false,
        error: "insufficient_collateral",
        message: `Tenés ${collateralBalance} ${params.collateral_token}, querés poner ${collateralAmount} como colateral.`,
      };
    }

    const collateralPrice = this.prices[params.collateral_token] || 1;
    const borrowPrice = this.prices[params.borrow_token] || 1;
    const collateral_usd = collateralAmount * collateralPrice;
    const borrow_usd = borrowAmount * borrowPrice;
    const ltv = this.config.ltv[params.collateral_token] || 0.5;
    const max_borrow_usd = collateral_usd * ltv;

    if (borrow_usd > max_borrow_usd) {
      const maxBorrowTokens = max_borrow_usd / borrowPrice;
      return {
        success: false,
        error: "exceeds_ltv",
        message: `Con ${collateralAmount} ${params.collateral_token} ($${collateral_usd.toFixed(2)}) podés pedir máximo ${maxBorrowTokens.toFixed(4)} ${params.borrow_token} ($${max_borrow_usd.toFixed(2)}). Querés ${borrowAmount}.`,
        max_borrow: maxBorrowTokens.toFixed(6),
      };
    }

    // Lock collateral (remove from wallet balance)
    const balances = { ...wallet.balances };
    balances[params.collateral_token] = (collateralBalance - collateralAmount).toString();

    // Credit borrowed tokens to wallet
    balances[params.borrow_token] = (parseFloat(balances[params.borrow_token] || "0") + borrowAmount).toString();
    await this.db.updateWalletBalances(params.wallet_address, balances);

    // Record loan
    const currentLtv = borrow_usd / collateral_usd;
    const borrowRate = this.config.borrow_rates[params.borrow_token] || 5;
    const monthlyInterest = (borrow_usd * borrowRate / 100) / 12;

    const loan = await this.db.recordInvestment({
      wallet_address: params.wallet_address,
      strategy_id: `loan:${params.collateral_token}-${params.borrow_token}`,
      strategy_name: `Préstamo: ${params.borrow_token} con colateral ${params.collateral_token}`,
      amount: params.borrow_amount,
      token: params.borrow_token,
      amount_usd: borrow_usd.toFixed(2),
      apy: -borrowRate, // Negative because you PAY interest
      chain: "BSC",
      protocol: "Smart Wallet Lending",
      type: "loan",
      collateral_token: params.collateral_token,
      collateral_amount: params.collateral_amount,
      collateral_usd: collateral_usd.toFixed(2),
      current_ltv: currentLtv.toFixed(4),
    });

    // Record transaction
    await this.db.recordTransaction({
      type: "loan",
      from_wallet: "lending_pool",
      to_wallet: params.wallet_address,
      amount: params.borrow_amount,
      token: params.borrow_token,
      amount_usd: borrow_usd.toFixed(2),
      memo: `Préstamo: ${params.borrow_amount} ${params.borrow_token} con colateral ${params.collateral_amount} ${params.collateral_token}`,
    });

    return {
      success: true,
      loan_id: loan.id,
      borrowed: {
        amount: params.borrow_amount,
        token: params.borrow_token,
        usd_value: borrow_usd.toFixed(2),
      },
      collateral: {
        amount: params.collateral_amount,
        token: params.collateral_token,
        usd_value: collateral_usd.toFixed(2),
        locked: true,
      },
      terms: {
        interest_rate: `${borrowRate}% APY`,
        monthly_interest: `$${monthlyInterest.toFixed(2)} USD`,
        current_ltv: `${(currentLtv * 100).toFixed(1)}%`,
        liquidation_at: `${(this.config.liquidation_threshold[params.collateral_token] * 100).toFixed(0)}%`,
        health_factor: (this.config.liquidation_threshold[params.collateral_token] / currentLtv).toFixed(2),
      },
      message: `Préstamo aprobado. Recibiste ${params.borrow_amount} ${params.borrow_token}. Interés: ${borrowRate}% APY ($${monthlyInterest.toFixed(2)}/mes). Colateral bloqueado: ${params.collateral_amount} ${params.collateral_token}.`,
    };
  }

  // ── Repay Loan ──────────────────────────────────────

  async repayLoan(params) {
    const investments = await this.db.getInvestments(params.wallet_address);
    const loan = investments.find((i) => i.strategy_id?.startsWith("loan:") && i.status === "active");

    if (!loan) {
      return {
        success: false,
        error: "no_active_loan",
        message: "No tenés préstamos activos para repagar.",
      };
    }

    const wallet = await this.db.getWallet(params.wallet_address);
    const repayAmount = params.amount === "all" ? parseFloat(loan.amount) : parseFloat(params.amount);
    const loanToken = loan.token;
    const walletBalance = parseFloat(wallet.balances[loanToken] || "0");

    // Calculate accrued interest
    const daysActive = (Date.now() - new Date(loan.created_at).getTime()) / 86400000;
    const borrowRate = Math.abs(loan.apy);
    const interestOwed = (parseFloat(loan.amount) * (borrowRate / 100) * daysActive) / 365;
    const totalOwed = parseFloat(loan.amount) + interestOwed;

    const actualRepay = Math.min(repayAmount, totalOwed);

    if (walletBalance < actualRepay) {
      return {
        success: false,
        error: "insufficient_balance",
        message: `Necesitás ${actualRepay.toFixed(4)} ${loanToken} para repagar. Tenés ${walletBalance}.`,
        total_owed: totalOwed.toFixed(6),
        interest_owed: interestOwed.toFixed(6),
      };
    }

    // Deduct repayment from wallet
    const balances = { ...wallet.balances };
    balances[loanToken] = (walletBalance - actualRepay).toString();

    // If fully repaid, return collateral
    const remainingDebt = totalOwed - actualRepay;
    let collateralReturned = false;

    if (remainingDebt <= 0.000001) { // Essentially zero
      // Return collateral
      const collateralToken = loan.collateral_token;
      const collateralAmount = parseFloat(loan.collateral_amount);
      balances[collateralToken] = (parseFloat(balances[collateralToken] || "0") + collateralAmount).toString();
      collateralReturned = true;

      await this.db.updateInvestment(loan.id, { status: "closed", closed_at: new Date().toISOString() });
    } else {
      // Partial repayment
      const newLoanAmount = (parseFloat(loan.amount) - (actualRepay - interestOwed)).toString();
      await this.db.updateInvestment(loan.id, { amount: newLoanAmount });
    }

    await this.db.updateWalletBalances(params.wallet_address, balances);

    await this.db.recordTransaction({
      type: "loan_repayment",
      from_wallet: params.wallet_address,
      to_wallet: "lending_pool",
      amount: actualRepay.toFixed(6),
      token: loanToken,
      memo: collateralReturned ? "Repago total + colateral devuelto" : "Repago parcial",
    });

    return {
      success: true,
      repaid: {
        amount: actualRepay.toFixed(6),
        token: loanToken,
        principal: (actualRepay - interestOwed).toFixed(6),
        interest: interestOwed.toFixed(6),
      },
      remaining_debt: remainingDebt > 0.000001 ? `${remainingDebt.toFixed(6)} ${loanToken}` : "0 — Préstamo cerrado",
      collateral_returned: collateralReturned
        ? `${loan.collateral_amount} ${loan.collateral_token} devuelto a tu wallet`
        : "Colateral sigue bloqueado (deuda pendiente)",
      message: collateralReturned
        ? `Préstamo repagado completamente. Tu colateral de ${loan.collateral_amount} ${loan.collateral_token} fue devuelto.`
        : `Repago parcial de ${actualRepay.toFixed(4)} ${loanToken}. Deuda restante: ${remainingDebt.toFixed(4)}.`,
    };
  }

  // ── Loan Status ─────────────────────────────────────

  async getLoanStatus(wallet_address) {
    const investments = await this.db.getInvestments(wallet_address);
    const loans = investments.filter((i) => i.strategy_id?.startsWith("loan:"));

    if (loans.length === 0) {
      return {
        success: true,
        wallet_address,
        active_loans: [],
        message: "No tenés préstamos activos.",
      };
    }

    const activeLoans = loans.map((loan) => {
      const daysActive = (Date.now() - new Date(loan.created_at).getTime()) / 86400000;
      const borrowRate = Math.abs(loan.apy);
      const interestOwed = (parseFloat(loan.amount) * (borrowRate / 100) * daysActive) / 365;
      const totalOwed = parseFloat(loan.amount) + interestOwed;

      const collateralValue = parseFloat(loan.collateral_amount || "0") * (this.prices[loan.collateral_token] || 1);
      const debtValue = totalOwed * (this.prices[loan.token] || 1);
      const currentLtv = debtValue / collateralValue;
      const liqThreshold = this.config.liquidation_threshold[loan.collateral_token] || 0.75;
      const healthFactor = liqThreshold / currentLtv;

      return {
        loan_id: loan.id,
        borrowed: `${loan.amount} ${loan.token}`,
        collateral: `${loan.collateral_amount} ${loan.collateral_token}`,
        interest_rate: `${borrowRate}% APY`,
        days_active: Math.floor(daysActive),
        interest_owed: `${interestOwed.toFixed(6)} ${loan.token}`,
        total_owed: `${totalOwed.toFixed(6)} ${loan.token}`,
        current_ltv: `${(currentLtv * 100).toFixed(1)}%`,
        liquidation_at: `${(liqThreshold * 100).toFixed(0)}%`,
        health_factor: healthFactor.toFixed(2),
        health_status: healthFactor > 1.5 ? "safe" : healthFactor > 1.1 ? "warning" : "danger",
        status: loan.status,
      };
    });

    return {
      success: true,
      wallet_address,
      active_loans: activeLoans,
      total_debt_usd: activeLoans.reduce((sum, l) => {
        const amount = parseFloat(l.total_owed.split(" ")[0]);
        const token = l.total_owed.split(" ")[1];
        return sum + amount * (this.prices[token] || 1);
      }, 0).toFixed(2),
    };
  }
}
