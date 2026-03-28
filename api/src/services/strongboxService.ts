import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../middlewares/httpError.js';
import type { Database } from '../types/database.types.js';

type PersonInput = { wallet: string; email: string };

export type StrongboxSetupBody = {
  own_email: string;
  guardians: PersonInput[];
  recovery_contacts: PersonInput[];
};

function assertAdmin() {
  if (!supabaseAdmin) {
    throw new HttpError(500, 'Supabase admin client is not configured');
  }
  return supabaseAdmin;
}

function normalizeAddr(addr: string): string {
  return addr.trim().toLowerCase();
}

function assertEvmAddress(addr: string, label: string): string {
  const a = normalizeAddr(addr);
  if (!/^0x[a-fA-F0-9]{40}$/.test(a)) {
    throw new HttpError(400, `${label}: dirección EVM inválida`);
  }
  return a;
}

function assertEmail(email: string, label: string): string {
  const e = email.trim();
  if (e === '') {
    throw new HttpError(400, `${label}: email requerido`);
  }
  return e;
}

function assertTwoPeople(arr: PersonInput[], kind: string): void {
  if (!Array.isArray(arr) || arr.length !== 2) {
    throw new HttpError(400, `Se requieren exactamente 2 ${kind}`);
  }
}

export async function setupStrongbox(userId: string, body: StrongboxSetupBody): Promise<void> {
  const ownEmail = assertEmail(body.own_email, 'own_email');
  assertTwoPeople(body.guardians, 'guardians');
  assertTwoPeople(body.recovery_contacts, 'recovery_contacts');

  const g1 = {
    wallet: assertEvmAddress(body.guardians[0]!.wallet, 'guardians[0].wallet'),
    email: assertEmail(body.guardians[0]!.email, 'guardians[0].email'),
  };
  const g2 = {
    wallet: assertEvmAddress(body.guardians[1]!.wallet, 'guardians[1].wallet'),
    email: assertEmail(body.guardians[1]!.email, 'guardians[1].email'),
  };
  const r1 = {
    wallet: assertEvmAddress(body.recovery_contacts[0]!.wallet, 'recovery_contacts[0].wallet'),
    email: assertEmail(body.recovery_contacts[0]!.email, 'recovery_contacts[0].email'),
  };
  const r2 = {
    wallet: assertEvmAddress(body.recovery_contacts[1]!.wallet, 'recovery_contacts[1].wallet'),
    email: assertEmail(body.recovery_contacts[1]!.email, 'recovery_contacts[1].email'),
  };

  const addresses = [g1.wallet, g2.wallet, r1.wallet, r2.wallet];
  const set = new Set(addresses);
  if (set.size !== addresses.length) {
    throw new HttpError(400, 'Las cuatro wallets deben ser distintas entre sí');
  }

  const admin = assertAdmin();

  // Check owner wallet
  const { data: userRow, error: userErr } = await admin
    .from('users')
    .select('wallet_address')
    .eq('id', userId)
    .maybeSingle();
  if (userErr) {
    throw new HttpError(500, userErr.message, userErr.code);
  }
  const ownerWallet = userRow?.wallet_address?.toLowerCase();
  if (ownerWallet && addresses.some((a) => a === ownerWallet)) {
    throw new HttpError(400, 'Guardianes/recovery contacts no pueden usar la wallet del titular');
  }

  // Check existing strongbox
  const { data: existingSb, error: sbCheckErr } = await admin
    .from('strongboxes')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (sbCheckErr) {
    throw new HttpError(500, sbCheckErr.message, sbCheckErr.code);
  }
  if (existingSb) {
    throw new HttpError(409, 'El usuario ya tiene una caja fuerte configurada');
  }

  // Update user email
  const { error: userUpdateErr } = await admin
    .from('users')
    .update({ email: ownEmail })
    .eq('id', userId);
  if (userUpdateErr) {
    throw new HttpError(500, userUpdateErr.message, userUpdateErr.code);
  }

  // Create strongbox
  const sbInsert: Database['public']['Tables']['strongboxes']['Insert'] = {
    user_id: userId,
    is_deployed: false,
  };

  const { data: sbRow, error: sbErr } = await admin
    .from('strongboxes')
    .insert(sbInsert)
    .select('id')
    .single();

  if (sbErr || !sbRow) {
    throw new HttpError(500, sbErr?.message ?? 'Error insertando strongbox', sbErr?.code);
  }

  const sbId = sbRow.id;

  // Insert guardians
  const guardianRows: Database['public']['Tables']['guardians']['Insert'][] = [
    { strongbox_id: sbId, slot: 1, address: g1.wallet, email: g1.email },
    { strongbox_id: sbId, slot: 2, address: g2.wallet, email: g2.email },
  ];

  const { error: gErr } = await admin.from('guardians').insert(guardianRows);
  if (gErr) {
    await admin.from('strongboxes').delete().eq('id', sbId);
    throw new HttpError(500, gErr.message, gErr.code);
  }

  // Insert recovery contacts
  const rcRows: Database['public']['Tables']['recovery_contacts']['Insert'][] = [
    { strongbox_id: sbId, slot: 1, address: r1.wallet, email: r1.email },
    { strongbox_id: sbId, slot: 2, address: r2.wallet, email: r2.email },
  ];

  const { error: rcErr } = await admin.from('recovery_contacts').insert(rcRows);
  if (rcErr) {
    await admin.from('guardians').delete().eq('strongbox_id', sbId);
    await admin.from('strongboxes').delete().eq('id', sbId);
    throw new HttpError(500, rcErr.message, rcErr.code);
  }
}
