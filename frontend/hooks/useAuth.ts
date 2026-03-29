"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

const SIGN_MESSAGE = "Sign in to StrongBox — HackITBA 2026";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Supabase limita password a 72 bytes (bcrypt). La firma hex es ~132 chars → hash fijo 64 hex. */
async function passwordFromSignature(signature: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(signature),
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
  isHeir: boolean | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    userId: null,
    loading: true,
    hasStrongbox: null,
    isGuardian: null,
    isHeir: null,
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
      if (!supabase) throw new Error("Supabase no configurado");

      const signature = await signMessageAsync({ message: SIGN_MESSAGE });
      const password = await passwordFromSignature(signature);
      const email = `${address.toLowerCase()}@wallet.local`;

      // Intentar login primero (usuario existente)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.session) {
        await syncMe(data.session.access_token);
        return data.session;
      }

      // Si no existe, registrar
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { ethereum_address: address.toLowerCase() },
          },
        });

      if (signUpError) throw signUpError;
      if (!signUpData.session) {
        throw new Error(
          "No se obtuvo sesión. Desactivá 'Confirm email' en Supabase Auth.",
        );
      }

      await syncMe(signUpData.session.access_token);
      return signUpData.session;
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
      isHeir: null,
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
          isHeir: body.is_heir ?? null,
        }));
      }
    } catch {
      // API caída; no bloquear el login
    }
  }

  return { ...state, signIn, signOut };
}
