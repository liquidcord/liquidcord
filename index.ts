import definePlugin from "@utils/types";
import { removeFromArray } from "@utils/misc";
import SettingsPlugin from "@plugins/_core/settings";
import { settings } from "./settings";
import { startAuth, stopAuth } from "./api/auth";
import { startCache, stopCache } from "./cache/profileCache";
import { startProfileSync, stopProfileSync } from "./patches/profiles";
import { LiquidcordTab } from "./components/settings/LiquidcordTab";
import { LiquidIcon } from "./components/LiquidIcon";
import { getCachedProfile, fetchProfile } from "./cache/profileCache";
import { waitFor } from "@webpack";
import virtualMerge from "virtual-merge";

const TENURE_MILESTONES = [
  { min: 1, id: "premium_tenure_1_month_v2", icon: "4f33c4a9c64ce221936bd256c356f91f" },
  { min: 3, id: "premium_tenure_3_month_v2", icon: "4514fab914bdbfb4ad2fa23df76121a6" },
  { min: 6, id: "premium_tenure_6_month_v2", icon: "2895086c18d5531d499862e41d1155a6" },
  { min: 12, id: "premium_tenure_12_month_v2", icon: "0334688279c8359120922938dcb1d6f8" },
  { min: 24, id: "premium_tenure_24_month_v2", icon: "0d61871f72bb9a33a7ae568c1fb4f20a" },
  { min: 36, id: "premium_tenure_36_month_v2", icon: "11e2d339068b55d3a506cff34d3780f3" },
  { min: 60, id: "premium_tenure_60_month_v2", icon: "cd5e2cfd9d7f27a8cdcd3e8a8d5dc9f4" },
  { min: 72, id: "premium_tenure_72_month_v2", icon: "5b154df19c53dce2af92c9b61e6be5e2" },
];

function createFakeNitroTenureBadge(months: number, customDate?: string | null) {
  if (!months || months < 1) return null;
  let chosen = TENURE_MILESTONES[0];
  for (const m of TENURE_MILESTONES) {
    if (months >= m.min) chosen = m;
  }
  let dateStr: string;
  if (customDate && customDate.trim()) {
    dateStr = customDate.trim();
  } else {
    const earned = new Date();
    earned.setMonth(earned.getMonth() - months);
    dateStr = `${earned.getDate()}/${earned.getMonth() + 1}/${earned.getFullYear()}`;
  }
  return {
    id: chosen.id,
    description: `Subscriber since ${dateStr}`,
    icon: chosen.icon,
    link: "https://discord.com/settings/premium"
  };
}

let settingsEntry: any = null;
let _store: any = null;
let _origGetUserProfile: any = null;
let _origGetGuildMemberProfile: any = null;
let _userStore: any = null;
let _origGetUser: any = null;
let _origGetCurrentUser: any = null;
let _snowflakeUtils: any = null;
let _origExtractTimestamp: any = null;
let _origAge: any = null;

function isUserProfileStore(mod: any): boolean {
  try {
    if (typeof mod.getUserProfile !== "function") return false;
    return true;
  } catch {
    return false;
  }
}

function isUserStore(mod: any): boolean {
  try {
    if (typeof mod.getUser !== "function") return false;
    return true;
  } catch {
    return false;
  }
}

function createFakedUser(realUser: any, overrides: any = {}) {
  if (!realUser) return realUser;
  const overrideKeys = Object.keys(overrides);
  if (overrideKeys.length === 0) return realUser;

  const proto = Object.getPrototypeOf(realUser) || Object.prototype;
  const fake: any = Object.create(proto);

  for (const key of Reflect.ownKeys(realUser)) {
    try {
      const desc = Reflect.getOwnPropertyDescriptor(realUser, key);
      if (desc) {
        Object.defineProperty(fake, key, desc);
      }
    } catch {}
  }

  for (const k of overrideKeys) {
    try {
      Object.defineProperty(fake, k, {
        value: overrides[k],
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } catch {}
  }

  if (fake.id == null && realUser.id != null) fake.id = realUser.id;

  return fake;
}

export default definePlugin({
  name: "Liquidcord",
  description: "Client-sided profile customizations (badges, username, registration date, connections) synced across plugin users via backend. Badges/icons/names/links authoritative from backend.",
  authors: [{ name: "Liquidcord", id: 0n }],
  settings,
  async start() {
    startAuth();
    startCache();
    startProfileSync();

    waitFor(["getUserProfile", "getGuildMemberProfile"], (mod: any) => {
      if (!isUserProfileStore(mod)) {
        console.warn("[Liquidcord] Store ignored — not UserProfileStore");
        return;
      }
      _store = mod;

      _origGetUserProfile = _store.getUserProfile.bind(_store);
      _store.getUserProfile = (id: string) => {
        fetchProfile(id).catch(() => {});
        const profile = _origGetUserProfile(id);
        if (profile) {
          const lp = getCachedProfile(id);
          if (lp) {
            const updates: any = {};
            const b = Array.isArray(lp.badges) ? lp.badges : [];
            if (b.length > 0) {
              const injected = b.map((badge: any, i: number) => ({
                id: `liquidcord-${id}-${i}`,
                description: badge.description || "",
                iconSrc: badge.iconSrc,
                link: badge.link || undefined,
              }));
              const baseBadges = (profile.badges || []).filter((bb: any) => !bb.id || !String(bb.id).startsWith("liquidcord-"));
              updates.badges = [...baseBadges, ...injected];
            }
            const conns = Array.isArray(lp.connections) ? lp.connections : [];
            if (conns.length > 0) {
              updates.connectedAccounts = conns.map((c: any) => ({
                type: c.type,
                id: c.name || c.type,
                name: c.name,
                verified: false,
              }));
            }
            if (lp?.nitroMonths != null && lp.nitroMonths > 0) {
              const since = new Date();
              since.setMonth(since.getMonth() - lp.nitroMonths);
              updates.premiumSince = since;
              updates.premium_since = since.toISOString();
              updates.premiumType = 2;
              updates.premium_type = 2;
              updates.premiumState = {
                premium_source: 1,
                premium_subscription_type: 4,
              };
            }

            if (lp?.nitroMonths != null && lp.nitroMonths > 0) {
              const tenureBadge = createFakeNitroTenureBadge(lp.nitroMonths, lp.nitroSinceDate);
              if (tenureBadge) {
                const currentBadges = updates.badges || profile.badges || [];
                const filtered = currentBadges.filter((b: any) => !b.id || !String(b.id).startsWith("premium_tenure_"));
                updates.badges = [tenureBadge, ...filtered];
              }
            }

            if (Object.keys(updates).length > 0) {
              let result = virtualMerge(profile, updates);
              if (updates.premiumSince !== undefined) result.premiumSince = updates.premiumSince;
              if (updates.premium_since !== undefined) result.premium_since = updates.premium_since;
              if (updates.premiumType !== undefined) result.premiumType = updates.premiumType;
              if (updates.premium_type !== undefined) result.premium_type = updates.premium_type;
              if (updates.premiumState !== undefined) result.premiumState = updates.premiumState;
              if (result.user && (updates.premiumSince !== undefined || updates.premium_since !== undefined)) {
                const userUpdates: any = {};
                if (updates.premiumSince !== undefined) userUpdates.premiumSince = updates.premiumSince;
                if (updates.premium_since !== undefined) userUpdates.premium_since = updates.premium_since;
                if (updates.premiumType !== undefined) userUpdates.premiumType = updates.premiumType;
                if (updates.premium_type !== undefined) userUpdates.premium_type = updates.premium_type;
                if (updates.premiumState !== undefined) userUpdates.premiumState = updates.premiumState;
                result.user = virtualMerge(result.user, userUpdates);
                if (updates.premiumSince !== undefined) result.user.premiumSince = updates.premiumSince;
                if (updates.premium_since !== undefined) result.user.premium_since = updates.premium_since;
                if (updates.premiumType !== undefined) result.user.premiumType = updates.premiumType;
                if (updates.premium_type !== undefined) result.user.premium_type = updates.premium_type;
                if (updates.premiumState !== undefined) result.user.premiumState = updates.premiumState;
              }
              return result;
            }
          }
        }
        return profile;
      };

      _origGetGuildMemberProfile = _store.getGuildMemberProfile?.bind(_store);
      if (_origGetGuildMemberProfile) {
        _store.getGuildMemberProfile = (userId: string, guildId: string) => {
          fetchProfile(userId).catch(() => {});
          const profile = _origGetGuildMemberProfile(userId, guildId);
          if (profile) {
            const lp = getCachedProfile(userId);
            if (lp) {
              const updates: any = {};
              const conns = Array.isArray(lp.connections) ? lp.connections : [];
              if (conns.length > 0) {
                updates.connectedAccounts = conns.map((c: any) => ({
                  type: c.type,
                  id: c.name || c.type,
                  name: c.name,
                  verified: false,
                }));
              }

              if (Object.keys(updates).length > 0) {
                let result = virtualMerge(profile, updates);
                if (updates.premiumSince !== undefined) result.premiumSince = updates.premiumSince;
                if (updates.premium_since !== undefined) result.premium_since = updates.premium_since;
                if (updates.premiumType !== undefined) result.premiumType = updates.premiumType;
                if (updates.premium_type !== undefined) result.premium_type = updates.premium_type;
                if (updates.premiumState !== undefined) result.premiumState = updates.premiumState;
                if (result.user && (updates.premiumSince !== undefined || updates.premium_since !== undefined)) {
                  const userUpdates: any = {};
                  if (updates.premiumSince !== undefined) userUpdates.premiumSince = updates.premiumSince;
                  if (updates.premium_since !== undefined) userUpdates.premium_since = updates.premium_since;
                  if (updates.premiumType !== undefined) userUpdates.premiumType = updates.premiumType;
                  if (updates.premium_type !== undefined) userUpdates.premium_type = updates.premium_type;
                  if (updates.premiumState !== undefined) userUpdates.premiumState = updates.premiumState;
                  result.user = virtualMerge(result.user, userUpdates);
                  if (updates.premiumSince !== undefined) result.user.premiumSince = updates.premiumSince;
                  if (updates.premium_since !== undefined) result.user.premium_since = updates.premium_since;
                  if (updates.premiumType !== undefined) result.user.premiumType = updates.premiumType;
                  if (updates.premium_type !== undefined) result.user.premium_type = updates.premium_type;
                  if (updates.premiumState !== undefined) result.user.premiumState = updates.premiumState;
                }
                return result;
              }
            }
          }
          return profile;
        };
      }

      _store.emitChange?.();
    });

    waitFor(["getUser"], (mod: any) => {
      if (!isUserStore(mod)) {
        console.warn("[Liquidcord] UserStore ignored");
        return;
      }
      _userStore = mod;
      _origGetUser = mod.getUser.bind(mod);
      mod.getUser = (id: string) => {
        fetchProfile(id).catch(() => {});
        const real = _origGetUser(id);
        if (!real) return real;
        const lp = getCachedProfile(id);
        if (!lp) return real;
        const overrides: any = {};
        if (lp.customUsername) overrides.username = lp.customUsername;
        if (lp.registrationDate) {
          try { overrides.createdAt = new Date(lp.registrationDate); } catch {}
        }
        if (lp.nitroMonths != null && lp.nitroMonths > 0) {
          const since = new Date();
          since.setMonth(since.getMonth() - lp.nitroMonths);
          overrides.premiumSince = since;
          overrides.premium_since = since.toISOString();
          overrides.premiumType = 2;
          overrides.premium_type = 2;
          overrides.premiumState = {
            premium_source: 1,
            premium_subscription_type: 4,
          };
        }
        return Object.keys(overrides).length ? createFakedUser(real, overrides) : real;
      };

      _origGetCurrentUser = mod.getCurrentUser?.bind(mod);
      if (_origGetCurrentUser) {
        mod.getCurrentUser = () => {
          const real = _origGetCurrentUser();
          if (real) fetchProfile(real.id).catch(() => {});
          if (!real) return real;
          const lp = getCachedProfile(real.id);
          if (!lp) return real;
          const overrides: any = {};
          if (lp.customUsername) overrides.username = lp.customUsername;
          if (lp.registrationDate) {
            try { overrides.createdAt = new Date(lp.registrationDate); } catch {}
          }
          if (lp.nitroMonths != null && lp.nitroMonths > 0) {
            const since = new Date();
            since.setMonth(since.getMonth() - lp.nitroMonths);
            overrides.premiumSince = since;
            overrides.premium_since = since.toISOString();
            overrides.premiumType = 2;
            overrides.premium_type = 2;
            overrides.premiumState = {
              premium_source: 1,
              premium_subscription_type: 4,
            };
          }
          return Object.keys(overrides).length ? createFakedUser(real, overrides) : real;
        };
      }
    });

    waitFor(["extractTimestamp", "age"], (mod: any) => {
      _snowflakeUtils = mod;
      _origExtractTimestamp = mod.extractTimestamp?.bind(mod);
      if (_origExtractTimestamp) {
        mod.extractTimestamp = (snowflake: string) => {
          try {
            const lp = getCachedProfile(String(snowflake));
            if (lp?.registrationDate) {
              const d = new Date(lp.registrationDate);
              if (!isNaN(+d)) return +d;
            }
          } catch {}
          return _origExtractTimestamp(snowflake);
        };
      }
      _origAge = mod.age?.bind(mod);
      if (_origAge) {
        mod.age = (snowflake: string) => {
          try {
            const lp = getCachedProfile(String(snowflake));
            if (lp?.registrationDate) {
              const d = new Date(lp.registrationDate);
              if (!isNaN(+d)) return Date.now() - (+d);
            }
          } catch {}
          return _origAge(snowflake);
        };
      }
    });

    settingsEntry = { key: "liquidcord", title: "Liquidcord", Component: LiquidcordTab, Icon: LiquidIcon };
    SettingsPlugin.customEntries.push(settingsEntry);
  },
  stop() {
    stopAuth();
    stopCache();
    stopProfileSync();

    if (_store) {
      if (_origGetUserProfile) _store.getUserProfile = _origGetUserProfile;
      if (_origGetGuildMemberProfile) _store.getGuildMemberProfile = _origGetGuildMemberProfile;
      _store.emitChange?.();
      _store = null; _origGetUserProfile = null; _origGetGuildMemberProfile = null;
    }
    if (_userStore) {
      if (_origGetUser) _userStore.getUser = _origGetUser;
      if (_origGetCurrentUser) _userStore.getCurrentUser = _origGetCurrentUser;
      _userStore.emitChange?.();
      _userStore = null; _origGetUser = null; _origGetCurrentUser = null;
    }
    if (_snowflakeUtils) {
      if (_origExtractTimestamp) _snowflakeUtils.extractTimestamp = _origExtractTimestamp;
      if (_origAge) _snowflakeUtils.age = _origAge;
      _snowflakeUtils = null; _origExtractTimestamp = null; _origAge = null;
    }
    if (settingsEntry) {
      removeFromArray(SettingsPlugin.customEntries, (e: any) => e.key === "liquidcord");
      settingsEntry = null;
    }
  },
});
