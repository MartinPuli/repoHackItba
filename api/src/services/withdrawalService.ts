import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../middlewares/httpError.js';
import type { Database } from '../types/database.types.js';
import { getStrongboxRowForUser } from './userContractsService.js';

function assertAdmin() {
  if (!supabaseAdmin) {
    throw new HttpError(500, 'Supabase admin client is not configured');
  }
  return supabaseAdmin;
}

export type WithdrawRequestBody = {
  amount: string;
  to_address: string;
  on_chain_request_id?: number;
};

/** Crear solicitud de retiro en DB */
export async function createWithdrawalRequest(
  userId: string,
  body: WithdrawRequestBody,
): Promise<{ id: string; on_chain_request_id: number | null }> {
  const admin = assertAdmin();
  const row = await getStrongboxRowForUser(userId);

  if (!row.is_deployed) {
    throw new HttpError(400, 'StrongBox no deployada on-chain');
  }

  // Verificar que no haya solicitud activa
  const { data: pending, error: pendErr } = await admin
    .from('withdrawal_requests')
    .select('id')
    .eq('strongbox_id', row.id)
    .eq('status', 'pending_approval')
    .limit(1)
    .maybeSingle();

  if (pendErr) throw new HttpError(500, pendErr.message, pendErr.code);
  if (pending) throw new HttpError(409, 'Ya hay una solicitud de retiro pendiente');

  const insert: Database['public']['Tables']['withdrawal_requests']['Insert'] = {
    strongbox_id: row.id,
    amount: body.amount,
    to_address: body.to_address.toLowerCase(),
    on_chain_request_id: body.on_chain_request_id ?? null,
    status: 'pending_approval',
  };

  const { data: wr, error: wrErr } = await admin
    .from('withdrawal_requests')
    .insert(insert)
    .select('id, on_chain_request_id')
    .single();

  if (wrErr || !wr) {
    throw new HttpError(500, wrErr?.message ?? 'Error creando solicitud', wrErr?.code);
  }

  return { id: wr.id, on_chain_request_id: wr.on_chain_request_id };
}

/** Listar solicitudes pendientes para un strongbox */
export async function getPendingWithdrawals(userId: string) {
  const admin = assertAdmin();
  const row = await getStrongboxRowForUser(userId);

  const { data, error } = await admin
    .from('withdrawal_requests')
    .select('*')
    .eq('strongbox_id', row.id)
    .order('created_at', { ascending: false });

  if (error) throw new HttpError(500, error.message, error.code);
  return data ?? [];
}

/** Guardian aprueba una solicitud */
export async function approveWithdrawal(
  guardianWallet: string,
  withdrawalId: string,
  _guardianSlotHint: 1 | 2,
) {
  const admin = assertAdmin();
  const wallet = guardianWallet.toLowerCase();

  // Fetch the withdrawal request
  const { data: wr, error: wrErr } = await admin
    .from('withdrawal_requests')
    .select('*')
    .eq('id', withdrawalId)
    .single();

  if (wrErr || !wr) {
    throw new HttpError(404, 'Solicitud no encontrada');
  }

  if (wr.status !== 'pending_approval') {
    throw new HttpError(400, `Solicitud ya no está pendiente (status: ${wr.status})`);
  }

  // Verificar que el caller sea guardian de este strongbox
  const { data: guardian, error: gErr } = await admin
    .from('guardians')
    .select('slot, address')
    .eq('strongbox_id', wr.strongbox_id)
    .eq('address', wallet)
    .maybeSingle();

  if (gErr) throw new HttpError(500, gErr.message, gErr.code);
  if (!guardian) throw new HttpError(403, 'No sos guardian de esta StrongBox');

  const slot = guardian.slot as 1 | 2;
  const approvedField = slot === 1 ? 'guardian1_approved' : 'guardian2_approved';
  const approvedAtField = slot === 1 ? 'guardian1_approved_at' : 'guardian2_approved_at';

  if (slot === 1 && wr.guardian1_approved) {
    throw new HttpError(409, 'Guardian 1 ya aprobó');
  }
  if (slot === 2 && wr.guardian2_approved) {
    throw new HttpError(409, 'Guardian 2 ya aprobó');
  }

  const update: Record<string, unknown> = {
    [approvedField]: true,
    [approvedAtField]: new Date().toISOString(),
  };

  // Si ambos aprueban, marcar como approved
  const otherApproved = slot === 1 ? wr.guardian2_approved : wr.guardian1_approved;
  if (otherApproved) {
    update.status = 'approved';
  }

  const { error: upErr } = await admin
    .from('withdrawal_requests')
    .update(update)
    .eq('id', withdrawalId);

  if (upErr) throw new HttpError(500, upErr.message, upErr.code);

  return { approved: true, both_approved: otherApproved };
}

/** Guardian rechaza una solicitud */
export async function rejectWithdrawal(
  guardianWallet: string,
  withdrawalId: string,
) {
  const admin = assertAdmin();
  const wallet = guardianWallet.toLowerCase();

  const { data: wr, error: wrErr } = await admin
    .from('withdrawal_requests')
    .select('*')
    .eq('id', withdrawalId)
    .single();

  if (wrErr || !wr) throw new HttpError(404, 'Solicitud no encontrada');
  if (wr.status !== 'pending_approval') {
    throw new HttpError(400, `Solicitud ya no está pendiente (status: ${wr.status})`);
  }

  // Verificar guardian
  const { data: guardian, error: gErr } = await admin
    .from('guardians')
    .select('slot')
    .eq('strongbox_id', wr.strongbox_id)
    .eq('address', wallet)
    .maybeSingle();

  if (gErr) throw new HttpError(500, gErr.message, gErr.code);
  if (!guardian) throw new HttpError(403, 'No sos guardian de esta StrongBox');

  const { error: upErr } = await admin
    .from('withdrawal_requests')
    .update({ status: 'cancelled' })
    .eq('id', withdrawalId);

  if (upErr) throw new HttpError(500, upErr.message, upErr.code);

  return { rejected: true };
}

/** Marcar retiro como ejecutado (despues de tx on-chain) */
export async function markWithdrawalExecuted(
  withdrawalId: string,
  txHash: string,
) {
  const admin = assertAdmin();

  const { error } = await admin
    .from('withdrawal_requests')
    .update({
      status: 'executed',
      executed_tx_hash: txHash.toLowerCase(),
    })
    .eq('id', withdrawalId);

  if (error) throw new HttpError(500, error.message, error.code);
  return { ok: true };
}
