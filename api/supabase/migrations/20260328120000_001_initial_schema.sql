-- ============================================
-- STRONGBOX — DATABASE SCHEMA
-- HackITBA 2026 — Migration 001
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE tx_type AS ENUM ('deposit', 'withdraw', 'recovery');
CREATE TYPE tx_status AS ENUM ('pending', 'confirmed', 'failed', 'reverted');
CREATE TYPE withdrawal_status AS ENUM ('pending_approval', 'approved', 'executed', 'cancelled', 'expired');
CREATE TYPE recovery_state AS ENUM ('inactive', 'pending', 'executed');
CREATE TYPE alert_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- ============================================
-- CORE TABLES
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE strongboxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_address TEXT UNIQUE,
  chain_id INTEGER NOT NULL DEFAULT 97, -- BSC Testnet
  balance_native NUMERIC(28,18) DEFAULT 0,
  time_limit_seconds INTEGER NOT NULL DEFAULT 31536000, -- 1 year
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recovery_state recovery_state NOT NULL DEFAULT 'inactive',
  recovery_unlocks_at TIMESTAMPTZ,
  is_deployed BOOLEAN NOT NULL DEFAULT false,
  deploy_tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE guardians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strongbox_id UUID NOT NULL REFERENCES strongboxes(id) ON DELETE CASCADE,
  slot SMALLINT NOT NULL CHECK (slot IN (1, 2)),
  address TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(strongbox_id, slot)
);

CREATE TABLE recovery_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strongbox_id UUID NOT NULL REFERENCES strongboxes(id) ON DELETE CASCADE,
  slot SMALLINT NOT NULL CHECK (slot IN (1, 2)),
  address TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  share_percentage NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(strongbox_id, slot)
);

CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strongbox_id UUID NOT NULL REFERENCES strongboxes(id) ON DELETE CASCADE,
  on_chain_request_id INTEGER,
  amount NUMERIC(28,18) NOT NULL,
  to_address TEXT NOT NULL,
  status withdrawal_status NOT NULL DEFAULT 'pending_approval',
  guardian1_approved BOOLEAN NOT NULL DEFAULT false,
  guardian2_approved BOOLEAN NOT NULL DEFAULT false,
  guardian1_approved_at TIMESTAMPTZ,
  guardian2_approved_at TIMESTAMPTZ,
  executed_tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strongbox_id UUID REFERENCES strongboxes(id),
  tx_type tx_type NOT NULL,
  status tx_status NOT NULL DEFAULT 'pending',
  chain_id INTEGER NOT NULL DEFAULT 97,
  tx_hash TEXT,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount NUMERIC(28,18) NOT NULL,
  gas_used NUMERIC(28,18),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  priority alert_priority NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_strongboxes_user_id ON strongboxes(user_id);
CREATE INDEX idx_guardians_strongbox_id ON guardians(strongbox_id);
CREATE INDEX idx_recovery_contacts_strongbox_id ON recovery_contacts(strongbox_id);
CREATE INDEX idx_withdrawal_requests_strongbox_id ON withdrawal_requests(strongbox_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_unread ON alerts(user_id, is_read) WHERE is_read = false;

-- ============================================
-- RLS
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE strongboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE withdrawal_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE strongboxes;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_strongboxes_updated BEFORE UPDATE ON strongboxes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_guardians_updated BEFORE UPDATE ON guardians FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_recovery_contacts_updated BEFORE UPDATE ON recovery_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_withdrawal_requests_updated BEFORE UPDATE ON withdrawal_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VIEW
-- ============================================
CREATE OR REPLACE VIEW user_dashboard AS
SELECT
  u.id AS user_id,
  u.wallet_address,
  u.last_active_at,
  sb.contract_address AS strongbox_address,
  sb.balance_native,
  sb.time_limit_seconds,
  sb.last_activity_at AS strongbox_last_activity,
  sb.recovery_state,
  sb.is_deployed,
  (SELECT COUNT(*) FROM withdrawal_requests wr WHERE wr.strongbox_id = sb.id AND wr.status = 'pending_approval') AS pending_withdrawals,
  (SELECT COUNT(*) FROM alerts a WHERE a.user_id = u.id AND a.is_read = false) AS unread_alerts
FROM users u
LEFT JOIN strongboxes sb ON sb.user_id = u.id;
