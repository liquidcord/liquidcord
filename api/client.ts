import { get } from "@api/DataStore";
import { settings } from "../settings";
import { DATASTORE_TOKEN_KEY } from "../constants";
import type { LiquidProfile } from "../types";

async function getToken(): Promise<string | null> {
  return (await get(DATASTORE_TOKEN_KEY)) ?? null;
}

async function request<T>(path: string, init?: RequestInit & { auth?: boolean }): Promise<T> {
  const base = settings.store.apiBaseUrl.replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers: Record<string, string> = { ...(init?.headers as any), Accept: "application/json" };
  if (init?.auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (init?.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      mode: "cors",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-cache",
    });
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.toLowerCase().includes("cors") || msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("network")) {
      throw new Error(`Failed to reach backend at ${base}. Ensure the Liquidcord backend is running.`);
    }
    throw new Error(`Network error to ${base}: ${msg}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`api ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function getProfile(userId: string): Promise<LiquidProfile> {
  return request<LiquidProfile>(`/profiles/${userId}`);
}

export async function updateMyProfile(data: any): Promise<void> {
  await request("/profiles/me", { method: "PUT", body: JSON.stringify(data), auth: true });
}

export async function exchangePairingCode(code: string): Promise<{ token: string; userId: string }> {
  return request("/auth/exchange", { method: "POST", body: JSON.stringify({ code }) });
}

export async function fetchMe(): Promise<{ userId: string } | null> {
  try {
    return await request("/auth/me", { auth: true });
  } catch {
    return null;
  }
}
