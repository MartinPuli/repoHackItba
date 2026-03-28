"use client";

import { useEffect } from "react";
import { useConnect, useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { VaultShell } from "@/components/vault/VaultShell";
import { VaultCard, VaultPillButton, VaultMascot } from "@/components/vault/VaultPrimitives";

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();

  useEffect(() => {
    if (isConnected) router.replace("/role");
  }, [isConnected, router]);

  const metaMask = connectors.find(
    (c) =>
      c.id === "io.metamask" ||
      c.name.toLowerCase().includes("metamask")
  );

  return (
    <VaultShell title="Connect Wallet">
      <div className="flex flex-col items-stretch gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        <div className="min-w-0 flex-1">
          <p className="mb-8 text-[15px] leading-relaxed text-slate-600">
            Choose your wallet to connect and interact with the digital safe
            platform.
          </p>
          <VaultCard className="mx-auto max-w-md lg:mx-0">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-2xl bg-white shadow-inner ring-1 ring-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                  alt="MetaMask"
                  className="h-20 w-20"
                  width={80}
                  height={80}
                />
              </div>
              <VaultPillButton
                disabled={!metaMask || isPending}
                onClick={() => metaMask && connect({ connector: metaMask })}
              >
                {isPending ? "Connecting..." : "Connect MetaMask"}
              </VaultPillButton>
              {error ? (
                <p className="mt-3 text-xs text-red-600">{error.message}</p>
              ) : null}
              {!metaMask && !isPending ? (
                <p className="mt-3 text-xs text-slate-500">
                  MetaMask not detected. Install the extension or use Connect
                  Wallet in the header.
                </p>
              ) : null}
            </div>
            <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400">
              By connecting you agree to the terms of this demo (BSC Testnet).
            </p>
          </VaultCard>
        </div>
        <div className="flex justify-center lg:justify-end lg:pt-4">
          <VaultMascot variant="point" />
        </div>
      </div>
    </VaultShell>
  );
}
