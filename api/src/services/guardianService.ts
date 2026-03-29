import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../middlewares/httpError.js';

function assertAdmin() {
  if (!supabaseAdmin) {
    throw new HttpError(500, 'Supabase admin client is not configured');
  }
  return supabaseAdmin;
}

/** Obtener vaults donde la wallet es guardian */
export async function getGuardianVaults(walletAddress: string) {
  const admin = assertAdmin();
  const wallet = walletAddress.toLowerCase();

  const { data: guardianRows, error } = await admin
    .from('guardians')
    .select('strongbox_id, slot')
    .eq('address', wallet);

  if (error) throw new HttpError(500, error.message, error.code);
  if (!guardianRows || guardianRows.length === 0) return [];

  // Fetch strongbox details for each
  const sbIds = guardianRows.map((g) => g.strongbox_id);
  const { data: strongboxes, error: sbErr } = await admin
    .from('strongboxes')
    .select('*')
    .in('id', sbIds);

  if (sbErr) throw new HttpError(500, sbErr.message, sbErr.code);

  return guardianRows.map((g) => ({
    ...g,
    strongbox: (strongboxes ?? []).find((sb) => sb.id === g.strongbox_id) ?? null,
  }));
}

/** Obtener solicitudes pendientes para vaults donde el usuario es guardian */
export async function getGuardianPendingRequests(walletAddress: string) {
  const admin = assertAdmin();
  const wallet = walletAddress.toLowerCase();

  // Primero obtener strongbox IDs donde es guardian
  const { data: guardianRows, error: gErr } = await admin
    .from('guardians')
    .select('strongbox_id, slot')
    .eq('address', wallet);

  if (gErr) throw new HttpError(500, gErr.message, gErr.code);
  if (!guardianRows || guardianRows.length === 0) return [];

  const sbIds = guardianRows.map((g) => g.strongbox_id);

  const { data: requests, error: wrErr } = await admin
    .from('withdrawal_requests')
    .select('*')
    .in('strongbox_id', sbIds)
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false });

  if (wrErr) throw new HttpError(500, wrErr.message, wrErr.code);

  // Fetch strongbox contract addresses so the frontend can call on-chain
  const { data: strongboxes, error: sbErr } = await admin
    .from('strongboxes')
    .select('id, contract_address')
    .in('id', sbIds);

  if (sbErr) throw new HttpError(500, sbErr.message, sbErr.code);

  // Enrich with guardian slot info + contract address
  return (requests ?? []).map((req) => {
    const guardianInfo = guardianRows.find((g) => g.strongbox_id === req.strongbox_id);
    const sb = (strongboxes ?? []).find((s) => s.id === req.strongbox_id);
    return {
      ...req,
      guardian_slot: guardianInfo?.slot ?? null,
      contract_address: sb?.contract_address ?? null,
    };
  });
}

/** Obtener vaults donde la wallet es recoverer/recovery contact */
export async function getHeirVaults(walletAddress: string) {
  const admin = assertAdmin();
  const wallet = walletAddress.toLowerCase();

  const { data: rcRows, error } = await admin
    .from('recovery_contacts')
    .select('strongbox_id, slot, share_percentage')
    .eq('address', wallet);

  if (error) throw new HttpError(500, error.message, error.code);
  if (!rcRows || rcRows.length === 0) return [];

  // Fetch strongbox details
  const sbIds = rcRows.map((r) => r.strongbox_id);
  const { data: strongboxes, error: sbErr } = await admin
    .from('strongboxes')
    .select('*')
    .in('id', sbIds);

  if (sbErr) throw new HttpError(500, sbErr.message, sbErr.code);

  return rcRows.map((rc) => ({
    ...rc,
    strongboxes: (strongboxes ?? []).find((sb) => sb.id === rc.strongbox_id) ?? null,
  }));
}
