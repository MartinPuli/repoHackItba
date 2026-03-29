"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "@/context/DemoMockContext";
import { VaultShell } from "@/components/vault/VaultShell";
import {
  VaultCard,
  VaultField,
  VaultInput,
  VaultPillButton,
  VaultSectionTitle,
} from "@/components/vault/VaultPrimitives";

export default function SafeConfigurationPage() {
  const router = useRouter();
  const { address } = useAccount();

  const [form, setForm] = useState({
    ownerEmail: "owner@demo.com",
    guardian1: { email: "", wallet: "" },
    guardian2: { email: "", wallet: "" },
    heir1: { email: "", wallet: "" },
    heir2: { email: "", wallet: "" },
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updatePerson = (
    key: "guardian1" | "guardian2" | "heir1" | "heir2",
    field: "email" | "wallet",
    val: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: val },
    }));
  };

  async function save() {
    setSaveError(null);
    setSaving(true);
    
    // Simulate biometric check / saving to DB
    setTimeout(() => {
      setSaving(false);
      router.push("/safe/owner");
    }, 1500);
  }

  return (
    <VaultShell title="Safe Configuration">
      <VaultCard>
        <div className="space-y-10">
          <p className="text-sm text-brand font-medium">
            ¡Modo Demo Activo! Puedes rellenar estos campos y avanzar sin verificar huella digital ni conectar wallet reales.
          </p>

          <section className="space-y-4">
            <VaultSectionTitle>Your Details</VaultSectionTitle>
            <VaultField label="Your Email">
              <VaultInput
                type="email"
                placeholder="you@email.com"
                value={form.ownerEmail}
                onChange={(e) => setForm((p) => ({ ...p, ownerEmail: e.target.value }))}
              />
            </VaultField>
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
                      onChange={(e) => updatePerson(key, "email", e.target.value)}
                    />
                  </VaultField>
                  <VaultField label="Guardian Wallet Address">
                    <VaultInput
                      placeholder="0x…"
                      value={form[key].wallet}
                      onChange={(e) => updatePerson(key, "wallet", e.target.value)}
                    />
                  </VaultField>
                </div>
              ))}
            </div>
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
                      onChange={(e) => updatePerson(key, "email", e.target.value)}
                    />
                  </VaultField>
                  <VaultField label="Heir Wallet Address">
                    <VaultInput
                      placeholder="0x…"
                      value={form[key].wallet}
                      onChange={(e) => updatePerson(key, "wallet", e.target.value)}
                    />
                  </VaultField>
                </div>
              ))}
            </div>
          </section>

          <VaultPillButton onClick={save} disabled={saving}>
            {saving ? "Simulando biometría y guardando..." : "Save and Create Safe"}
          </VaultPillButton>
        </div>
      </VaultCard>
    </VaultShell>
  );
}
