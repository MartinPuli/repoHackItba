"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { session, loading: authLoading, signIn } = useAuth();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && session) {
      router.replace("/");
    }
  }, [authLoading, session, router]);

  async function handleSignIn() {
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(address, signMessageAsync);
      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) return <p style={{ padding: 32 }}>Cargando...</p>;
  if (session) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        fontFamily: "system-ui, sans-serif",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Vaultix</h1>
      <p style={{ fontSize: 14, color: "#555" }}>
        Conectá tu wallet y firmá para iniciar sesión
      </p>

      <ConnectButton />

      {isConnected && (
        <button
          onClick={handleSignIn}
          disabled={busy}
          style={{
            marginTop: 8,
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 600,
            cursor: busy ? "wait" : "pointer",
            border: "1px solid #ccc",
            borderRadius: 8,
            background: busy ? "#eee" : "#fff",
          }}
        >
          {busy ? "Firmando..." : "Iniciar sesión"}
        </button>
      )}

      {error && (
        <p style={{ color: "red", fontSize: 13, maxWidth: 400 }}>{error}</p>
      )}
    </div>
  );
}
