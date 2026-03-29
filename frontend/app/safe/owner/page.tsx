"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAccount, usePublicClient } from "wagmi";
import type { Address } from "viem";
import { getAddress, isAddress } from "viem";
import { VaultShell } from "@/components/vault/VaultShell";
import {
  VaultCard,
  VaultField,
  VaultInput,
  VaultSmallGreenButton,
  VaultMintButton,
} from "@/components/vault/VaultPrimitives";
import { useAuth } from "@/hooks/useAuth";
import {
  useCajaFuerteData,
  type GuardianRow,
  type RecoveryContactRow,
} from "@/hooks/useSupabase";
import {
  useFactoryConfigured,
  useCreateStrongBox,
  useDepositStrongBox,
  useWithdrawStrongBox,
  useStrongBoxOnChainState,
} from "@/hooks/useStrongBoxChain";
import {
  ApiError,
  getCajaFuerteBalance,
  postConfirmDeploy,
  postConfirmDeposit,
  postWithdrawRequest,
  getWithdrawPending,
} from "@/lib/api/client";
import { CONTRACTS, FACTORY_ABI } from "@/lib/contracts/abis";
import { formatAddress } from "@/lib/utils";
import { Clock, ArrowDownToLine, ArrowUpFromLine, Rocket, Shield, Users } from "lucide-react";

function pickGuardianAddress(
  guardians: GuardianRow[] | undefined,
  slot: number
): Address | null {
  const h = guardians?.find((x) => x.slot === slot);
  if (!h?.address || !isAddress(h.address)) return null;
  return getAddress(h.address);
}

function pickRecoveryAddress(
  contacts: RecoveryContactRow[] | undefined,
  slot: number
): Address | null {
  const h = contacts?.find((x) => x.slot === slot);
  if (!h?.address || !isAddress(h.address)) return null;
  return getAddress(h.address);
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Expired!";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SafeOwnerDashboardPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { session, userId, loading: authLoading } = useAuth();
  const {
    data: caja,
    loading: cajaLoading,
    error: cajaErr,
    refetch,
  } = useCajaFuerteData(userId ?? undefined);

  const [balanceDisplay, setBalanceDisplay] = useState<string>("—");
  const [balanceSource, setBalanceSource] = useState<"mock" | "rpc" | null>(
    null
  );
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [deployError, setDeployError] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("0.01");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawTo, setWithdrawTo] = useState("");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const [pendingRequests, setPendingRequests] = useState<
    Array<{
      id: string;
      amount: string;
      to_address: string;
      status: string;
      guardian1_approved: boolean;
      guardian2_approved: boolean;
    }>
  >([]);

  const [actionBusy, setActionBusy] = useState(false);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  const factoryOk = useFactoryConfigured();
  const { createStrongBox, isPending: deployTxPending } = useCreateStrongBox();
  const { deposit, isPending: depositTxPending } = useDepositStrongBox();
  const { withdraw, isPending: withdrawTxPending } = useWithdrawStrongBox();

  const strongBoxAddr =
    caja?.contract_address && isAddress(caja.contract_address)
      ? getAddress(caja.contract_address)
      : undefined;

  const onChain = useStrongBoxOnChainState(
    strongBoxAddr as Address | undefined
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const inactivitySecondsLeft = useMemo(() => {
    if (!onChain.lastTimeUsed || !onChain.timeLimit) return null;
    const lastUsed = Number(onChain.lastTimeUsed);
    const limit = Number(onChain.timeLimit);
    return Math.max(0, lastUsed + limit - now);
  }, [onChain.lastTimeUsed, onChain.timeLimit, now]);

  const loadBalance = useCallback(async () => {
    if (!session?.access_token || !caja?.id) {
      setBalanceDisplay("—");
      setBalanceSource(null);
      return;
    }
    setBalanceError(null);
    try {
      const res = await getCajaFuerteBalance(session.access_token);
      setBalanceDisplay(res.balances.native.formatted);
      setBalanceSource(res.balances.source);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setBalanceDisplay("0");
        setBalanceSource(null);
        return;
      }
      setBalanceError(
        e instanceof Error ? e.message : "Failed to load balance."
      );
    }
  }, [session?.access_token, caja?.id]);

  const loadPending = useCallback(async () => {
    if (!session?.access_token || !caja?.is_deployed) return;
    try {
      const res = await getWithdrawPending(session.access_token);
      setPendingRequests(
        res.requests.filter((r) => r.status === "pending_approval")
      );
    } catch {
      // silent
    }
  }, [session?.access_token, caja?.is_deployed]);

  useEffect(() => {
    void loadBalance();
    void loadPending();
  }, [loadBalance, loadPending]);

  const rows = useMemo(() => {
    const g = caja?.guardians ?? [];
    const r = caja?.recovery_contacts ?? [];
    return [
      ...g.map((h) => ({
        key: `g-${h.slot}`,
        name: `Guardian ${h.slot}`,
        address: h.address,
        email: h.email,
        type: "guardian" as const,
      })),
      ...r.map((h) => ({
        key: `r-${h.slot}`,
        name: `Recovery ${h.slot}`,
        address: h.address,
        email: h.email,
        type: "recovery" as const,
      })),
    ];
  }, [caja?.guardians, caja?.recovery_contacts]);

  const addr = address ? formatAddress(address, 5) : "—";

  const canDeploy =
    !!address &&
    !!session?.access_token &&
    !!caja &&
    !caja.is_deployed &&
    factoryOk &&
    !!pickGuardianAddress(caja.guardians, 1) &&
    !!pickGuardianAddress(caja.guardians, 2) &&
    !!pickRecoveryAddress(caja.recovery_contacts, 1) &&
    !!pickRecoveryAddress(caja.recovery_contacts, 2) &&
    caja.time_limit_seconds > 0;

  const canDeposit =
    !!address &&
    !!session?.access_token &&
    !!caja?.is_deployed &&
    !!strongBoxAddr &&
    Number.parseFloat(depositAmount) > 0;

  const canWithdraw =
    !!address &&
    !!session?.access_token &&
    !!caja?.is_deployed &&
    !!strongBoxAddr &&
    Number.parseFloat(withdrawAmount) > 0 &&
    isAddress(withdrawTo);

  async function handleDeploy() {
    if (!address || !session?.access_token || !caja || !publicClient) return;
    setDeployError(null);
    setActionBusy(true);
    try {
      const g1 = pickGuardianAddress(caja.guardians, 1);
      const g2 = pickGuardianAddress(caja.guardians, 2);
      const h1 = pickRecoveryAddress(caja.recovery_contacts, 1);
      const h2 = pickRecoveryAddress(caja.recovery_contacts, 2);
      if (!g1 || !g2 || !h1 || !h2) {
        throw new Error(
          "Missing valid addresses for guardians/recovery contacts."
        );
      }

      const { hash } = await createStrongBox({
        guardian1: g1,
        guardian2: g2,
        heir1: h1,
        heir2: h2,
        timeLimitSeconds: BigInt(caja.time_limit_seconds),
      });

      const deployed = await publicClient.readContract({
        address: CONTRACTS.factory,
        abi: FACTORY_ABI,
        functionName: "getStrongBox",
        args: [address],
      });

      if (
        !deployed ||
        deployed === "0x0000000000000000000000000000000000000000"
      ) {
        throw new Error(
          "Factory did not return a StrongBox address."
        );
      }

      const contractAddress = getAddress(deployed as string);

      await postConfirmDeploy(session.access_token, {
        contract_address: contractAddress,
        deploy_tx_hash: hash,
      });

      await refetch();
      await loadBalance();
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : "Deploy failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDeposit() {
    if (!strongBoxAddr || !session?.access_token) return;
    setDepositError(null);
    setActionBusy(true);
    try {
      const amt = depositAmount.trim();
      const { hash } = await deposit({
        strongBoxAddress: strongBoxAddr as Address,
        amountBnb: amt,
      });
      await postConfirmDeposit(session.access_token, {
        tx_hash: hash,
        amount_bnb: amt,
      });
      await refetch();
      await loadBalance();
    } catch (e) {
      setDepositError(
        e instanceof Error ? e.message : "Deposit failed."
      );
    } finally {
      setActionBusy(false);
    }
  }

  async function handleWithdraw() {
    if (!strongBoxAddr || !session?.access_token || !isAddress(withdrawTo))
      return;
    setWithdrawError(null);
    setActionBusy(true);
    try {
      const toAddr = getAddress(withdrawTo) as Address;
      const { hash } = await withdraw({
        strongBoxAddress: strongBoxAddr as Address,
        amountBnb: withdrawAmount.trim(),
        toAddress: toAddr,
      });

      await postWithdrawRequest(session.access_token, {
        amount: withdrawAmount.trim(),
        to_address: toAddr,
      });

      setShowWithdraw(false);
      setWithdrawAmount("");
      setWithdrawTo("");
      await loadPending();
      await loadBalance();
    } catch (e) {
      setWithdrawError(
        e instanceof Error ? e.message : "Withdrawal request failed."
      );
    } finally {
      setActionBusy(false);
    }
  }

  if (authLoading) {
    return (
      <VaultShell title="Safe Owner Dashboard" maxWidth="wide">
        <p className="text-sm text-ink-muted">Loading session…</p>
      </VaultShell>
    );
  }

  if (!session) {
    return (
      <VaultShell title="Safe Owner Dashboard" maxWidth="wide">
        <VaultCard>
          <p className="text-ink-muted">
            You need to sign in to view your vault and balances.
          </p>
          <Link
            href="/role"
            className="mt-4 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-brand-sm hover:bg-primary-dark"
          >
            Sign In
          </Link>
        </VaultCard>
      </VaultShell>
    );
  }

  if (!caja && !cajaLoading) {
    return (
      <VaultShell title="Safe Owner Dashboard" maxWidth="wide">
        <VaultCard>
          <p className="text-ink-muted">
            You don't have a vault configured yet.
          </p>
          <Link
            href="/safe/configure"
            className="mt-4 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-brand-sm hover:bg-primary-dark"
          >
            Configurar Safe
          </Link>
        </VaultCard>
      </VaultShell>
    );
  }

  return (
    <VaultShell title="Safe Owner Dashboard" maxWidth="wide">
      {cajaErr && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {cajaErr}
        </p>
      )}
      {!factoryOk && caja && !caja.is_deployed && (
        <div className="mb-6 rounded-xl border border-warning/20 bg-warning-light p-4 text-sm text-amber-800">
          Set <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs font-mono">NEXT_PUBLIC_FACTORY_ADDRESS</code> for on-chain deploy.
        </div>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Balance + Actions */}
        <VaultCard>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-faint">
            <div className="h-1.5 w-1.5 rounded-full bg-brand" />
            Safe Balance (BNB)
          </div>
          <p className="mt-3 animate-count-up text-4xl font-extrabold tabular-nums text-ink md:text-5xl">
            {balanceDisplay}
          </p>
          {balanceSource && (
            <span className="mt-1 inline-block rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-ink-faint">
              {balanceSource === "rpc" ? "on-chain" : "simulated"}
            </span>
          )}
          {balanceError && (
            <p className="mt-2 text-xs text-red-600">{balanceError}</p>
          )}
          <p className="mt-3 rounded-lg border border-line bg-surface-muted px-3 py-1.5 font-mono text-xs text-ink-faint">
            {addr}
            {strongBoxAddr && (
              <span className="block mt-0.5 text-ink-ghost">
                StrongBox: {formatAddress(strongBoxAddr, 6)}
              </span>
            )}
          </p>

          {/* Inactivity timer */}
          {inactivitySecondsLeft !== null && (
            <div
              className={`mt-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 ${
                inactivitySecondsLeft === 0
                  ? "border-danger/20 bg-danger-light"
                  : "border-line bg-surface-muted"
              }`}
            >
              <Clock
                className={`h-4 w-4 ${inactivitySecondsLeft === 0 ? "text-danger" : "text-ink-faint"}`}
              />
              <div className="text-xs">
                <span className="text-ink-muted">Recovery countdown: </span>
                <strong
                  className={
                    inactivitySecondsLeft === 0
                      ? "text-danger"
                      : "text-ink font-bold"
                  }
                >
                  {formatCountdown(inactivitySecondsLeft)}
                </strong>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            {!caja?.is_deployed && caja && (
              <>
                {deployError && (
                  <p className="rounded-lg border border-danger/20 bg-danger-light px-3 py-2 text-sm text-red-600">
                    {deployError}
                  </p>
                )}
                <VaultSmallGreenButton
                  onClick={() => void handleDeploy()}
                  disabled={
                    !canDeploy || actionBusy || deployTxPending || cajaLoading
                  }
                >
                  <Rocket className="h-4 w-4" />
                  {deployTxPending || actionBusy
                    ? "Deploying…"
                    : "Deploy StrongBox on-chain"}
                </VaultSmallGreenButton>
              </>
            )}
            {caja?.is_deployed && (
              <>
                {/* Deposit */}
                <VaultField label="Deposit (BNB)">
                  <VaultInput
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.01"
                  />
                </VaultField>
                {depositError && (
                  <p className="rounded-lg border border-danger/20 bg-danger-light px-3 py-2 text-sm text-red-600">
                    {depositError}
                  </p>
                )}
                <VaultSmallGreenButton
                  onClick={() => void handleDeposit()}
                  disabled={!canDeposit || actionBusy || depositTxPending}
                >
                  <ArrowDownToLine className="h-4 w-4" />
                  {depositTxPending || actionBusy
                    ? "Depositing…"
                    : "Deposit"}
                </VaultSmallGreenButton>

                {/* Withdraw toggle */}
                {!showWithdraw ? (
                  <VaultMintButton
                    type="button"
                    onClick={() => setShowWithdraw(true)}
                    disabled={onChain.hasPending}
                  >
                    <ArrowUpFromLine className="mr-1.5 h-4 w-4" />
                    {onChain.hasPending
                      ? "Withdrawal Pending…"
                      : "Request Withdrawal"}
                  </VaultMintButton>
                ) : (
                  <div className="space-y-3 rounded-xl border border-line bg-surface-muted p-4">
                    <VaultField label="Amount (BNB)">
                      <VaultInput
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.005"
                      />
                    </VaultField>
                    <VaultField label="To Address">
                      <VaultInput
                        value={withdrawTo}
                        onChange={(e) => setWithdrawTo(e.target.value)}
                        placeholder="0x..."
                      />
                    </VaultField>
                    {withdrawError && (
                      <p className="rounded-lg border border-danger/20 bg-danger-light px-3 py-2 text-sm text-red-600">
                        {withdrawError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <VaultSmallGreenButton
                        onClick={() => void handleWithdraw()}
                        disabled={
                          !canWithdraw || actionBusy || withdrawTxPending
                        }
                      >
                        {withdrawTxPending || actionBusy
                          ? "Sending…"
                          : "Send Request"}
                      </VaultSmallGreenButton>
                      <button
                        type="button"
                        onClick={() => {
                          setShowWithdraw(false);
                          setWithdrawError(null);
                        }}
                        className="rounded-xl px-4 py-2 text-sm font-medium text-ink-faint transition-colors hover:bg-canvas-subtle hover:text-ink-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </VaultCard>

        {/* Pending withdrawals */}
        <VaultCard className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-faint">
            <div className="h-1.5 w-1.5 rounded-full bg-warning" />
            Pending Withdrawals
          </div>
          {pendingRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line py-8 text-center">
              <p className="text-sm text-ink-ghost">
                No pending withdrawal requests.
              </p>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-warning/20 bg-warning-light p-4 text-sm"
              >
                <div className="flex justify-between">
                  <span className="text-ink-muted">Amount:</span>
                  <span className="font-mono font-bold">{req.amount} BNB</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-ink-muted">To:</span>
                  <span className="font-mono text-xs text-ink-faint">
                    {formatAddress(req.to_address, 6)}
                  </span>
                </div>
                <div className="mt-3 flex gap-4 text-xs">
                  <span
                    className={`flex items-center gap-1 ${req.guardian1_approved ? "font-semibold text-brand" : "text-ink-ghost"}`}
                  >
                    <Shield className="h-3 w-3" />
                    G1: {req.guardian1_approved ? "Approved" : "Pending"}
                  </span>
                  <span
                    className={`flex items-center gap-1 ${req.guardian2_approved ? "font-semibold text-brand" : "text-ink-ghost"}`}
                  >
                    <Shield className="h-3 w-3" />
                    G2: {req.guardian2_approved ? "Approved" : "Pending"}
                  </span>
                </div>
              </div>
            ))
          )}
        </VaultCard>
      </div>

      {/* Guardians & Recovery Contacts */}
      <VaultCard className="overflow-x-auto p-0">
        <div className="flex items-center gap-2 px-5 pt-5 text-xs font-bold uppercase tracking-wider text-ink-faint">
          <Users className="h-3.5 w-3.5" />
          Guardians & Recovery Contacts
        </div>
        <table className="mt-3 w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs font-bold uppercase tracking-wider text-ink-ghost">
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Address</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {cajaLoading && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-ink-faint">
                  Loading…
                </td>
              </tr>
            )}
            {!cajaLoading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-ink-ghost">
                  —
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={row.key}
                className="border-b border-line/60 last:border-0 transition-colors hover:bg-surface-muted/50"
              >
                <td className="px-5 py-3.5 font-semibold text-ink">
                  {row.name}
                </td>
                <td className="max-w-[200px] truncate px-5 py-3.5 font-mono text-xs text-ink-faint">
                  {row.address}
                </td>
                <td className="px-5 py-3.5 text-xs text-ink-muted">
                  {row.email ?? "—"}
                </td>
                <td className="px-5 py-3.5">
                  <span className="rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </VaultCard>
    </VaultShell>
  );
}
