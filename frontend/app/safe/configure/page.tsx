"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import type { Address } from "viem";
import { getAddress, isAddress } from "viem";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import { useCreateStrongBox, useFactoryConfigured } from "@/hooks/useStrongBoxChain";
import { CONTRACTS, FACTORY_ABI } from "@/lib/contracts/abis";
import { VaultShell } from "@/components/vault/VaultShell";
import {
  VaultCard,
  VaultField,
  VaultInput,
  VaultPillButton,
  VaultSectionTitle,
} from "@/components/vault/VaultPrimitives";
import { useVaultFlow } from "@/context/VaultFlowContext";
import { useAuth } from "@/hooks/useAuth";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { ApiError, postStrongboxSetup } from "@/lib/api/client";
import { User, Shield, Clock } from "lucide-react";

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light">
        <Icon className="h-4 w-4 text-brand" strokeWidth={2} />
      </div>
      <div>
        <VaultSectionTitle>{title}</VaultSectionTitle>
        {subtitle && (
          <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/** Igual al default en DB (1 año). */
const DEFAULT_TIME_LIMIT_SECONDS = BigInt(31_536_000);

export default function SafeConfigurationPage() {
  const router = useRouter();
  const { address, isConnected } = useUnifiedWallet();
  const publicClient = usePublicClient();
  const factoryOk = useFactoryConfigured();
  const { createStrongBox, isPending: deployTxPending } = useCreateStrongBox();
  const { session, loading: authLoading } = useAuth();
  const {
    form,
    setForm,
    updatePerson,
    setVaultSetupComplete,
    setVaultOwnerAddress,
  } = useVaultFlow();

  const {
    loading: webauthnLoading,
    checkStatus,
    register: registerBiometric,
    authenticate,
  } = useWebAuthn(session?.access_token);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !session) {
      router.replace("/connect");
    }
  }, [authLoading, session, router]);

  useEffect(() => {
    if (session?.access_token) void checkStatus();
  }, [session?.access_token, checkStatus]);

  async function save() {
    setSaveError(null);
    if (address) setVaultOwnerAddress(address);
    setVaultSetupComplete(true);

    if (!session?.access_token) {
      router.push("/safe/owner");
      return;
    }

    const guardians = [
      {
        wallet: form.guardian1.wallet.trim(),
        email: form.guardian1.email.trim(),
      },
      {
        wallet: form.guardian2.wallet.trim(),
        email: form.guardian2.email.trim(),
      },
    ];
    const recoverers = [
      { wallet: form.recoverer1.wallet.trim(), email: form.recoverer1.email.trim() },
      { wallet: form.recoverer2.wallet.trim(), email: form.recoverer2.email.trim() },
    ];

    const missing =
      !form.ownerEmail.trim() ||
      guardians.some((g) => !g.wallet || !g.email) ||
      recoverers.some((h) => !h.wallet || !h.email);
    if (missing) {
      setSaveError(
        "Fill in the owner email, and the wallet + email for each guardian and recovery contact."
      );
      return;
    }

    let hasCredential = await checkStatus();
    if (hasCredential === null) {
      setSaveError(
        "Could not verify biometric status. Please try again."
      );
      return;
    }

    const stepUpErr = hasCredential
      ? await authenticate()
      : await registerBiometric();
    if (stepUpErr) {
      setSaveError(stepUpErr);
      return;
    }

    setSaving(true);
    try {
      if (!factoryOk) {
        setSaveError(
          "Configurá NEXT_PUBLIC_FACTORY_ADDRESS en el frontend para el deploy on-chain."
        );
        return;
      }
      if (!address || !isConnected) {
        setSaveError("Conectá tu wallet para crear la Safe on-chain.");
        return;
      }
      if (!publicClient) {
        setSaveError("No hay cliente RPC disponible.");
        return;
      }

      const [g1Raw, g2Raw, h1Raw, h2Raw] = [
        guardians[0]!.wallet,
        guardians[1]!.wallet,
        recoverers[0]!.wallet,
        recoverers[1]!.wallet,
      ];
      if (![g1Raw, g2Raw, h1Raw, h2Raw].every((w) => isAddress(w))) {
        setSaveError(
          "Cada guardian y recovery contact debe tener una wallet EVM válida (0x…)."
        );
        return;
      }
      const guardian1 = getAddress(g1Raw) as Address;
      const guardian2 = getAddress(g2Raw) as Address;
      const heir1 = getAddress(h1Raw) as Address;
      const heir2 = getAddress(h2Raw) as Address;

      const ownerLc = address.toLowerCase();
      if (
        [guardian1, guardian2, heir1, heir2].some(
          (a) => a.toLowerCase() === ownerLc,
        )
      ) {
        setSaveError(
          "No podés usar tu propia wallet conectada como guardian o recovery contact.",
        );
        return;
      }

      const { hash } = await createStrongBox({
        guardian1,
        guardian2,
        heir1,
        heir2,
        timeLimitSeconds: DEFAULT_TIME_LIMIT_SECONDS,
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
        throw new Error("Factory did not return a StrongBox address.");
      }

      const contractAddress = getAddress(deployed as string);

      await postStrongboxSetup(session.access_token, {
        own_email: form.ownerEmail.trim(),
        guardians,
        recovery_contacts: recoverers,
        contract_address: contractAddress,
        deploy_tx_hash: hash,
      });

      router.push("/safe/owner");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        // Ya hay caja lógica; seguir al dashboard
        router.push("/safe/owner");
      } else {
        setSaveError(
          e instanceof Error ? e.message : "Failed to save to server."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <VaultShell title="Safe Configuration">
      <VaultCard>
        <div className="space-y-10">
          {!session && (
            <div className="rounded-xl border border-warning/20 bg-warning-light px-4 py-3 text-sm text-amber-800">
              To save the vault to the backend,{" "}
              <Link href="/connect" className="font-semibold underline">
                connect your wallet
              </Link>
              . Without a session, only the local demo state is updated.
            </div>
          )}
          {saveError && (
            <div
              className="rounded-xl border border-danger/20 bg-danger-light px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {saveError}
            </div>
          )}
          {session && !factoryOk && (
            <div className="rounded-xl border border-warning/20 bg-warning-light px-4 py-3 text-sm text-amber-800">
              Set{" "}
              <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs font-mono">
                NEXT_PUBLIC_FACTORY_ADDRESS
              </code>{" "}
              for on-chain deploy.
            </div>
          )}

          {/* Owner */}
          <section className="space-y-4">
            <SectionHeader icon={User} title="Your Details" />
            <VaultField label="Your Email">
              <VaultInput
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={form.ownerEmail}
                onChange={(e) => setForm({ ownerEmail: e.target.value })}
              />
            </VaultField>
          </section>

          {/* Recoverers */}
          <section className="space-y-4">
            <SectionHeader
              icon={Clock}
              title="Recovery Contacts (x2)"
              subtitle="They can claim funds if you go inactive"
            />
            <div className="grid gap-5 md:grid-cols-2">
              {(["recoverer1", "recoverer2"] as const).map((key, i) => (
                <div
                  key={key}
                  className="space-y-4 rounded-xl border border-line bg-canvas-subtle/60 p-5"
                >
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-faint">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-light text-[10px] font-bold text-brand">
                      {i + 1}
                    </span>
                    Recoverer {i + 1}
                  </p>
                  <VaultField label="Email">
                    <VaultInput
                      type="email"
                      placeholder="recoverer@email.com"
                      value={form[key].email}
                      onChange={(e) =>
                        updatePerson(key, "email", e.target.value)
                      }
                    />
                  </VaultField>
                  <VaultField label="Wallet Address">
                    <VaultInput
                      placeholder="0x..."
                      value={form[key].wallet}
                      onChange={(e) =>
                        updatePerson(key, "wallet", e.target.value)
                      }
                    />
                  </VaultField>
                </div>
              ))}
            </div>
          </section>

          {/* Guardians */}
          <section className="space-y-4">
            <SectionHeader
              icon={Shield}
              title="Guardians (x2)"
              subtitle="They must approve your withdrawals"
            />
            <div className="grid gap-5 md:grid-cols-2">
              {(["guardian1", "guardian2"] as const).map((key, i) => (
                <div
                  key={key}
                  className="space-y-4 rounded-xl border border-line bg-canvas-subtle/60 p-5"
                >
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-faint">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-light text-[10px] font-bold text-brand">
                      {i + 1}
                    </span>
                    Guardian {i + 1}
                  </p>
                  <VaultField label="Email">
                    <VaultInput
                      type="email"
                      placeholder="guardian@email.com"
                      value={form[key].email}
                      onChange={(e) =>
                        updatePerson(key, "email", e.target.value)
                      }
                    />
                  </VaultField>
                  <VaultField label="Wallet Address">
                    <VaultInput
                      placeholder="0x..."
                      value={form[key].wallet}
                      onChange={(e) =>
                        updatePerson(key, "wallet", e.target.value)
                      }
                    />
                  </VaultField>
                </div>
              ))}
            </div>
          </section>

          <VaultPillButton
            onClick={save}
            disabled={saving || webauthnLoading || deployTxPending}
          >
            {webauthnLoading
              ? "Verifying identity…"
              : deployTxPending
                ? "Deploying on-chain…"
                : saving
                  ? "Saving…"
                  : "Save and Create Safe"}
          </VaultPillButton>
        </div>
      </VaultCard>
    </VaultShell>
  );
}
