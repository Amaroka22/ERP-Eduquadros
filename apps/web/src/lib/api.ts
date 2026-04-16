const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1").replace(/\/$/, "");

const TOKEN_KEY = "erp_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  }).finally(() => clearTimeout(timeout));

  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const body = await res.json();
      msg = body.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
  usuario: { id: string; nome: string; email: string; perfil: string };
}

export async function apiLogin(email: string, senha: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });
}

export async function apiMe(): Promise<LoginResponse["usuario"]> {
  return request<LoginResponse["usuario"]>("/auth/me");
}

// ── Sync ──────────────────────────────────────────────────────────────────────

export async function apiSyncLoad(): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>("/sync");
}

export async function apiSyncSave(dados: Record<string, unknown>): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>("/sync", {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}
