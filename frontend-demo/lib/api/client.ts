const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function jsonOrText(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: {
    method?: string;
    accessToken?: string | null;
    body?: unknown;
  } = {},
): Promise<T> {
  const { method = "GET", accessToken, body } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const parsed = await jsonOrText(res);
  if (!res.ok) {
    const msg =
      typeof parsed === "object" &&
      parsed !== null &&
      "message" in parsed &&
      typeof (parsed as { message: unknown }).message === "string"
        ? (parsed as { message: string }).message
        : typeof parsed === "object" &&
            parsed !== null &&
            "error" in parsed &&
            typeof (parsed as { error: unknown }).error === "string"
          ? (parsed as { error: string }).error
          : `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, parsed);
  }
  return parsed as T;
}

// ── Balance ──

export type StrongboxBalanceResponse = {
  balances: {
    chainId: number;
    contractAddress: string;
    native: { symbol: string; wei: string; formatted: string };
    source: "mock" | "rpc";
  };
  dbSnapshot: {
    balance_native: string | null;
    is_deployed: boolean;
    recovery_state: string;
    time_limit_seconds: number;
    last_activity_at: string;
  };
};

export function getCajaFuerteBalance(accessToken: string) {
  return apiFetch<StrongboxBalanceResponse>("/api/strongbox/balance", {
    accessToken,
  });
}

// ── Setup ──

export type SetupBody = {
  own_email: string;
  guardians: { wallet: string; email: string }[];
  recovery_contacts: { wallet: string; email: string }[];
  contract_address: string;
  deploy_tx_hash: string;
};

export function postStrongboxSetup(accessToken: string, body: SetupBody) {
  return apiFetch<{ ok: true }>("/api/strongbox/setup", {
    method: "POST",
    accessToken,
    body,
  });
}

// ── Deploy confirm ──

export function postConfirmDeploy(
  accessToken: string,
  body: { contract_address: string; deploy_tx_hash: string },
) {
  return apiFetch<{ ok: true; contract_address: string }>(
    "/api/strongbox/confirm-deploy",
    {
      method: "POST",
      accessToken,
      body,
    },
  );
}

// ── Deposit confirm ──

export function postConfirmDeposit(
  accessToken: string,
  body: { tx_hash: string; amount_bnb: string },
) {
  return apiFetch<{ ok: true }>("/api/strongbox/confirm-deposit", {
    method: "POST",
    accessToken,
    body,
  });
}

// ── Withdrawal flow ──

export function postWithdrawRequest(
  accessToken: string,
  body: { amount: string; to_address: string; on_chain_request_id?: number },
) {
  return apiFetch<{ id: string; on_chain_request_id: number | null }>(
    "/api/strongbox/withdraw/request",
    { method: "POST", accessToken, body },
  );
}

export function getWithdrawPending(accessToken: string) {
  return apiFetch<{
    requests: Array<{
      id: string;
      strongbox_id: string;
      on_chain_request_id: number | null;
      amount: string;
      to_address: string;
      status: string;
      guardian1_approved: boolean;
      guardian2_approved: boolean;
      created_at: string;
    }>;
  }>("/api/strongbox/withdraw/pending", { accessToken });
}

export function postWithdrawApprove(accessToken: string, withdrawalId: string) {
  return apiFetch<{ approved: true; both_approved: boolean }>(
    `/api/strongbox/withdraw/${withdrawalId}/approve`,
    { method: "POST", accessToken },
  );
}

export function postWithdrawReject(accessToken: string, withdrawalId: string) {
  return apiFetch<{ rejected: true }>(
    `/api/strongbox/withdraw/${withdrawalId}/reject`,
    { method: "POST", accessToken },
  );
}

export function postWithdrawExecuted(
  accessToken: string,
  withdrawalId: string,
  txHash: string,
) {
  return apiFetch<{ ok: true }>(
    `/api/strongbox/withdraw/${withdrawalId}/executed`,
    { method: "POST", accessToken, body: { tx_hash: txHash } },
  );
}

// ── Guardian endpoints ──

export function getGuardianPending(accessToken: string) {
  return apiFetch<{
    requests: Array<{
      id: string;
      strongbox_id: string;
      on_chain_request_id: number | null;
      contract_address: string | null;
      amount: string;
      to_address: string;
      status: string;
      guardian1_approved: boolean;
      guardian2_approved: boolean;
      guardian_slot: number | null;
      created_at: string;
    }>;
  }>("/api/guardian/pending", { accessToken });
}

export function getGuardianVaults(accessToken: string) {
  return apiFetch<{ vaults: unknown[] }>("/api/guardian/vaults", { accessToken });
}

// ── Heir / Recovery endpoints ──

export function getHeirVaults(accessToken: string) {
  return apiFetch<{ vaults: unknown[] }>("/api/heir/vaults", { accessToken });
}
