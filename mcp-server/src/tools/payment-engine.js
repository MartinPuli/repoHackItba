// Payment Engine — Deposits, withdrawals, transfers, payments, invoicing

export class PaymentEngine {
  constructor(db) {
    this.db = db;
    // Mock prices for testnet
    this.prices = { BNB: 600, USDT: 1, USDC: 1, BUSD: 1, rBTC: 85000 };
  }

  async deposit(params) {
    const wallet = await this.db.getWallet(params.wallet_address);
    if (!wallet) {
      return { success: false, error: "wallet_not_found" };
    }

    const amount = parseFloat(params.amount);
    const balances = { ...wallet.balances };
    balances[params.token] = (parseFloat(balances[params.token] || "0") + amount).toString();
    await this.db.updateWalletBalances(params.wallet_address, balances);

    const amount_usd = (amount * (this.prices[params.token] || 0)).toFixed(2);

    const tx = await this.db.recordTransaction({
      type: "deposit",
      from_wallet: "external",
      to_wallet: params.wallet_address,
      amount: params.amount,
      token: params.token,
      amount_usd,
      source: params.source,
    });

    return {
      success: true,
      transaction_id: tx.id,
      deposited: { amount: params.amount, token: params.token, usd_value: amount_usd },
      new_balance: balances[params.token],
      message: `Depósito de ${params.amount} ${params.token} (~$${amount_usd} USD) procesado.`,
    };
  }

  async withdraw(params) {
    const wallet = await this.db.getWallet(params.wallet_address);
    if (!wallet) {
      return { success: false, error: "wallet_not_found" };
    }

    const amount = parseFloat(params.amount);
    const currentBalance = parseFloat(wallet.balances[params.token] || "0");

    if (currentBalance < amount) {
      return {
        success: false,
        error: "insufficient_balance",
        message: `Balance insuficiente. Tenés ${currentBalance} ${params.token}, querés retirar ${amount}.`,
      };
    }

    const balances = { ...wallet.balances };
    balances[params.token] = (currentBalance - amount).toString();

    // Apply 0.1% withdrawal fee
    const fee = amount * 0.001;
    const netAmount = amount - fee;
    const amount_usd = (netAmount * (this.prices[params.token] || 0)).toFixed(2);

    await this.db.updateWalletBalances(params.wallet_address, balances);

    const tx = await this.db.recordTransaction({
      type: "withdrawal",
      from_wallet: params.wallet_address,
      to_wallet: params.destination,
      amount: netAmount.toString(),
      token: params.token,
      amount_usd,
      fee: fee.toString(),
    });

    return {
      success: true,
      transaction_id: tx.id,
      withdrawn: { amount: netAmount.toFixed(6), token: params.token, usd_value: amount_usd },
      fee: { amount: fee.toFixed(6), token: params.token },
      destination: params.destination,
      remaining_balance: balances[params.token],
    };
  }

  async transfer(params) {
    const fromWallet = await this.db.getWallet(params.from_wallet);
    const toWallet = await this.db.getWallet(params.to_wallet);

    if (!fromWallet) return { success: false, error: "from_wallet_not_found" };
    if (!toWallet) return { success: false, error: "to_wallet_not_found" };

    const amount = parseFloat(params.amount);
    const fromBalance = parseFloat(fromWallet.balances[params.token] || "0");

    if (fromBalance < amount) {
      return {
        success: false,
        error: "insufficient_balance",
        message: `Balance insuficiente. Tenés ${fromBalance} ${params.token}.`,
      };
    }

    // Internal transfers are gasless and feeless
    const fromBalances = { ...fromWallet.balances };
    const toBalances = { ...toWallet.balances };
    fromBalances[params.token] = (fromBalance - amount).toString();
    toBalances[params.token] = (parseFloat(toBalances[params.token] || "0") + amount).toString();

    await this.db.updateWalletBalances(params.from_wallet, fromBalances);
    await this.db.updateWalletBalances(params.to_wallet, toBalances);

    const amount_usd = (amount * (this.prices[params.token] || 0)).toFixed(2);

    const tx = await this.db.recordTransaction({
      type: "transfer",
      from_wallet: params.from_wallet,
      to_wallet: params.to_wallet,
      amount: params.amount,
      token: params.token,
      amount_usd,
      memo: params.memo,
      fee: "0",
    });

    return {
      success: true,
      transaction_id: tx.id,
      transferred: { amount: params.amount, token: params.token, usd_value: amount_usd },
      from: { wallet: params.from_wallet, new_balance: fromBalances[params.token] },
      to: { wallet: params.to_wallet, new_balance: toBalances[params.token] },
      fee: "0 (internal transfer — gasless)",
      memo: params.memo,
    };
  }

  async pay(params) {
    // Payment is a transfer with business metadata
    const transferResult = await this.transfer({
      from_wallet: params.from_wallet,
      to_wallet: params.to_wallet,
      amount: params.amount,
      token: params.token,
      memo: `PAGO: ${params.concept}${params.invoice_id ? ` | Invoice: ${params.invoice_id}` : ""}`,
    });

    if (!transferResult.success) return transferResult;

    return {
      ...transferResult,
      payment: {
        concept: params.concept,
        invoice_id: params.invoice_id || null,
      },
      message: `Pago de ${params.amount} ${params.token} procesado. Concepto: ${params.concept}`,
    };
  }

  async requestPayment(params) {
    const requesterWallet = await this.db.getWallet(params.requester_wallet);
    if (!requesterWallet) return { success: false, error: "requester_wallet_not_found" };

    const expiresAt = new Date(Date.now() + (params.expires_in_hours || 24) * 3600 * 1000).toISOString();

    const request = await this.db.createPaymentRequest({
      requester_wallet: params.requester_wallet,
      payer_wallet: params.payer_wallet || null,
      amount: params.amount,
      token: params.token,
      concept: params.concept,
      expires_at: expiresAt,
    });

    return {
      success: true,
      request_id: request.id,
      payment_link: `smartwallet://pay/${request.id}`,
      amount: params.amount,
      token: params.token,
      concept: params.concept,
      requester: requesterWallet.owner_name,
      expires_at: expiresAt,
      message: params.payer_wallet
        ? `Solicitud de pago enviada a ${params.payer_wallet}.`
        : `Link de pago generado. Compartilo para cobrar.`,
    };
  }

  async getHistory(params) {
    const txs = await this.db.getTransactions(params.wallet_address, {
      limit: params.limit,
      type: params.type === "all" ? "all" : params.type.slice(0, -1), // remove plural 's'
    });

    return {
      success: true,
      wallet_address: params.wallet_address,
      transactions: txs,
      count: txs.length,
    };
  }
}
