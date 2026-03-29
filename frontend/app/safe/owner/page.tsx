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

  const addr = address ? formatAddress(address, 5) : "\u2014";

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
          "0x9cA3C\u2026f21B",
        status: "Active",
      },
      {
        name: "Guardian 2",
        gains:
          form.guardian2.wallet ||
          "0x4e\u20269a02",
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
    <VaultShell title="Your Safe" maxWidth="wide" backHref="/role" step={{ current: 4, total: 4 }}>
      {/* Balance + Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <VaultCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Safe Balance
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-ink sm:text-4xl">
            {formatEth(vaultBalanceEth)}
          </p>
          <p className="mt-1.5 font-mono text-xs text-ink-faint">{addr}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
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

        <VaultCard className="space-y-4">
          <VaultField label="Search participants">
            <VaultInput
              placeholder="Name or address..."
              value={getHeirFilter}
              onChange={(e) => setGetHeirFilter(e.target.value)}
            />
          </VaultField>
          <div>
            <p className="mb-2 text-sm font-medium text-ink-muted">
              Manage Guardians
            </p>
            <VaultMintButton className="w-full sm:w-auto">
              Manage Guardians
            </VaultMintButton>
          </div>
        </VaultCard>
      </div>

      {/* Participants table */}
      <VaultCard className="mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-ink-faint">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Address</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.name}
                className="border-b border-line last:border-0 transition-colors hover:bg-surface-muted/50"
              >
                <td className="px-5 py-3.5 font-medium text-ink">
                  {row.name}
                </td>
                <td className="max-w-[180px] truncate px-5 py-3.5 font-mono text-xs text-ink-muted">
                  {row.gains}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={
                      row.status === "Active"
                        ? "rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-brand"
                        : "rounded-full bg-warning-light px-2.5 py-0.5 text-xs font-semibold text-warning"
                    }
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    type="button"
                    className="inline-flex rounded-lg p-2 text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
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
