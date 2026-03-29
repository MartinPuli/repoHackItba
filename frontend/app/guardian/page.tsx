"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { isAddress, getAddress, type Address } from "viem";
import { VaultShell } from "@/components/vault/VaultShell";
import {
  VaultCard,
  VaultPillButton,
  VaultDangerButton,
} from "@/components/vault/VaultPrimitives";
import { useAuth } from "@/hooks/useAuth";
import {
  useApproveWithdrawal,
  useRejectWithdrawal,
} from "@/hooks/useStrongBoxChain";
import {
  getGuardianPending,
  postWithdrawApprove,
  postWithdrawReject,
} from "@/lib/api/client";
import { formatAddress } from "@/lib/utils";
import { Check, X, Loader2 } from "lucide-react";

interface PendingRequest {
  id: string;
  strongbox_id: string;
  on_chain_request_id: number | null;
  contract_address: string | null;
  amount: string;
  to_address: string;
  status: string;
  guardian1_approved: boolean;
  guardian2_approved: boolean;
  guardian_slot: number | null;
  created_at: string;
}

export default function GuardianInterfacePage() {
  const { address } = useAccount();
  const { session, loading: authLoading } = useAuth();
  const { approve, isPending: approveTxPending } = useApproveWithdrawal();
  const { reject, isPending: rejectTxPending } = useRejectWithdrawal();

  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getGuardianPending(session.access_token);
      setRequests(res.requests);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  async function handleApprove(req: PendingRequest) {
    if (!session?.access_token || !address) return;
    setActionBusy(req.id);
    setError(null);
    try {
      // 1. On-chain: approve withdrawal if we have contract address + on_chain_request_id
      if (
        req.contract_address &&
        isAddress(req.contract_address) &&
        req.on_chain_request_id != null
      ) {
        const contractAddr = getAddress(req.contract_address) as Address;
        await approve({
          strongBoxAddress: contractAddr,
          requestId: BigInt(req.on_chain_request_id),
        });
      }

      // 2. DB: register approval in backend
      await postWithdrawApprove(session.access_token, req.id);
      await loadRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al aprobar");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleReject(req: PendingRequest) {
    if (!session?.access_token || !address) return;
    setActionBusy(req.id);
    setError(null);
    try {
      // 1. On-chain: reject withdrawal if we have contract address + on_chain_request_id
      if (
        req.contract_address &&
        isAddress(req.contract_address) &&
        req.on_chain_request_id != null
      ) {
        const contractAddr = getAddress(req.contract_address) as Address;
        await reject({
          strongBoxAddress: contractAddr,
          requestId: BigInt(req.on_chain_request_id),
        });
      }

      // 2. DB: register rejection in backend
      await postWithdrawReject(session.access_token, req.id);
      await loadRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al rechazar");
    } finally {
      setActionBusy(null);
    }
  }

  if (authLoading) {
    return (
      <VaultShell title="Guardian Dashboard" backHref="/role">
        <p className="text-sm text-slate-600">Cargando sesión…</p>
      </VaultShell>
    );
  }

  if (!session) {
    return (
      <VaultShell title="Guardian Dashboard" backHref="/role">
        <VaultCard>
          <p className="text-slate-700">
            Necesitás iniciar sesión para ver las solicitudes de retiro.
          </p>
        </VaultCard>
      </VaultShell>
    );
  }

  return (
    <VaultShell title="Guardian Dashboard" backHref="/role">
      <p className="text-[15px] leading-relaxed text-ink-muted">
        Review and approve or reject withdrawal requests from vault owners.
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {loading && (
          <VaultCard>
            <div className="flex items-center gap-3 py-4 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando solicitudes…
            </div>
          </VaultCard>
        )}

        {!loading && requests.length === 0 && (
          <VaultCard>
            <p className="py-4 text-center text-sm text-slate-500">
              No hay solicitudes de retiro pendientes para aprobar.
            </p>
          </VaultCard>
        )}

        {requests.map((req) => {
          const isBusy = actionBusy === req.id || approveTxPending || rejectTxPending;
          const mySlot = req.guardian_slot;
          const alreadyApproved =
            (mySlot === 1 && req.guardian1_approved) ||
            (mySlot === 2 && req.guardian2_approved);
          const hasOnChain =
            !!req.contract_address &&
            isAddress(req.contract_address) &&
            req.on_chain_request_id != null;

          return (
            <VaultCard key={req.id}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Withdrawal Request
                  </p>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                    Pending
                  </span>
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount:</span>
                    <span className="font-mono font-semibold">
                      {req.amount} BNB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">To:</span>
                    <span className="font-mono text-xs">
                      {formatAddress(req.to_address, 6)}
                    </span>
                  </div>
                  {req.contract_address && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vault:</span>
                      <span className="font-mono text-xs">
                        {formatAddress(req.contract_address, 6)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Guardian 1:</span>
                    <span
                      className={
                        req.guardian1_approved
                          ? "text-emerald-600 font-semibold"
                          : "text-slate-400"
                      }
                    >
                      {req.guardian1_approved ? "✓ Approved" : "Pending"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Guardian 2:</span>
                    <span
                      className={
                        req.guardian2_approved
                          ? "text-emerald-600 font-semibold"
                          : "text-slate-400"
                      }
                    >
                      {req.guardian2_approved ? "✓ Approved" : "Pending"}
                    </span>
                  </div>
                  {!hasOnChain && (
                    <p className="text-xs text-amber-600">
                      ⚠ Sin request on-chain — la aprobación será solo en DB
                    </p>
                  )}
                </div>

                {alreadyApproved ? (
                  <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700">
                    ✓ Ya aprobaste esta solicitud
                  </p>
                ) : (
                  <div className="mt-3 flex gap-3">
                    <VaultPillButton
                      className="flex-1 gap-2"
                      onClick={() => void handleApprove(req)}
                      disabled={isBusy}
                    >
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                      {isBusy ? "Procesando…" : "Approve"}
                    </VaultPillButton>
                    <VaultDangerButton
                      className="flex-1"
                      onClick={() => void handleReject(req)}
                      disabled={isBusy}
                    >
                      <X className="h-4 w-4" strokeWidth={2.5} />
                      {isBusy ? "Procesando…" : "Reject"}
                    </VaultDangerButton>
                  </div>
                )}
              </div>
            </VaultCard>
          );
        })}
      </div>
    </VaultShell>
  );
}
