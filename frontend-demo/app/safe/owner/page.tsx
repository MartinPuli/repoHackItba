"use client";

import { useState } from "react";
import { useAccount } from "@/context/DemoMockContext";
import { VaultShell } from "@/components/vault/VaultShell";
import {
  VaultCard,
  VaultField,
  VaultInput,
  VaultSmallGreenButton,
  VaultMintButton,
} from "@/components/vault/VaultPrimitives";
import { formatAddress } from "@/lib/utils";
import { Clock, Coins } from "lucide-react";

const MOCK_TOKENS = [
  { symbol: "BNB", name: "BNB", balance: "2.50" },
  { symbol: "USDT", name: "Tether USD", balance: "1,450.00" },
  { symbol: "USDC", name: "USD Coin", balance: "800.00" },
  { symbol: "BTCB", name: "Bitcoin BEP2", balance: "0.15" },
  { symbol: "ETH", name: "Ethereum", balance: "3.20" },
  { symbol: "VLTX", name: "Vaultix Token", balance: "10,000" },
  { symbol: "PEPE", name: "Pepe", balance: "1,500,000" },
  { symbol: "LINK", name: "Chainlink", balance: "145.20" },
  { symbol: "UNI", name: "Uniswap", balance: "41.50" },
  { symbol: "AAVE", name: "Aave", balance: "12.00" },
  { symbol: "DAI", name: "Dai Stablecoin", balance: "200.00" },
];

export default function SafeOwnerDashboardPage() {
  const { address } = useAccount();

  const [selectedToken, setSelectedToken] = useState(MOCK_TOKENS[0]);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawTo, setWithdrawTo] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const strongBoxAddr = "0xDemoStrongBoxA1b2C3d4E5f6G7h8I9j0";

  // Simulate timeout action
  async function fakeAction(callback: () => void) {
    setActionBusy(true);
    setTimeout(() => {
      setActionBusy(false);
      callback();
    }, 1500);
  }

  function handleDeposit() {
    fakeAction(() => {
      setDepositAmount("");
      alert(`Demo Mode: Successfully deposited ${selectedToken.symbol}!`);
    });
  }

  function handleWithdraw() {
    fakeAction(() => {
      setShowWithdraw(false);
      setWithdrawAmount("");
      setWithdrawTo("");
      alert(`Demo Mode: Withdrawal request of ${selectedToken.symbol} created. Guardians must approve.`);
    });
  }

  return (
    <VaultShell title="Safe Owner Dashboard" maxWidth="wide">
      <div className="mb-8 grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Balance + Actions */}
        <VaultCard>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Safe Balance
            </p>
            <div className="relative">
              <select
                className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-xs font-bold text-slate-700 outline-none transition-colors hover:border-brand/40 focus:border-brand focus:ring-2 focus:ring-brand/20 cursor-pointer"
                value={selectedToken.symbol}
                onChange={(e) => {
                  const t = MOCK_TOKENS.find(x => x.symbol === e.target.value);
                  if (t) setSelectedToken(t);
                }}
              >
                {MOCK_TOKENS.map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <Coins className="h-4 w-4" />
              </div>
            </div>
          </div>
          
          <p className="mt-3 text-4xl font-bold tabular-nums text-slate-900 md:text-5xl transition-all">
            {selectedToken.balance} <span className="text-lg font-bold text-slate-500">{selectedToken.symbol}</span>
          </p>
          <p className="mt-2 font-mono text-xs text-slate-500">{address ? formatAddress(address, 5) : "—"}</p>
          <p className="mt-1 font-mono text-xs text-slate-400">
            StrongBox: {formatAddress(strongBoxAddr, 6)}
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-600">
              Recovery countdown: <strong>25d 10h 3m</strong>
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <VaultField label={`Deposit Amount (${selectedToken.symbol})`}>
              <VaultInput
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="1.00"
              />
            </VaultField>
            
            <VaultSmallGreenButton
              onClick={handleDeposit}
              disabled={actionBusy}
            >
              {actionBusy ? "Depósito en curso…" : `Deposit ${selectedToken.symbol}`}
            </VaultSmallGreenButton>

            {!showWithdraw ? (
              <VaultMintButton type="button" onClick={() => setShowWithdraw(true)}>
                Request Withdrawal
              </VaultMintButton>
            ) : (
              <div className="space-y-3 rounded-xl border border-line bg-slate-50 p-4">
                <VaultField label={`Amount (${selectedToken.symbol})`}>
                  <VaultInput
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.5"
                  />
                </VaultField>
                <VaultField label="To Address">
                  <VaultInput
                    value={withdrawTo}
                    onChange={(e) => setWithdrawTo(e.target.value)}
                    placeholder="0x..."
                  />
                </VaultField>
                
                <div className="flex gap-2">
                  <VaultSmallGreenButton onClick={handleWithdraw} disabled={actionBusy}>
                    {actionBusy ? "Enviando…" : "Send Request"}
                  </VaultSmallGreenButton>
                  <button
                    type="button"
                    onClick={() => setShowWithdraw(false)}
                    className="rounded-xl px-4 py-2 text-sm text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </VaultCard>

        {/* Pending withdrawals */}
        <VaultCard className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Pending Withdrawals
          </p>
          
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Amount:</span>
              <span className="font-mono font-semibold">500.0 USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">To:</span>
              <span className="font-mono text-xs">{formatAddress("0xDem0UserReceive...123", 6)}</span>
            </div>
            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-emerald-600">G1: ✓</span>
              <span className="text-slate-400">G2: ⏳</span>
            </div>
          </div>
        </VaultCard>
      </div>

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
            <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
              <td className="px-5 py-3.5 font-semibold text-slate-900">Guardian 1</td>
              <td className="max-w-[200px] truncate px-5 py-3.5 font-mono text-xs text-slate-600">0xDemoGuardian1...9A</td>
              <td className="px-5 py-3.5 text-xs text-slate-500">alice@demo.com</td>
              <td className="px-5 py-3.5">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Active</span>
              </td>
            </tr>
            <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
              <td className="px-5 py-3.5 font-semibold text-slate-900">Guardian 2</td>
              <td className="max-w-[200px] truncate px-5 py-3.5 font-mono text-xs text-slate-600">0xDemoGuardian2...4B</td>
              <td className="px-5 py-3.5 text-xs text-slate-500">bob@demo.com</td>
              <td className="px-5 py-3.5">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Active</span>
              </td>
            </tr>
          </tbody>
        </table>
      </VaultCard>
    </VaultShell>
  );
}
