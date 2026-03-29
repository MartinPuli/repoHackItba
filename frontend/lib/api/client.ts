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
        : `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, parsed);
  }
  return parsed as T;
}

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

export type StrongboxSetupPayload = {
  own_email: string;
  guardians: { wallet: string; email: string }[];
  recovery_contacts: { wallet: string; email: string }[];
};

export function postStrongboxSetup(
  accessToken: string,
  body: StrongboxSetupPayload,
) {
  return apiFetch<{ ok: true }>("/api/strongbox/setup", {
    method: "POST",
    accessToken,
    body,
  });
}

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
