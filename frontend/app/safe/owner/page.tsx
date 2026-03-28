"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
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
import { useVaultFlow } from "@/context/VaultFlowContext";
import { formatAddress } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCajaFuerteData, type Heredero } from "@/hooks/useSupabase";
import {
  useFactoryConfigured,
  useCreateStrongBox,
  useDepositStrongBox,
} from "@/hooks/useStrongBoxChain";
import {
  getCajaFuerteBalance,
  postConfirmDeploy,
  postConfirmDeposit,
  ApiError,
} from "@/lib/api/client";
import { CONTRACTS, FACTORY_ABI } from "@/lib/contracts/abis";
import { usePublicClient } from "wagmi";

function labelHeredero(h: Heredero): string {
  const role = h.rol === "guardian" ? "Guardian" : "Heir";
  return `${role} ${h.slot}`;
}

function pickHerederoAddress(
  herederos: Heredero[] | undefined,
  rol: "guardian" | "heir",
  slot: number,
): Address | null {
  const h = herederos?.find((x) => x.rol === rol && x.slot === slot);
  if (!h?.address || !isAddress(h.address)) return null;
  return getAddress(h.address);
}

export default function SafeOwnerDashboardPage() {
  const router = useRouter();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { session, userId, loading: authLoading } = useAuth();
  const { getHeirFilter, setGetHeirFilter } = useVaultFlow();
  const { data: caja, loading: cajaLoading, error: cajaErr, refetch } =
    useCajaFuerteData(userId ?? undefined);

  const [balanceDisplay, setBalanceDisplay] = useState<string>("—");
  const [balanceSource, setBalanceSource] = useState<"mock" | "rpc" | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [deployError, setDeployError] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("0.01");
  const [actionBusy, setActionBusy] = useState(false);

  const factoryOk = useFactoryConfigured();
  const { createStrongBox, isPending: deployTxPending } = useCreateStrongBox();
  const { deposit, isPending: depositTxPending } = useDepositStrongBox();

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
        setBalanceError("Sin caja fuerte en el servidor.");
        return;
      }
      setBalanceError(
        e instanceof Error ? e.message : "No se pudo cargar el balance.",
      );
    }
  }, [session?.access_token, caja?.id]);

  useEffect(() => {
    void loadBalance();
  }, [loadBalance]);

  const rows = useMemo(() => {
    const list = caja?.herederos ?? [];
    return list.map((h) => ({
      key: `${h.rol}-${h.slot}`,
      name: labelHeredero(h),
      gains: h.address,
      status: "Active" as const,
    }));
  }, [caja?.herederos]);

  const filtered = rows.filter(
    (r) =>
      !getHeirFilter.trim() ||
      r.name.toLowerCase().includes(getHeirFilter.toLowerCase()) ||
      r.gains.toLowerCase().includes(getHeirFilter.toLowerCase()),
  );

  const addr = address ? formatAddress(address, 5) : "—";

  const canDeploy =
    !!address &&
    !!session?.access_token &&
    !!caja &&
    !caja.is_deployed &&
    factoryOk &&
    !!pickHerederoAddress(caja.herederos, "guardian", 1) &&
    !!pickHerederoAddress(caja.herederos, "guardian", 2) &&
    !!pickHerederoAddress(caja.herederos, "heir", 1) &&
    !!pickHerederoAddress(caja.herederos, "heir", 2) &&
    caja.dead_man_timeout_seconds > 0;

  const strongBoxAddr =
    caja?.contract_address &&
    isAddress(caja.contract_address)
      ? getAddress(caja.contract_address)
      : null;

  const canDeposit =
    !!address &&
    !!session?.access_token &&
    !!caja?.is_deployed &&
    !!strongBoxAddr &&
    Number.parseFloat(depositAmount) > 0;

  async function handleDeploy() {
    if (!address || !session?.access_token || !caja || !publicClient) return;
    setDeployError(null);
    setActionBusy(true);
    try {
      const g1 = pickHerederoAddress(caja.herederos, "guardian", 1);
      const g2 = pickHerederoAddress(caja.herederos, "guardian", 2);
      const h1 = pickHerederoAddress(caja.herederos, "heir", 1);
      const h2 = pickHerederoAddress(caja.herederos, "heir", 2);
      if (!g1 || !g2 || !h1 || !h2) {
        throw new Error("Faltan direcciones válidas en guardianes/herederos.");
      }

      const { hash } = await createStrongBox({
        guardian1: g1,
        guardian2: g2,
        heir1: h1,
        heir2: h2,
        timeLimitSeconds: BigInt(caja.dead_man_timeout_seconds),
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
      setDeployError(
        e instanceof Error ? e.message : "Error al deployar la StrongBox.",
      );
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
        strongBoxAddress: strongBoxAddr,
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
        e instanceof Error ? e.message : "Error al depositar.",
      );
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
            href="/login"
            className="mt-4 inline-block text-sm font-semibold text-[#1e4d3a] underline"
          >
            Ir a login
          </Link>
        </VaultCard>
      </VaultShell>
    );
  }

  return (
    <VaultShell title="Safe Owner Dashboard" maxWidth="wide">
      {!caja && !cajaLoading && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          No hay caja fuerte registrada para tu usuario.{" "}
          <Link href="/safe/configure" className="font-semibold underline">
            Configurá guardianes y herederos
          </Link>
          .
        </div>
      )}
      {cajaErr && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {cajaErr}
        </p>
      )}
      {!factoryOk && caja && !caja.is_deployed && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          Definí <code className="text-xs">NEXT_PUBLIC_FACTORY_ADDRESS</code> para
          deploy on-chain.
        </div>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-2 lg:items-start">
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
          {balanceError && (
            <p className="mt-2 text-xs text-red-600">{balanceError}</p>
          )}
          <p className="mt-2 font-mono text-xs text-slate-500">{addr}</p>
          {caja?.contract_address && (
            <p className="mt-1 font-mono text-xs text-slate-400">
              StrongBox: {formatAddress(caja.contract_address, 6)}
            </p>
          )}
          <div className="mt-6 flex flex-col gap-3">
            {!caja?.is_deployed && caja && (
              <>
                {deployError && (
                  <p className="text-sm text-red-600">{deployError}</p>
                )}
                <VaultSmallGreenButton
                  onClick={() => void handleDeploy()}
                  disabled={
                    !canDeploy || actionBusy || deployTxPending || cajaLoading
                  }
                >
                  {deployTxPending || actionBusy
                    ? "Deploy en curso…"
                    : "Deploy StrongBox on-chain"}
                </VaultSmallGreenButton>
              </>
            )}
            {caja?.is_deployed && (
              <>
                <VaultField label="Monto (BNB)">
                  <VaultInput
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.01"
                  />
                </VaultField>
                {depositError && (
                  <p className="text-sm text-red-600">{depositError}</p>
                )}
                <VaultSmallGreenButton
                  onClick={() => void handleDeposit()}
                  disabled={
                    !canDeposit || actionBusy || depositTxPending || cajaLoading
                  }
                >
                  {depositTxPending || actionBusy
                    ? "Depósito en curso…"
                    : "Deposit"}
                </VaultSmallGreenButton>
                <VaultMintButton type="button" disabled className="opacity-60">
                  Withdraw (próximamente)
                </VaultMintButton>
              </>
            )}
          </div>
        </VaultCard>

        <VaultCard className="space-y-5">
          <VaultField label="Get Heir">
            <VaultInput
              placeholder="Search by name or address…"
              value={getHeirFilter}
              onChange={(e) => setGetHeirFilter(e.target.value)}
            />
          </VaultField>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">
              Configuración
            </p>
            <VaultMintButton
              type="button"
              className="w-full sm:w-auto"
              onClick={() => router.push("/safe/configure")}
            >
              Editar guardianes / herederos
            </VaultMintButton>
          </div>
        </VaultCard>
      </div>

      <VaultCard className="overflow-x-auto p-0">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Address</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {cajaLoading && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-slate-500">
                  Cargando desde Supabase…
                </td>
              </tr>
            )}
            {!cajaLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-slate-500">
                  {caja ? "Sin herederos/guardianes en la fila." : "—"}
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr
                key={row.key}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
              >
                <td className="px-5 py-3.5 font-semibold text-slate-900">
                  {row.name}
                </td>
                <td className="max-w-[200px] truncate px-5 py-3.5 font-mono text-xs text-slate-600">
                  {row.gains}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={
                      row.status === "Active"
                        ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
                        : "rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900"
                    }
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    type="button"
                    className="inline-flex rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#1e4d3a]"
                    aria-label={`Edit ${row.name}`}
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </VaultCard>
    </VaultShell>
  );
}
