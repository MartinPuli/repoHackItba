"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { VaultShell } from "@/components/vault/VaultShell";
import {
  VaultCard,
  VaultField,
  VaultInput,
  VaultSmallGreenButton,
  VaultMintButton,
} from "@/components/vault/VaultPrimitives";
import { useVaultFlow } from "@/context/VaultFlowContext";
import { formatAddress, formatEth } from "@/lib/utils";
import { Pencil } from "lucide-react";

export default function SafeOwnerDashboardPage() {
  const { address } = useAccount();
  const {
    form,
    vaultBalanceEth,
    setVaultBalanceEth,
    getHeirFilter,
    setGetHeirFilter,
  } = useVaultFlow();

  const addr = address ? formatAddress(address, 5) : "—";

  const rows = useMemo(
    () => [
      {
        name: "Heir 1",
        gains:
          form.heir1.wallet ||
          "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        status: "Active",
      },
      {
        name: "Heir 2",
        gains:
          form.heir2.wallet ||
          "0x8ba1f109551bD432803012645Hac136c",
        status: "Active",
      },
      {
        name: "Guardian 1",
        gains:
          form.guardian1.wallet ||
          "0x9cA3C…f21B",
        status: "Active",
      },
      {
        name: "Guardian 2",
        gains:
          form.guardian2.wallet ||
          "0x4e…9a02",
        status: "Pending",
      },
    ],
    [form]
  );

  const filtered = rows.filter(
    (r) =>
      !getHeirFilter.trim() ||
      r.name.toLowerCase().includes(getHeirFilter.toLowerCase()) ||
      r.gains.toLowerCase().includes(getHeirFilter.toLowerCase())
  );

  return (
    <VaultShell title="Safe Owner Dashboard" maxWidth="wide">
      <div className="mb-8 grid gap-6 lg:grid-cols-2 lg:items-start">
        <VaultCard>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Safe Balance
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums text-slate-900 md:text-5xl">
            {formatEth(vaultBalanceEth)}
          </p>
          <p className="mt-2 font-mono text-xs text-slate-500">{addr}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <VaultSmallGreenButton
              onClick={() => setVaultBalanceEth(vaultBalanceEth + 0.25)}
            >
              Deposit
            </VaultSmallGreenButton>
            <VaultMintButton
              onClick={() =>
                setVaultBalanceEth(Math.max(0, vaultBalanceEth - 0.25))
              }
            >
              Withdraw
            </VaultMintButton>
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
              Set Guardians
            </p>
            <VaultMintButton className="w-full sm:w-auto">
              Manage Guardians
            </VaultMintButton>
          </div>
        </VaultCard>
      </div>

      <VaultCard className="overflow-x-auto p-0">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Gains</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.name}
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
