"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useAccount } from "wagmi";
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
import { ApiError, postStrongboxSetup } from "@/lib/api/client";

export default function SafeConfigurationPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { session } = useAuth();
  const {
    form,
    setForm,
    updatePerson,
    setVaultSetupComplete,
    setVaultOwnerAddress,
  } = useVaultFlow();

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function save() {
    setSaveError(null);
    if (address) setVaultOwnerAddress(address);
    setVaultSetupComplete(true);

    if (!session?.access_token) {
      router.push("/safe/owner");
      return;
    }

    const guardians = [
      { wallet: form.guardian1.wallet.trim(), email: form.guardian1.email.trim() },
      { wallet: form.guardian2.wallet.trim(), email: form.guardian2.email.trim() },
    ];
    const heirs = [
      { wallet: form.heir1.wallet.trim(), email: form.heir1.email.trim() },
      { wallet: form.heir2.wallet.trim(), email: form.heir2.email.trim() },
    ];

    const missing =
      !form.ownerEmail.trim() ||
      guardians.some((g) => !g.wallet || !g.email) ||
      heirs.some((h) => !h.wallet || !h.email);
    if (missing) {
      setSaveError("Completá email del titular, y wallet + email de cada guardián y heredero.");
      return;
    }

    setSaving(true);
    try {
      await postStrongboxSetup(session.access_token, {
        own_email: form.ownerEmail.trim(),
        guardians,
        recovery_contacts: heirs,
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        // Ya hay caja lógica; seguir al dashboard
      } else {
        setSaveError(e instanceof Error ? e.message : "Error al guardar en el servidor.");
        setSaving(false);
        return;
      }
    } finally {
      setSaving(false);
    }

    router.push("/safe/owner");
  }

  return (
    <VaultShell title="Safe Configuration">
      <VaultCard>
        <div className="space-y-10">
          {!session && (
            <p className="text-sm text-amber-800">
              Para guardar la caja en el backend,{" "}
              <Link href="/login" className="font-semibold underline">
                iniciá sesión con MetaMask
              </Link>
              . Sin sesión solo se actualiza el estado local del demo.
            </p>
          )}
          {saveError && (
            <p className="text-sm text-red-600" role="alert">
              {saveError}
            </p>
          )}

          <section className="space-y-4">
            <VaultSectionTitle>Your Details</VaultSectionTitle>
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

          <section className="space-y-4">
            <VaultSectionTitle>Heirs (×2)</VaultSectionTitle>
            <div className="grid gap-6 md:grid-cols-2">
              {(["heir1", "heir2"] as const).map((key, i) => (
                <div key={key} className="space-y-4 rounded-xl bg-slate-50/80 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Heir {i + 1}
                  </p>
                  <VaultField label="Heir Email">
                    <VaultInput
                      type="email"
                      value={form[key].email}
                      onChange={(e) =>
                        updatePerson(key, "email", e.target.value)
                      }
                    />
                  </VaultField>
                  <VaultField label="Heir Wallet Address">
                    <VaultInput
                      placeholder="0x…"
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

          <section className="space-y-4">
            <VaultSectionTitle>Guardians (×2)</VaultSectionTitle>
            <div className="grid gap-6 md:grid-cols-2">
              {(["guardian1", "guardian2"] as const).map((key, i) => (
                <div key={key} className="space-y-4 rounded-xl bg-slate-50/80 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Guardian {i + 1}
                  </p>
                  <VaultField label="Guardian Email">
                    <VaultInput
                      type="email"
                      value={form[key].email}
                      onChange={(e) =>
                        updatePerson(key, "email", e.target.value)
                      }
                    />
                  </VaultField>
                  <VaultField label="Guardian Wallet Address">
                    <VaultInput
                      placeholder="0x…"
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

          <VaultPillButton onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Save and Create Safe"}
          </VaultPillButton>
        </div>
      </VaultCard>
    </VaultShell>
  );
}
