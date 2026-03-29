"use client";

import { useState, useCallback } from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { apiFetch } from "@/lib/api/client";

interface WebAuthnState {
  isRegistered: boolean | null;
  loading: boolean;
  error: string | null;
}

export function useWebAuthn(accessToken: string | null | undefined) {
  const [state, setState] = useState<WebAuthnState>({
    isRegistered: null,
    loading: false,
    error: null,
  });

  const checkStatus = useCallback(async (): Promise<boolean | null> => {
    if (!accessToken) return null;
    try {
      const { registered } = await apiFetch<{ registered: boolean }>(
        "/api/webauthn/status",
        { accessToken },
      );
      setState((s) => ({ ...s, isRegistered: registered }));
      return registered;
    } catch {
      return null;
    }
  }, [accessToken]);

  /** `null` = success; string = error message (avoids reading stale state in caller). */
  const register = useCallback(async (): Promise<string | null> => {
    if (!accessToken) {
      const msg = "No active session";
      setState((s) => ({ ...s, error: msg }));
      return msg;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const options = await apiFetch<any>("/api/webauthn/register/options", {
        accessToken,
      });

      const attestation = await startRegistration({ optionsJSON: options });

      await apiFetch("/api/webauthn/register/verify", {
        method: "POST",
        accessToken,
        body: attestation,
      });

      setState({ isRegistered: true, loading: false, error: null });
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Biometric registration failed";
      setState((s) => ({ ...s, loading: false, error: msg }));
      return msg;
    }
  }, [accessToken]);

  /** `null` = success; string = error message. */
  const authenticate = useCallback(async (): Promise<string | null> => {
    if (!accessToken) {
      const msg = "No active session";
      setState((s) => ({ ...s, error: msg }));
      return msg;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const options = await apiFetch<any>("/api/webauthn/authenticate/options", {
        accessToken,
      });

      const assertion = await startAuthentication({ optionsJSON: options });

      await apiFetch("/api/webauthn/authenticate/verify", {
        method: "POST",
        accessToken,
        body: assertion,
      });

      setState((s) => ({ ...s, loading: false, error: null }));
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Biometric verification failed";
      setState((s) => ({ ...s, loading: false, error: msg }));
      return msg;
    }
  }, [accessToken]);

  return {
    ...state,
    checkStatus,
    register,
    authenticate,
  };
}
