import type { LiquidProfile } from "../types";
import { fetchRemoteProfile } from "../api/profileService";
import { FluxDispatcher } from "@webpack/common";

const cache = new Map<string, LiquidProfile | null>();
const inflight = new Map<string, Promise<LiquidProfile | null>>();
const TTL = 1000 * 60 * 5;
const fetchedAt = new Map<string, number>();

export function getCachedProfile(userId: string): LiquidProfile | null | undefined {
  return cache.get(userId);
}

export function setCachedProfile(userId: string, profile: LiquidProfile | null) {
  cache.set(userId, profile);
  fetchedAt.set(userId, Date.now());
}

export async function fetchProfile(userId: string, force = false): Promise<LiquidProfile | null> {
  const now = Date.now();
  const last = fetchedAt.get(userId) ?? 0;
  if (!force && now - last < TTL && cache.has(userId)) {
    return cache.get(userId) ?? null;
  }
  if (inflight.has(userId)) return inflight.get(userId)!;

  const p = fetchRemoteProfile(userId).then((prof) => {
    inflight.delete(userId);
    setCachedProfile(userId, prof);
    try {
      const hasCustomData = prof && (
        (Array.isArray(prof.badges) && prof.badges.length > 0) ||
        prof.customUsername ||
        prof.registrationDate ||
        (Array.isArray(prof.connections) && prof.connections.length > 0) ||
        (typeof prof.nitroMonths === "number" && prof.nitroMonths > 0) ||
        !!prof.nitroSinceDate
      );
      if (hasCustomData) {
        FluxDispatcher.dispatch({ type: "USER_PROFILE_UPDATE", userId });

        const userUpdate: any = { id: userId };
        if (prof?.customUsername) {
          userUpdate.username = prof.customUsername;
        }
        if (prof?.nitroMonths != null && prof.nitroMonths > 0) {
          const since = new Date();
          since.setMonth(since.getMonth() - prof.nitroMonths);
          userUpdate.premium_since = since.toISOString();
          userUpdate.premium_type = 2;
          userUpdate.premiumState = {
            premium_source: 1,
            premium_subscription_type: 4,
          };
        }
        FluxDispatcher.dispatch({ type: "USER_UPDATE", user: userUpdate });
      }
    } catch {}
    return prof;
  }).catch(() => {
    inflight.delete(userId);
    return null;
  });
  inflight.set(userId, p);
  return p;
}

export function startCache() {}
export function stopCache() {
  cache.clear();
  inflight.clear();
  fetchedAt.clear();
}

export function invalidateUser(userId: string) {
  cache.delete(userId);
  fetchedAt.delete(userId);
}
