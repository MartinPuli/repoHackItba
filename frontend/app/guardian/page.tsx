"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
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
import {
  Check,
  X,
  Loader2,
  Shield,
  AlertTriangle,
  CircleCheckBig,
  Clock,
} from "lucide-react";

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
  const router = useRouter();
  const { address } = useUnifiedWallet();
  const { session, loading: authLoading } = useAuth();
  const { approve, isPending: approveTxPending } = useApproveWithdrawal();
  const { reject, isPending: rejectTxPending } = useRejectWithdrawal();

  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !session) {
      router.replace("/connect");
    }
  }, [authLoading, session, router]);

  const loadRequests = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getGuardianPending(session.access_token);
      setRequests(res.requests);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load requests"
      );
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
      await postWithdrawApprove(session.access_token, req.id);
      await loadRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setActionBusy(null);
    }
  }

  async function handleReject(req: PendingRequest) {
    if (!session?.access_token || !address) return;
    setActionBusy(req.id);
    setError(null);
    try {
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
      await postWithdrawReject(session.access_token, req.id);
      await loadRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setActionBusy(null);
    }
  }

  if (authLoading) {
    return (
      <VaultShell title="Guardian Dashboard" backHref="/role">
        <p className="text-sm text-ink-muted">Loading session…</p>
      </VaultShell>
    );
  }

  if (!session) {
    return (
      <VaultShell title="Guardian Dashboard" backHref="/role">
        <VaultCard>
          <p className="text-ink-muted">
            You need to sign in to view withdrawal requests.
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
        <p
          className="mt-4 rounded-xl border border-danger/20 bg-danger-light px-4 py-3 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {loading && (
          <VaultCard>
            <div className="flex items-center gap-3 py-6 text-ink-muted">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
              Loading requests…
            </div>
          </VaultCard>
        )}

        {!loading && requests.length === 0 && (
          <VaultCard>
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                <Shield className="h-6 w-6 text-brand" />
              </div>
              <p className="text-sm font-medium text-ink-muted">
                No pending requests
              </p>
              <p className="mt-1 text-xs text-ink-ghost">
                Withdrawal requests will appear here.
              </p>
            </div>
          </VaultCard>
        )}

        {requests.map((req, i) => {
          const isBusy =
            actionBusy === req.id || approveTxPending || rejectTxPending;
          const mySlot = req.guardian_slot;
          const alreadyApproved =
            (mySlot === 1 && req.guardian1_approved) ||
            (mySlot === 2 && req.guardian2_approved);
          const hasOnChain =
            !!req.contract_address &&
            isAddress(req.contract_address) &&
            req.on_chain_request_id != null;

          return (
            <VaultCard
              key={req.id}
              className="animate-fade-in-up"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-faint">
                    <div className="h-1.5 w-1.5 rounded-full bg-warning" />
                    Withdrawal Request
                  </div>
                  <span className="rounded-full border border-warning/20 bg-warning-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Pending
                  </span>
                </div>

                <div className="rounded-xl border border-line bg-surface-muted p-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Amount:</span>
                      <span className="font-mono font-bold text-ink">
                        {req.amount} BNB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">To:</span>
                      <span className="font-mono text-xs text-ink-faint">
                        {formatAddress(req.to_address, 6)}
                      </span>
                    </div>
                    {req.contract_address && (
                      <div className="flex justify-between">
                        <span className="text-ink-muted">Vault:</span>
                        <span className="font-mono text-xs text-ink-faint">
                          {formatAddress(req.contract_address, 6)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Guardian approval status */}
                <div className="flex gap-3">
                  <div
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
                      req.guardian1_approved
                        ? "border-brand/20 bg-primary-light text-brand"
                        : "border-line bg-surface-muted text-ink-ghost"
                    }`}
                  >
                    {req.guardian1_approved ? (
                      <CircleCheckBig className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    G1: {req.guardian1_approved ? "Approved" : "Pending"}
                  </div>
                  <div
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
                      req.guardian2_approved
                        ? "border-brand/20 bg-primary-light text-brand"
                        : "border-line bg-surface-muted text-ink-ghost"
                    }`}
                  >
                    {req.guardian2_approved ? (
                      <CircleCheckBig className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    G2: {req.guardian2_approved ? "Approved" : "Pending"}
                  </div>
                </div>

                {!hasOnChain && (
                  <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning-light px-3 py-2 text-xs text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    No on-chain request — approval will be DB-only
                  </div>
                )}

                {alreadyApproved ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-brand/20 bg-primary-light px-3 py-3 text-sm font-semibold text-brand">
                    <CircleCheckBig className="h-4 w-4" />
                    You already approved this request
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <VaultPillButton
                      className="flex-1 gap-2"
                      onClick={() => void handleApprove(req)}
                      disabled={isBusy}
                    >
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                      {isBusy ? "Processing…" : "Approve"}
                    </VaultPillButton>
                    <VaultDangerButton
                      className="flex-1"
                      onClick={() => void handleReject(req)}
                      disabled={isBusy}
                    >
                      <X className="h-4 w-4" strokeWidth={2.5} />
                      {isBusy ? "Processing…" : "Reject"}
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

