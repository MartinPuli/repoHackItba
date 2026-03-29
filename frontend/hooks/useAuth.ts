"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

const SIGN_MESSAGE = "Sign in to Vaultix — HackITBA 2026";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Legacy: password from signature (non-deterministic, kept for migration) */
async function passwordFromSignature(signature: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(signature),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Derive a deterministic password from the wallet address.
 * ECDSA signatures are non-deterministic (same message can produce different
 * signatures), so we use the address itself + a fixed salt as the password.
 * The signature is only used to PROVE ownership of the wallet.
 */
async function passwordFromAddress(address: string): Promise<string> {
  const input = `vaultix-hackitba-2026:${address.toLowerCase()}`;
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface AuthState {
  session: Session | null;
  userId: string | null;
  loading: boolean;
  hasStrongbox: boolean | null;
  isGuardian: boolean | null;
  isRecoverer: boolean | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    userId: null,
    loading: true,
    hasStrongbox: null,
    isGuardian: null,
    isRecoverer: null,
  });

  const supabase = getSupabaseBrowser();

  useEffect(() => {
    if (!supabase) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((s) => ({
        ...s,
        session,
        userId: session?.user?.id ?? null,
        loading: false,
      }));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({
        ...s,
        session,
        userId: session?.user?.id ?? null,
      }));
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = useCallback(
    async (
      address: string,
      signMessageAsync: (args: { message: string }) => Promise<string>,
    ) => {
      if (!supabase) throw new Error("Supabase not configured");

      // 1) Ask user to sign message to prove wallet ownership
      const signature = await signMessageAsync({ message: SIGN_MESSAGE });

      // 2) Derive deterministic credentials from the address (not the signature)
      const password = await passwordFromAddress(address);
      const email = `${address.toLowerCase()}@wallet.local`;

      // 3) Try login with address-based password (new flow)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.session) {
        await syncMe(data.session.access_token);
        return data.session;
      }

      // 4) Try signup (new user)
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { ethereum_address: address.toLowerCase() },
          },
        });

      if (!signUpError && signUpData.session) {
        await syncMe(signUpData.session.access_token);
        return signUpData.session;
      }

      // 5) User exists but with old signature-based password.
      //    Try login with the old method (SHA-256 of signature) as fallback.
      const oldPassword = await passwordFromSignature(signature);
      const { data: fallback, error: fallbackErr } =
        await supabase.auth.signInWithPassword({
          email,
          password: oldPassword,
        });

      if (!fallbackErr && fallback.session) {
        // Logged in with old password — update to new deterministic one
        await supabase.auth.updateUser({ password });
        await syncMe(fallback.session.access_token);
        return fallback.session;
      }

      throw new Error(
        "Could not sign in. Try disconnecting your wallet and reconnecting.",
      );
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setState({
      session: null,
      userId: null,
      loading: false,
      hasStrongbox: null,
      isGuardian: null,
      isRecoverer: null,
    });
  }, [supabase]);

  async function syncMe(accessToken: string) {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const body = await res.json();
        setState((s) => ({
          ...s,
          hasStrongbox: body.has_strongbox ?? null,
          isGuardian: body.is_guardian ?? null,
          isRecoverer: body.is_heir ?? null,
        }));
      }
    } catch {
      // API down; don't block login
    }
  }

  return { ...state, signIn, signOut };
}
