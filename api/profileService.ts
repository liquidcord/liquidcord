import { getProfile, updateMyProfile } from "./client";
import type { LiquidProfile } from "../types";
import { getCachedProfile, setCachedProfile } from "../cache/profileCache";

export async function fetchRemoteProfile(userId: string): Promise<LiquidProfile | null> {
  try {
    let p = await getProfile(userId);
    if (p && typeof p.badges === "string") {
      try { p = { ...p, badges: JSON.parse(p.badges) }; } catch { p = { ...p, badges: [] }; }
    }
    if (p && !Array.isArray(p.badges)) p = { ...p, badges: [] };
    if (p && typeof p.connections === "string") {
      try { p = { ...p, connections: JSON.parse(p.connections) }; } catch { p = { ...p, connections: [] }; }
    }
    setCachedProfile(userId, p);
    return p;
  } catch {
    return null;
  }
}

export async function saveMyProfileData(data: any, selfId?: string | null): Promise<boolean> {
  try {
    await updateMyProfile(data);
    if (selfId) {
      const existing = getCachedProfile(selfId) || { userId: selfId, badges: [] };
      setCachedProfile(selfId, { ...existing, ...data });
    }
    return true;
  } catch {
    return false;
  }
}

export function getMyCachedProfileSync(userId: string | null): LiquidProfile | null {
  if (!userId) return null;
  return getCachedProfile(userId);
}
