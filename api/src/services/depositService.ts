import { parseEther } from 'ethers';

import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../middlewares/httpError.js';
import type { Database } from '../types/database.types.js';
import { getProvider } from './chainProvider.js';
import { getStrongboxRowForUser } from './userContractsService.js';

export type ConfirmDepositBody = { tx_hash: string; amount_bnb: string };

function assertAdmin() {
  if (!supabaseAdmin) {
    throw new HttpError(500, 'Supabase admin client is not configured');
  }
  return supabaseAdmin;
}

function normalizeTxHash(raw: string): string {
  const h = raw.trim().toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(h)) {
    throw new HttpError(400, 'tx_hash inválido (esperado 0x + 64 hex)');
  }
  return h;
}

function assertPositiveAmountBnb(raw: string): string {
  const s = raw.trim();
  if (s === '') {
    throw new HttpError(400, 'amount_bnb es requerido');
  }
  try {
    const wei = parseEther(s);
    if (wei <= 0n) {
      throw new HttpError(400, 'amount_bnb debe ser mayor que 0');
    }
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, 'amount_bnb no es un monto BNB válido');
  }
  return s;
}

export type ConfirmDepositResult = { ok: true };

export async function confirmDeposit(
  userId: string,
  body: ConfirmDepositBody
): Promise<ConfirmDepositResult> {
  const amount_bnb = assertPositiveAmountBnb(body.amount_bnb);
  const expectedWei = parseEther(amount_bnb);
  const txHash = normalizeTxHash(body.tx_hash);

  const row = await getStrongboxRowForUser(userId);
  if (!row.is_deployed || !row.contract_address?.trim()) {
    throw new HttpError(
      400,
      'Caja fuerte no deployada on-chain; llamá primero a POST /api/strongbox/confirm-deploy'
    );
  }

  const strongbox = row.contract_address.trim().toLowerCase();

  const provider = getProvider();
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
    throw new HttpError(404, 'Transacción no encontrada o pendiente en la cadena');
  }
  if (receipt.status !== 1) {
    throw new HttpError(400, 'La transacción revertió on-chain');
  }
  if (receipt.to?.toLowerCase() !== strongbox) {
    throw new HttpError(400, 'La transacción no está dirigida al contrato StrongBox del usuario');
  }

  const tx = await provider.getTransaction(txHash);
  if (!tx) {
    throw new HttpError(404, 'No se pudo cargar el detalle de la transacción');
  }
  if (tx.value !== expectedWei) {
    throw new HttpError(400, 'amount_bnb no coincide con el value de la transacción on-chain');
  }

  const admin = assertAdmin();

  const { data: userRow, error: userErr } = await admin
    .from('users')
    .select('wallet_address')
    .eq('id', userId)
    .maybeSingle();

  if (userErr) {
    throw new HttpError(500, userErr.message, userErr.code);
  }
  const fromAddr = userRow?.wallet_address?.trim();
  if (!fromAddr) {
    throw new HttpError(500, 'Usuario sin wallet_address');
  }
  if (tx.from.toLowerCase() !== fromAddr.toLowerCase()) {
    throw new HttpError(400, 'La transacción no fue firmada por la wallet del usuario');
  }

  const insert: Database['public']['Tables']['transactions']['Insert'] = {
    user_id: userId,
    strongbox_id: row.id,
    tx_type: 'deposit',
    status: 'confirmed',
    chain_id: row.chain_id,
    tx_hash: txHash,
    from_address: fromAddr.toLowerCase(),
    to_address: strongbox,
    amount: expectedWei.toString(),
    confirmed_at: new Date().toISOString(),
  };

  const { error: insErr } = await admin.from('transactions').insert(insert);
  if (insErr) {
    throw new HttpError(500, insErr.message, insErr.code);
  }

  return { ok: true };
}
