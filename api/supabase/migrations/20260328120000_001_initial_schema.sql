-- ============================================
-- SMART WALLET AGENT-FIRST — DATABASE SCHEMA
-- HackITBA 2026 — Migration 001_initial_schema
-- ============================================
-- Nota: si el proyecto remoto ya aplicó este DDL, este archivo sirve para
-- reproducibilidad local (supabase db reset). ALTER PUBLICATION ADD TABLE
-- falla si la tabla ya está en supabase_realtime; en ese caso omitir esas
-- líneas al reaplicar manualmente.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE autonomy_level AS ENUM ('asistente', 'copiloto', 'autonomo');
CREATE TYPE tx_type AS ENUM (
  'deposit',
  'withdraw',
  'send',
  'swap',
  'yield_deposit',
  'yield_withdraw',
  'bridge',
  'off_ramp'
);
CREATE TYPE tx_status AS ENUM ('pending', 'confirmed', 'failed', 'reverted');
CREATE TYPE agent_action_type AS ENUM (
  'analysis',
  'suggestion',
  'prepare_tx',
  'execute_tx',
  'compliance_check',
  'rebalance',
  'yield_optimize',
  'reset_deadman',
  'alert'
);
CREATE TYPE alert_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE recovery_state AS ENUM ('inactive', 'pending', 'executed');
CREATE TYPE session_key_status AS ENUM ('active', 'expired', 'revoked');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  autonomy_level autonomy_level NOT NULL DEFAULT 'asistente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  contract_address TEXT UNIQUE NOT NULL,
  chain_id INTEGER NOT NULL DEFAULT 97,
  balance_bnb NUMERIC(28, 18) DEFAULT 0,
  balance_usdt NUMERIC(28, 18) DEFAULT 0,
  balance_btcb NUMERIC(28, 18) DEFAULT 0,
  is_deployed BOOLEAN NOT NULL DEFAULT false,
  deploy_tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE caja_fuerte (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets (id) ON DELETE CASCADE,
  contract_address TEXT UNIQUE NOT NULL,
  chain_id INTEGER NOT NULL DEFAULT 97,
  balance_usdt NUMERIC(28, 18) DEFAULT 0,
  balance_btcb NUMERIC(28, 18) DEFAULT 0,
  balance_rbtc NUMERIC(28, 18) DEFAULT 0,
  dead_man_timeout_seconds INTEGER NOT NULL DEFAULT 7776000,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recovery_state recovery_state NOT NULL DEFAULT 'inactive',
  withdrawal_unlocks_at TIMESTAMPTZ,
  is_deployed BOOLEAN NOT NULL DEFAULT false,
  deploy_tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE herederos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caja_fuerte_id UUID NOT NULL REFERENCES caja_fuerte (id) ON DELETE CASCADE,
  slot SMALLINT NOT NULL CHECK (slot IN (1, 2)),
  address TEXT NOT NULL,
  display_name TEXT,
  share_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
  nonce INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (caja_fuerte_id, slot)
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets (id),
  caja_fuerte_id UUID REFERENCES caja_fuerte (id),
  tx_type tx_type NOT NULL,
  status tx_status NOT NULL DEFAULT 'pending',
  chain_id INTEGER NOT NULL DEFAULT 97,
  tx_hash TEXT,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL DEFAULT 'BNB',
  amount NUMERIC(28, 18) NOT NULL,
  amount_usd NUMERIC(18, 2),
  gas_used NUMERIC(28, 18),
  gas_cost_usd NUMERIC(18, 6),
  initiated_by TEXT NOT NULL DEFAULT 'user',
  agent_decision_id UUID,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

CREATE TABLE session_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets (id) ON DELETE CASCADE,
  key_address TEXT NOT NULL,
  status session_key_status NOT NULL DEFAULT 'active',
  max_amount_per_tx NUMERIC(28, 18) NOT NULL,
  max_amount_cumulative NUMERIC(28, 18) NOT NULL,
  amount_spent NUMERIC(28, 18) NOT NULL DEFAULT 0,
  allowed_functions TEXT[] NOT NULL DEFAULT ARRAY['enviar', 'depositar', 'retirar'],
  allowed_contracts TEXT[] NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE yield_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  caja_fuerte_id UUID NOT NULL REFERENCES caja_fuerte (id) ON DELETE CASCADE,
  protocol TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  pool_address TEXT,
  position_type TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  amount NUMERIC(28, 18) NOT NULL,
  amount_usd NUMERIC(18, 2),
  apy_current NUMERIC(8, 4),
  ltv_ratio NUMERIC(5, 4),
  is_active BOOLEAN NOT NULL DEFAULT true,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agent_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  action_type agent_action_type NOT NULL,
  autonomy_level autonomy_level NOT NULL,
  hypothesis JSONB,
  reasoning TEXT NOT NULL,
  evidence JSONB,
  confidence NUMERIC(4, 3) CHECK (
    confidence >= 0
    AND confidence <= 1
  ),
  reflection_result TEXT,
  reflection_reasoning TEXT,
  final_action TEXT,
  tx_hash TEXT,
  outcome JSONB,
  copper_votes JSONB,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transactions
ADD CONSTRAINT fk_agent_decision FOREIGN KEY (agent_decision_id) REFERENCES agent_decisions (id);

CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  pattern TEXT NOT NULL,
  lesson TEXT NOT NULL,
  source_decision_id UUID REFERENCES agent_decisions (id),
  confidence_weight NUMERIC(4, 3) DEFAULT 0.5,
  times_applied INTEGER DEFAULT 0,
  success_rate NUMERIC(4, 3),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE compliance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions (id),
  regulation TEXT NOT NULL,
  check_type TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  details JSONB,
  flagged BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  priority alert_priority NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallets_user_id ON wallets (user_id);
CREATE INDEX idx_wallets_address ON wallets (contract_address);
CREATE INDEX idx_caja_fuerte_user_id ON caja_fuerte (user_id);
CREATE INDEX idx_caja_fuerte_wallet_id ON caja_fuerte (wallet_id);
CREATE INDEX idx_transactions_user_id ON transactions (user_id);
CREATE INDEX idx_transactions_status ON transactions (status);
CREATE INDEX idx_transactions_created ON transactions (created_at DESC);
CREATE INDEX idx_transactions_tx_hash ON transactions (tx_hash);
CREATE INDEX idx_session_keys_user_id ON session_keys (user_id);
CREATE INDEX idx_session_keys_status ON session_keys (status);
CREATE INDEX idx_yield_positions_user_id ON yield_positions (user_id);
CREATE INDEX idx_yield_positions_active ON yield_positions (is_active);
CREATE INDEX idx_agent_decisions_user_id ON agent_decisions (user_id);
CREATE INDEX idx_agent_decisions_created ON agent_decisions (created_at DESC);
CREATE INDEX idx_knowledge_base_category ON knowledge_base (category);
CREATE INDEX idx_compliance_logs_user_id ON compliance_logs (user_id);
CREATE INDEX idx_alerts_user_id ON alerts (user_id);
CREATE INDEX idx_alerts_unread ON alerts (user_id, is_read)
WHERE
  is_read = false;

CREATE INDEX idx_herederos_caja ON herederos (caja_fuerte_id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja_fuerte ENABLE ROW LEVEL SECURITY;
ALTER TABLE herederos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE yield_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE yield_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_keys;
ALTER PUBLICATION supabase_realtime ADD TABLE caja_fuerte;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_users_updated BEFORE UPDATE ON users FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_wallets_updated BEFORE UPDATE ON wallets FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_caja_fuerte_updated BEFORE UPDATE ON caja_fuerte FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_herederos_updated BEFORE UPDATE ON herederos FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_yield_positions_updated BEFORE UPDATE ON yield_positions FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_knowledge_base_updated BEFORE UPDATE ON knowledge_base FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION expire_session_keys()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE session_keys
  SET
    status = 'expired'
  WHERE
    status = 'active'
    AND expires_at < NOW();
END;
$$;

CREATE OR REPLACE VIEW user_dashboard AS
SELECT
  u.id AS user_id,
  u.wallet_address,
  u.autonomy_level,
  u.last_active_at,
  w.contract_address AS wallet_address_contract,
  w.balance_bnb AS wallet_bnb,
  w.balance_usdt AS wallet_usdt,
  cf.contract_address AS caja_fuerte_address,
  cf.balance_usdt AS caja_usdt,
  cf.balance_rbtc AS caja_rbtc,
  cf.dead_man_timeout_seconds,
  cf.last_activity_at AS deadman_last_activity,
  cf.recovery_state,
  (
    SELECT
      COUNT(*)
    FROM
      session_keys sk
    WHERE
      sk.user_id = u.id
      AND sk.status = 'active'
  ) AS active_session_keys,
  (
    SELECT
      COUNT(*)
    FROM
      alerts a
    WHERE
      a.user_id = u.id
      AND a.is_read = false
  ) AS unread_alerts,
  (
    SELECT
      COALESCE(SUM(yp.amount_usd), 0)
    FROM
      yield_positions yp
    WHERE
      yp.user_id = u.id
      AND yp.is_active = true
  ) AS total_yield_usd
FROM
  users u
  LEFT JOIN wallets w ON w.user_id = u.id
  LEFT JOIN caja_fuerte cf ON cf.user_id = u.id;
