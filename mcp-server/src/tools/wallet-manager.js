// Wallet Manager -- Creates and manages wallets
// Maps to on-chain contracts: Factory (email->wallet), Wallet (SendTo/Receive), StrongBox (deposit/inherit)
import { ethers } from "ethers";
import { MOCK_PRICES, SUPPORTED_TOKENS, SUPPORTED_CHAINS } from "../constants.js";

export class WalletManager {
  constructor(db) {
    this.db = db;
  }

  async createWallet(params) {
    // Check if wallet already exists for this email
    // On-chain: Factory.getWallet(email) != address(0)
    const existing = await this.db.getWalletByEmail(params.owner_email);
    if (existing) {
      return {
        success: false,
        error: "wallet_exists",
        message: `Ya existe una wallet para ${params.owner_email}`,
        wallet_address: existing.address,
      };
    }

    // Generate wallet address
    // On-chain: Factory.createNewWallet(email) deploys a new Wallet contract
    // For hackathon: we generate a local keypair and store it
    const wallet = ethers.Wallet.createRandom();

    const record = await this.db.createWallet({
      address: wallet.address,
      owner_email: params.owner_email,
      owner_name: params.owner_name,
      owner_type: params.owner_type,
      agent_id: params.agent_id,
      agent_platform: params.agent_platform,
    });

    return {
      success: true,
      wallet_address: record.address,
      owner: {
        email: record.owner_email,
        name: record.owner_name,
        type: record.owner_type,
        agent_id: record.agent_id,
        agent_platform: record.agent_platform,
      },
      verification_level: record.verification_level,
      limits: {
        daily: record.daily_limit,
        monthly: record.monthly_limit,
        currency: "USD",
      },
      supported_tokens: SUPPORTED_TOKENS,
      supported_chains: SUPPORTED_CHAINS,
      contracts: {
        factory: "Factory.createNewWallet(email) — registra email→wallet on-chain",
        wallet: "Wallet — SendTo(), Receive(), GetBalance()",
        strongbox: "StrongBox — deposit(), withdraw(), inherit() (opcional, bajo demanda)",
      },
      message: params.owner_type === "agent"
        ? `Wallet creada para agente ${params.agent_platform || "unknown"}. Podés depositar, pagar, invertir y cobrar.`
        : `Wallet creada exitosamente. Depositá fondos para empezar a operar.`,
      next_steps: [
        "Depositar fondos: wallet_deposit",
        "Ver estrategias: yield_strategies",
        "Hacer un pago: wallet_pay",
        "Cobrar: wallet_request_payment",
        "Crear StrongBox (caja fuerte): para herencia y ahorros a largo plazo",
      ],
    };
  }

  async getBalance(wallet_address) {
    const wallet = await this.db.getWallet(wallet_address);
    if (!wallet) {
      return { success: false, error: "wallet_not_found", message: "Wallet no encontrada" };
    }

    // On-chain: Wallet.GetBalance() returns BNB balance
    // For hackathon: return stored balances (multi-token)
    const balances = wallet.balances || {};

    // Calculate total USD value using shared mock prices
    const prices = MOCK_PRICES;
    let total_usd = 0;
    const tokenBalances = Object.entries(balances).map(([token, amount]) => {
      const usd_value = parseFloat(amount) * (prices[token] || 0);
      total_usd += usd_value;
      return { token, amount, usd_value: usd_value.toFixed(2) };
    });

    return {
      success: true,
      wallet_address,
      balances: tokenBalances.length > 0 ? tokenBalances : [{ token: "—", amount: "0", usd_value: "0" }],
      total_usd: total_usd.toFixed(2),
      chain: "BSC Testnet",
    };
  }

  async getWalletInfo(wallet_address) {
    const wallet = await this.db.getWallet(wallet_address);
    if (!wallet) {
      return { success: false, error: "wallet_not_found", message: "Wallet no encontrada" };
    }

    const balance = await this.getBalance(wallet_address);
    const recentTxs = await this.db.getTransactions(wallet_address, { limit: 5 });

    return {
      success: true,
      wallet: {
        address: wallet.address,
        owner_email: wallet.owner_email,
        owner_name: wallet.owner_name,
        owner_type: wallet.owner_type,
        agent_id: wallet.agent_id,
        agent_platform: wallet.agent_platform,
        status: wallet.status,
        verification_level: wallet.verification_level,
        created_at: wallet.created_at,
      },
      balances: balance.balances,
      total_usd: balance.total_usd,
      limits: {
        daily: wallet.daily_limit,
        monthly: wallet.monthly_limit,
        currency: "USD",
      },
      recent_transactions: recentTxs,
    };
  }
}
