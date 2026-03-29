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
import { Clock } from "lucide-react";

function pickGuardianAddress(
  guardians: GuardianRow[] | undefined,
  slot: number,
): Address | null {
  const h = guardians?.find((x) => x.slot === slot);
  if (!h?.address || !isAddress(h.address)) return null;
  return getAddress(h.address);
}

function pickRecoveryAddress(
  contacts: RecoveryContactRow[] | undefined,
  slot: number,
): Address | null {
  const h = contacts?.find((x) => x.slot === slot);
  if (!h?.address || !isAddress(h.address)) return null;
  return getAddress(h.address);
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "⚠️ Expired!";
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
  const { data: caja, loading: cajaLoading, error: cajaErr, refetch } =
    useCajaFuerteData(userId ?? undefined);

  const [balanceDisplay, setBalanceDisplay] = useState<string>("—");
  const [balanceSource, setBalanceSource] = useState<"mock" | "rpc" | null>(null);
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

  const onChain = useStrongBoxOnChainState(strongBoxAddr as Address | undefined);

  // Tick every 30 seconds for countdown
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
      setBalanceError(e instanceof Error ? e.message : "No se pudo cargar el balance.");
    }
  }, [session?.access_token, caja?.id]);

  const loadPending = useCallback(async () => {
    if (!session?.access_token || !caja?.is_deployed) return;
    try {
      const res = await getWithdrawPending(session.access_token);
      setPendingRequests(
        res.requests.filter((r) => r.status === "pending_approval"),
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
        throw new Error("Faltan direcciones válidas en guardianes/herederos.");
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

      if (!deployed || deployed === "0x0000000000000000000000000000000000000000") {
        throw new Error("Factory no devolvió dirección de StrongBox.");
      }

      const contractAddress = getAddress(deployed as string);

      await postConfirmDeploy(session.access_token, {
        contract_address: contractAddress,
        deploy_tx_hash: hash,
      });

      await refetch();
      await loadBalance();
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : "Error al deployar.");
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
      setDepositError(e instanceof Error ? e.message : "Error al depositar.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleWithdraw() {
    if (!strongBoxAddr || !session?.access_token || !isAddress(withdrawTo)) return;
    setWithdrawError(null);
    setActionBusy(true);
    try {
      const toAddr = getAddress(withdrawTo) as Address;
      // 1. On-chain: crear withdrawal request
      const { hash } = await withdraw({
        strongBoxAddress: strongBoxAddr as Address,
        amountBnb: withdrawAmount.trim(),
        toAddress: toAddr,
      });

      // 2. DB: registrar en backend
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
      setWithdrawError(e instanceof Error ? e.message : "Error al solicitar retiro.");
    } finally {
      setActionBusy(false);
    }
  }

  if (authLoading) {
    return (
      <VaultShell title="Safe Owner Dashboard" maxWidth="wide">
        <p className="text-sm text-slate-600">Cargando sesión…</p>
      </VaultShell>
    );
  }

  if (!session) {
    return (
      <VaultShell title="Safe Owner Dashboard" maxWidth="wide">
        <VaultCard>
          <p className="text-slate-700">
            Necesitás iniciar sesión para ver tu caja fuerte y balances del backend.
          </p>
          <Link
            href="/role"
            className="mt-4 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Iniciar sesión
          </Link>
        </VaultCard>
      </VaultShell>
    );
  }

  if (!caja && !cajaLoading) {
    return (
      <VaultShell title="Safe Owner Dashboard" maxWidth="wide">
        <VaultCard>
          <p className="text-slate-700">
            No tenés una caja fuerte configurada.
          </p>
          <Link
            href="/safe/configure"
            className="mt-4 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
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
        <p className="mb-4 text-sm text-red-600" role="alert">{cajaErr}</p>
      )}
      {!factoryOk && caja && !caja.is_deployed && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          Definí <code className="text-xs">NEXT_PUBLIC_FACTORY_ADDRESS</code> para deploy on-chain.
        </div>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Balance + Actions */}
        <VaultCard>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Safe Balance (BNB)
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums text-slate-900 md:text-5xl">
            {balanceDisplay}{" "}
            {balanceSource && (
              <span className="text-sm font-normal text-slate-500">
                ({balanceSource === "rpc" ? "on-chain" : "simulado"})
              </span>
            )}
          </p>
          {balanceError && <p className="mt-2 text-xs text-red-600">{balanceError}</p>}
          <p className="mt-2 font-mono text-xs text-slate-500">{addr}</p>
          {strongBoxAddr && (
            <p className="mt-1 font-mono text-xs text-slate-400">
              StrongBox: {formatAddress(strongBoxAddr, 6)}
            </p>
          )}

          {/* Inactivity timer */}
          {inactivitySecondsLeft !== null && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-600">
                Recovery countdown:{" "}
                <strong className={inactivitySecondsLeft === 0 ? "text-red-600" : ""}>
                  {formatCountdown(inactivitySecondsLeft)}
                </strong>
              </span>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            {!caja?.is_deployed && caja && (
              <>
                {deployError && <p className="text-sm text-red-600">{deployError}</p>}
                <VaultSmallGreenButton
                  onClick={() => void handleDeploy()}
                  disabled={!canDeploy || actionBusy || deployTxPending || cajaLoading}
                >
                  {deployTxPending || actionBusy ? "Deploy en curso…" : "Deploy StrongBox on-chain"}
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
                {depositError && <p className="text-sm text-red-600">{depositError}</p>}
                <VaultSmallGreenButton
                  onClick={() => void handleDeposit()}
                  disabled={!canDeposit || actionBusy || depositTxPending}
                >
                  {depositTxPending || actionBusy ? "Depósito en curso…" : "Deposit"}
                </VaultSmallGreenButton>

                {/* Withdraw toggle */}
                {!showWithdraw ? (
                  <VaultMintButton
                    type="button"
                    onClick={() => setShowWithdraw(true)}
                    disabled={onChain.hasPending}
                  >
                    {onChain.hasPending ? "Withdrawal Pending…" : "Request Withdrawal"}
                  </VaultMintButton>
                ) : (
                  <div className="space-y-3 rounded-xl border border-line bg-slate-50 p-4">
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
                    {withdrawError && <p className="text-sm text-red-600">{withdrawError}</p>}
                    <div className="flex gap-2">
                      <VaultSmallGreenButton
                        onClick={() => void handleWithdraw()}
                        disabled={!canWithdraw || actionBusy || withdrawTxPending}
                      >
                        {withdrawTxPending || actionBusy ? "Enviando…" : "Send Request"}
                      </VaultSmallGreenButton>
                      <button
                        type="button"
                        onClick={() => { setShowWithdraw(false); setWithdrawError(null); }}
                        className="rounded-xl px-4 py-2 text-sm text-slate-500 hover:bg-slate-100"
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
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Pending Withdrawals
          </p>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-slate-400">No hay solicitudes pendientes.</p>
          ) : (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"
              >
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount:</span>
                  <span className="font-mono font-semibold">{req.amount} BNB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">To:</span>
                  <span className="font-mono text-xs">{formatAddress(req.to_address, 6)}</span>
                </div>
                <div className="mt-2 flex gap-4 text-xs">
                  <span className={req.guardian1_approved ? "text-emerald-600" : "text-slate-400"}>
                    G1: {req.guardian1_approved ? "✓" : "⏳"}
                  </span>
                  <span className={req.guardian2_approved ? "text-emerald-600" : "text-slate-400"}>
                    G2: {req.guardian2_approved ? "✓" : "⏳"}
                  </span>
                </div>
              </div>
            ))
          )}
        </VaultCard>
      </div>

      {/* Guardians & Recovery Contacts table */}
      <VaultCard className="overflow-x-auto p-0">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Address</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {cajaLoading && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-slate-500">Cargando…</td>
              </tr>
            )}
            {!cajaLoading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-slate-500">—</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                <td className="px-5 py-3.5 font-semibold text-slate-900">{row.name}</td>
                <td className="max-w-[200px] truncate px-5 py-3.5 font-mono text-xs text-slate-600">
                  {row.address}
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{row.email ?? "—"}</td>
                <td className="px-5 py-3.5">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
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
