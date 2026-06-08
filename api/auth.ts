import { get, set, del } from "@api/DataStore";
import { settings } from "../settings";
import { DATASTORE_TOKEN_KEY, DATASTORE_USERID_KEY } from "../constants";
import { exchangePairingCode, fetchMe } from "./client";

let currentUserId: string | null = null;

export async function getStoredToken(): Promise<string | null> {
  return (await get(DATASTORE_TOKEN_KEY)) ?? null;
}

export async function getStoredUserId(): Promise<string | null> {
  if (currentUserId) return currentUserId;
  const fromStore = (await get(DATASTORE_USERID_KEY)) as string | null;
  currentUserId = fromStore;
  return fromStore;
}

export async function storeAuth(token: string, userId: string) {
  await set(DATASTORE_TOKEN_KEY, token);
  await set(DATASTORE_USERID_KEY, userId);
  currentUserId = userId;
}

export async function clearAuth() {
  await del(DATASTORE_TOKEN_KEY);
  await del(DATASTORE_USERID_KEY);
  currentUserId = null;
}

export function getApiBase(): string {
  return settings.store.apiBaseUrl.replace(/\/$/, "");
}

export function beginDiscordLogin() {
  const pendingId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const url = `${getApiBase()}/auth/discord?pending=${encodeURIComponent(pendingId)}`;

  try {
    const VN = (typeof (globalThis as any).VencordNative !== "undefined" && (globalThis as any).VencordNative) ||
               (typeof (window as any).VencordNative !== "undefined" && (window as any).VencordNative);
    if (VN && VN.native && typeof VN.native.openExternal === "function") {
      VN.native.openExternal(url);
    } else {
      window.open(url, "_blank");
    }
  } catch (e) {
    console.error("[Liquidcord] openExternal failed, falling back to window.open", e);
    try { window.open(url, "_blank"); } catch {}
  }

  return pendingId;
}

export async function pollAuth(pendingId: string): Promise<{ token: string; userId: string } | null> {
  try {
    const res = await fetch(`${getApiBase()}/auth/poll?pending=${encodeURIComponent(pendingId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.ready && data.token && data.userId) {
      await storeAuth(data.token, data.userId);
      return { token: data.token, userId: data.userId };
    }
    return null;
  } catch {
    return null;
  }
}

export async function submitPairingCode(code: string): Promise<boolean> {
  const res = await exchangePairingCode(code);
  if (res?.token && res?.userId) {
    await storeAuth(res.token, res.userId);
    return true;
  }
  return false;
}

export async function getCurrentAuthedUserId(): Promise<string | null> {
  const stored = await getStoredUserId();
  if (stored) return stored;
  const me = await fetchMe();
  if (me?.userId) {
    currentUserId = me.userId;
    await set(DATASTORE_USERID_KEY, me.userId);
    return me.userId;
  }
  return null;
}

export function startAuth() {}
export function stopAuth() {}
