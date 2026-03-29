-- ============================================
-- RLS POLICIES — StrongBox HackITBA 2026
-- ============================================
-- El frontend usa anon key para queries directas.
-- El backend usa service_role_key (bypasses RLS).
-- Estas policies permiten al usuario autenticado leer sus propios datos.

-- ── users ──
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ── strongboxes ──
CREATE POLICY "Owner can read own strongbox"
  ON strongboxes FOR SELECT
  USING (auth.uid() = user_id);

-- ── guardians ──
-- Owner puede ver sus guardians; guardians pueden ver que son guardians
CREATE POLICY "Read guardians for own strongbox"
  ON guardians FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM strongboxes sb
      WHERE sb.id = guardians.strongbox_id
      AND sb.user_id = auth.uid()
    )
    OR address = (
      SELECT lower(wallet_address) FROM users WHERE id = auth.uid()
    )
  );

-- ── recovery_contacts ──
-- Owner puede ver sus recovery contacts; recovery contacts pueden ver su asignación
CREATE POLICY "Read recovery contacts for own strongbox"
  ON recovery_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM strongboxes sb
      WHERE sb.id = recovery_contacts.strongbox_id
      AND sb.user_id = auth.uid()
    )
    OR address = (
      SELECT lower(wallet_address) FROM users WHERE id = auth.uid()
    )
  );

-- ── withdrawal_requests ──
CREATE POLICY "Read withdrawal requests for own strongbox"
  ON withdrawal_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM strongboxes sb
      WHERE sb.id = withdrawal_requests.strongbox_id
      AND sb.user_id = auth.uid()
    )
  );

-- ── transactions ──
CREATE POLICY "Read own transactions"
  ON transactions FOR SELECT
  USING (user_id = auth.uid());

-- ── alerts ──
CREATE POLICY "Read own alerts"
  ON alerts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Update own alerts"
  ON alerts FOR UPDATE
  USING (user_id = auth.uid());
