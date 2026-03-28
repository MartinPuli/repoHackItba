"use client";

import { useRouter } from "next/navigation";
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

export default function SafeConfigurationPage() {
  const router = useRouter();
  const { address } = useAccount();
  const {
    form,
    setForm,
    updatePerson,
    setVaultSetupComplete,
    setVaultOwnerAddress,
  } = useVaultFlow();

  function save() {
    if (address) setVaultOwnerAddress(address);
    setVaultSetupComplete(true);
    router.push("/safe/owner");
  }

  return (
    <VaultShell title="Safe Configuration">
      <VaultCard>
        <div className="space-y-10">
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

          <VaultPillButton onClick={save}>Save and Create Safe</VaultPillButton>
        </div>
      </VaultCard>
    </VaultShell>
  );
}
