import { getAddress, isAddress } from 'ethers';

import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../middlewares/httpError.js';
import { getProvider } from './chainProvider.js';
import { getCajaFuerteRowForUser } from './userContractsService.js';

function assertAdmin() {
  if (!supabaseAdmin) {
    throw new HttpError(500, 'Supabase admin client is not configured');
  }
  return supabaseAdmin;
}

function normalizeContractAddress(raw: string): string {
  const s = raw.trim();
  if (!isAddress(s)) {
    throw new HttpError(400, 'contract_address inválida');
  }
  return getAddress(s).toLowerCase();
}

function normalizeTxHash(raw: string): string {
  const h = raw.trim().toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(h)) {
    throw new HttpError(400, 'deploy_tx_hash inválido (esperado 0x + 64 hex)');
  }
  return h;
}

export type ConfirmDeployResult = { ok: true; contract_address: string };

export async function confirmDeploy(
  userId: string,
  contractAddress: string,
  deployTxHash: string
): Promise<ConfirmDeployResult> {
  const address = normalizeContractAddress(contractAddress);
  const deploy_hash = normalizeTxHash(deployTxHash);

  const provider = getProvider();
  const code = await provider.getCode(address);
  if (!code || code === '0x') {
    throw new HttpError(
      400,
      'No hay bytecode en la dirección; el deploy no está confirmado on-chain'
    );
  }

  const row = await getCajaFuerteRowForUser(userId);
  if (row.is_deployed) {
    throw new HttpError(409, 'La caja fuerte ya está registrada como deployada');
  }

  const admin = assertAdmin();
  const { error } = await admin
    .from('caja_fuerte')
    .update({
      contract_address: address,
      is_deployed: true,
      deploy_tx_hash: deploy_hash,
    })
    .eq('id', row.id);

  if (error) {
    throw new HttpError(500, error.message, error.code);
  }

  return { ok: true, contract_address: address };
}
