// Seed demo data into Supabase for hackathon presentation
// Run: node scripts/seed-demo.js

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tfatikeupkydferbcsbc.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── Demo constants ──────────────────────────────────────────────────────────
const DEMO_USER_ID       = "00000000-0000-0000-0000-000000000001";
const DEMO_WALLET_ID     = "00000000-0000-0000-0000-000000000010";
const DEMO_CF_ID         = "00000000-0000-0000-0000-000000000020";
const DEMO_WALLET_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68";
const DEMO_EMAIL         = "demo@smartwallet.ai";

// ── Helpers ─────────────────────────────────────────────────────────────────
const now        = () => new Date().toISOString();
const daysAgo    = (d) => new Date(Date.now() - d * 86_400_000).toISOString();
const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();

async function upsertRow(table, row, label) {
  const { error } = await supabase.from(table).upsert(row, { onConflict: "id" });
  console.log(`  ${label || table}:`, error ? `ERROR → ${error.message}` : "OK");
}

// ── Seed ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Seeding demo data …\n");

  // 1. User
  console.log("[users]");
  await upsertRow("users", {
    id: DEMO_USER_ID,
    wallet_address: DEMO_WALLET_ADDRESS,
    display_name: "Demo User",
    email: DEMO_EMAIL,
    autonomy_level: "asistente",
    created_at: daysAgo(60),
    updated_at: now(),
    last_active_at: daysAgo(3),
  }, "demo user");

  // 2. Wallet
  console.log("\n[wallets]");
  await upsertRow("wallets", {
    id: DEMO_WALLET_ID,
    user_id: DEMO_USER_ID,
    contract_address: DEMO_WALLET_ADDRESS,
    chain_id: 97,
    balance_bnb: 0.5,
    balance_usdt: 1250.32,
    balance_btcb: 0,
    is_deployed: true,
    deploy_tx_hash: "0xdeploy1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    created_at: daysAgo(60),
    updated_at: now(),
  }, "demo wallet");

  // 3. Caja Fuerte
  console.log("\n[caja_fuerte]");
  await upsertRow("caja_fuerte", {
    id: DEMO_CF_ID,
    user_id: DEMO_USER_ID,
    wallet_id: DEMO_WALLET_ID,
    contract_address: "0xCajaFuerte0000000000000000000000000000001",
    chain_id: 97,
    balance_usdt: 4830,
    balance_btcb: 0,
    balance_rbtc: 0,
    dead_man_timeout_seconds: 7_776_000,        // 90 days
    last_activity_at: daysAgo(3),
    recovery_state: "inactive",
    withdrawal_unlocks_at: null,
    is_deployed: true,
    created_at: daysAgo(45),
    updated_at: now(),
  }, "demo caja fuerte");

  // 4. Herederos
  console.log("\n[herederos]");
  await upsertRow("herederos", {
    id: "00000000-0000-0000-0000-000000000030",
    caja_fuerte_id: DEMO_CF_ID,
    slot: 1,
    address: "0x1234567890abcdef1234567890abcdef12345678",
    display_name: "Maria Garcia",
    share_percentage: 60.00,
    nonce: 0,
    created_at: daysAgo(40),
    updated_at: daysAgo(40),
  }, "heredero 1 – Maria");

  await upsertRow("herederos", {
    id: "00000000-0000-0000-0000-000000000031",
    caja_fuerte_id: DEMO_CF_ID,
    slot: 2,
    address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    display_name: "Carlos Garcia",
    share_percentage: 40.00,
    nonce: 0,
    created_at: daysAgo(40),
    updated_at: daysAgo(40),
  }, "heredero 2 – Carlos");

  // 5. Yield Positions
  console.log("\n[yield_positions]");
  const yieldPositions = [
    {
      id: "00000000-0000-0000-0000-000000000040",
      user_id: DEMO_USER_ID,
      caja_fuerte_id: DEMO_CF_ID,
      protocol: "Venus Protocol",
      chain_id: 97,
      pool_address: "0xVenusPoolUSDT000000000000000000000000001",
      position_type: "lending",
      token_symbol: "USDT",
      amount: 2000,
      amount_usd: 2084.00,
      apy_current: 4.2000,
      ltv_ratio: 0.0000,
      is_active: true,
      opened_at: daysAgo(30),
      closed_at: null,
      updated_at: now(),
    },
    {
      id: "00000000-0000-0000-0000-000000000041",
      user_id: DEMO_USER_ID,
      caja_fuerte_id: DEMO_CF_ID,
      protocol: "Rootstock Yield",
      chain_id: 30,
      pool_address: "0xRootstockPool000000000000000000000000001",
      position_type: "staking",
      token_symbol: "rBTC",
      amount: 0.025,
      amount_usd: 1602.42,
      apy_current: 10.5000,
      ltv_ratio: 0.0000,
      is_active: true,
      opened_at: daysAgo(20),
      closed_at: null,
      updated_at: now(),
    },
    {
      id: "00000000-0000-0000-0000-000000000042",
      user_id: DEMO_USER_ID,
      caja_fuerte_id: DEMO_CF_ID,
      protocol: "Venus-RSK Spread",
      chain_id: 97,
      pool_address: "0xVenusRSKSpread0000000000000000000000001",
      position_type: "spread",
      token_symbol: "USDT",
      amount: 1330,
      amount_usd: 1330.00,
      apy_current: 5.3000,
      ltv_ratio: 0.6820,
      is_active: true,
      opened_at: daysAgo(5),
      closed_at: null,
      updated_at: now(),
    },
  ];

  for (const yp of yieldPositions) {
    await upsertRow("yield_positions", yp, `yield – ${yp.protocol}`);
  }

  // 6. Agent Decisions
  console.log("\n[agent_decisions]");
  const decisions = [
    {
      id: "00000000-0000-0000-0000-000000000050",
      user_id: DEMO_USER_ID,
      action_type: "analysis",
      autonomy_level: "asistente",
      hypothesis: { type: "yield_check", target: "rBTC" },
      reasoning: "rBTC yield subio a 10.5% APY — evaluando rebalanceo de posiciones para maximizar spread.",
      evidence: { apy_before: 8.2, apy_after: 10.5, source: "Rootstock oracle" },
      confidence: 0.820,
      reflection_result: "confirmed",
      final_action: "report_to_user",
      tx_hash: null,
      outcome: { action: "notified_user", accepted: true },
      copper_votes: null,
      execution_time_ms: 1240,
      created_at: minutesAgo(2),
    },
    {
      id: "00000000-0000-0000-0000-000000000051",
      user_id: DEMO_USER_ID,
      action_type: "suggestion",
      autonomy_level: "copiloto",
      hypothesis: { type: "rebalance", move_pct: 5, from: "Venus", to: "Rootstock" },
      reasoning: "Sugerencia: mover +5% a pool Rootstock para maximizar spread. APY diferencial justifica el costo de bridge.",
      evidence: { spread_gain: 1.1, bridge_cost_usd: 0.42 },
      confidence: 0.740,
      reflection_result: "pending_user_approval",
      final_action: "awaiting_confirmation",
      tx_hash: null,
      outcome: null,
      copper_votes: { compliance: "approve", investment: "approve", risk: "conditional", execution: "ready" },
      execution_time_ms: 3200,
      created_at: minutesAgo(5),
    },
    {
      id: "00000000-0000-0000-0000-000000000052",
      user_id: DEMO_USER_ID,
      action_type: "compliance_check",
      autonomy_level: "asistente",
      hypothesis: null,
      reasoning: "Tx $800 USDT aprobada — compliance UIF verificado, monto dentro de limites mensuales.",
      evidence: { monthly_total_usd: 3200, uif_limit_usd: 10000, tx_amount_usd: 800 },
      confidence: 0.990,
      reflection_result: "approved",
      final_action: "tx_approved",
      tx_hash: null,
      outcome: { compliant: true },
      copper_votes: null,
      execution_time_ms: 480,
      created_at: minutesAgo(8),
    },
    {
      id: "00000000-0000-0000-0000-000000000053",
      user_id: DEMO_USER_ID,
      action_type: "reset_deadman",
      autonomy_level: "asistente",
      hypothesis: null,
      reasoning: "Dead Man's Switch: actividad del usuario detectada. Timer reseteado, 87 dias restantes.",
      evidence: { previous_remaining_days: 84, new_remaining_days: 87 },
      confidence: 1.000,
      reflection_result: "executed",
      final_action: "timer_reset",
      tx_hash: null,
      outcome: { reset: true, remaining_seconds: 7_516_800 },
      copper_votes: null,
      execution_time_ms: 320,
      created_at: minutesAgo(15),
    },
    {
      id: "00000000-0000-0000-0000-000000000054",
      user_id: DEMO_USER_ID,
      action_type: "yield_optimize",
      autonomy_level: "copiloto",
      hypothesis: { type: "ltv_monitor", current_ltv: 0.682, liquidation_ltv: 0.85 },
      reasoning: "Colateral Venus OK — LTV 68.2%, margen seguro respecto al umbral de liquidacion 85%.",
      evidence: { collateral_usd: 2084, debt_usd: 1421, health_factor: 1.47 },
      confidence: 0.910,
      reflection_result: "safe",
      final_action: "no_action_needed",
      tx_hash: null,
      outcome: { status: "healthy" },
      copper_votes: null,
      execution_time_ms: 890,
      created_at: minutesAgo(20),
    },
    {
      id: "00000000-0000-0000-0000-000000000055",
      user_id: DEMO_USER_ID,
      action_type: "execute_tx",
      autonomy_level: "autonomo",
      hypothesis: { type: "yield_deposit", amount: 100, token: "USDT", protocol: "Venus" },
      reasoning: "Deposito 100 USDT en Venus Protocol — 4.2% APY. Ejecutado automaticamente en modo autonomo.",
      evidence: { pool_liquidity_usd: 12_500_000, gas_cost_usd: 0.08 },
      confidence: 0.880,
      reflection_result: "executed_successfully",
      final_action: "deposit_completed",
      tx_hash: "0xexec55667788990011223344556677889900112233445566778899001122334455",
      outcome: { deposited: true, new_total: 2100 },
      copper_votes: { compliance: "approve", investment: "approve", risk: "approve", execution: "executed" },
      execution_time_ms: 6800,
      created_at: minutesAgo(30),
    },
    {
      id: "00000000-0000-0000-0000-000000000056",
      user_id: DEMO_USER_ID,
      action_type: "compliance_check",
      autonomy_level: "copiloto",
      hypothesis: null,
      reasoning: "Reporte UIF generado automaticamente: operaciones del mes dentro de parametros regulatorios.",
      evidence: { monthly_volume_usd: 4200, cnv_threshold_usd: 50000, flagged: false },
      confidence: 0.960,
      reflection_result: "report_generated",
      final_action: "monthly_report_filed",
      tx_hash: null,
      outcome: { report_id: "UIF-2026-03", compliant: true },
      copper_votes: null,
      execution_time_ms: 2100,
      created_at: minutesAgo(60),
    },
  ];

  for (const d of decisions) {
    await upsertRow("agent_decisions", d, `decision – ${d.action_type}`);
  }

  // 7. Alerts (3 unread)
  console.log("\n[alerts]");
  const alerts = [
    {
      id: "00000000-0000-0000-0000-000000000060",
      user_id: DEMO_USER_ID,
      priority: "medium",
      title: "Yield optimizado",
      message: "Tu rendimiento en Rootstock subio a 10.5% APY. Considera aumentar tu posicion.",
      category: "yield",
      related_entity_type: "yield_position",
      related_entity_id: "00000000-0000-0000-0000-000000000041",
      is_read: false,
      action_url: "/dashboard/yield",
      created_at: minutesAgo(10),
    },
    {
      id: "00000000-0000-0000-0000-000000000061",
      user_id: DEMO_USER_ID,
      priority: "low",
      title: "Compliance check completado",
      message: "Verificacion mensual UIF completada. Todas las operaciones dentro de limites.",
      category: "compliance",
      related_entity_type: "agent_decision",
      related_entity_id: "00000000-0000-0000-0000-000000000056",
      is_read: false,
      action_url: "/dashboard/compliance",
      created_at: minutesAgo(60),
    },
    {
      id: "00000000-0000-0000-0000-000000000062",
      user_id: DEMO_USER_ID,
      priority: "high",
      title: "Dead Man's Switch activo",
      message: "Tu Dead Man's Switch tiene 87 dias restantes. Herederos configurados correctamente.",
      category: "security",
      related_entity_type: "caja_fuerte",
      related_entity_id: DEMO_CF_ID,
      is_read: false,
      action_url: "/dashboard/strongbox",
      created_at: daysAgo(1),
    },
  ];

  for (const a of alerts) {
    await upsertRow("alerts", a, `alert – ${a.title}`);
  }

  // 8. Transactions
  console.log("\n[transactions]");
  const transactions = [
    {
      id: "00000000-0000-0000-0000-000000000070",
      user_id: DEMO_USER_ID,
      wallet_id: DEMO_WALLET_ID,
      caja_fuerte_id: null,
      tx_type: "deposit",
      status: "confirmed",
      chain_id: 97,
      tx_hash: "0xtx70aabbccddee00112233445566778899aabbccddee00112233445566778899",
      from_address: "0xExternalWallet0000000000000000000000001",
      to_address: DEMO_WALLET_ADDRESS,
      token_symbol: "USDT",
      amount: 2000,
      amount_usd: 2000.00,
      gas_used: 21000,
      gas_cost_usd: 0.05,
      initiated_by: "user",
      agent_decision_id: null,
      error_message: null,
      created_at: daysAgo(30),
      confirmed_at: daysAgo(30),
    },
    {
      id: "00000000-0000-0000-0000-000000000071",
      user_id: DEMO_USER_ID,
      wallet_id: DEMO_WALLET_ID,
      caja_fuerte_id: DEMO_CF_ID,
      tx_type: "yield_deposit",
      status: "confirmed",
      chain_id: 97,
      tx_hash: "0xtx71aabbccddee00112233445566778899aabbccddee00112233445566778899",
      from_address: DEMO_WALLET_ADDRESS,
      to_address: "0xVenusPoolUSDT000000000000000000000000001",
      token_symbol: "USDT",
      amount: 1500,
      amount_usd: 1500.00,
      gas_used: 85000,
      gas_cost_usd: 0.12,
      initiated_by: "agent",
      agent_decision_id: "00000000-0000-0000-0000-000000000055",
      error_message: null,
      created_at: daysAgo(20),
      confirmed_at: daysAgo(20),
    },
    {
      id: "00000000-0000-0000-0000-000000000072",
      user_id: DEMO_USER_ID,
      wallet_id: DEMO_WALLET_ID,
      caja_fuerte_id: null,
      tx_type: "send",
      status: "confirmed",
      chain_id: 97,
      tx_hash: "0xtx72aabbccddee00112233445566778899aabbccddee00112233445566778899",
      from_address: DEMO_WALLET_ADDRESS,
      to_address: "0x9876543210fedcba9876543210fedcba98765432",
      token_symbol: "USDT",
      amount: 50,
      amount_usd: 50.00,
      gas_used: 21000,
      gas_cost_usd: 0.04,
      initiated_by: "user",
      agent_decision_id: null,
      error_message: null,
      created_at: daysAgo(5),
      confirmed_at: daysAgo(5),
    },
    {
      id: "00000000-0000-0000-0000-000000000073",
      user_id: DEMO_USER_ID,
      wallet_id: DEMO_WALLET_ID,
      caja_fuerte_id: null,
      tx_type: "deposit",
      status: "confirmed",
      chain_id: 97,
      tx_hash: "0xtx73aabbccddee00112233445566778899aabbccddee00112233445566778899",
      from_address: "0xFreelanceClient00000000000000000000001",
      to_address: DEMO_WALLET_ADDRESS,
      token_symbol: "USDT",
      amount: 800,
      amount_usd: 800.00,
      gas_used: 21000,
      gas_cost_usd: 0.04,
      initiated_by: "user",
      agent_decision_id: null,
      error_message: null,
      created_at: daysAgo(2),
      confirmed_at: daysAgo(2),
    },
  ];

  for (const t of transactions) {
    await upsertRow("transactions", t, `tx – ${t.tx_type} ${t.amount} ${t.token_symbol}`);
  }

  console.log("\n✅ Seed complete!");
}

seed().catch(console.error);
