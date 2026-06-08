import { Button } from "@components/Button";
import { Divider } from "@components/Divider";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Margins } from "@utils/margins";
import { React, Toasts, useState, SearchableSelect } from "@webpack/common";
import { getStoredUserId } from "../../api/auth";
import { fetchRemoteProfile } from "../../api/profileService";
import { saveMyProfileData } from "../../api/profileService";
import { invalidateUser } from "../../cache/profileCache";
import type { LiquidConnection, LiquidProfile } from "../../types";
import { AuthSection } from "./AuthSection";
import { BadgeRow } from "./BadgeRow";
import { ProfilePreview } from "./ProfilePreview";
import { REAL_DISCORD_BADGES, CONNECTION_PLATFORMS, getPlatformLabel, resolveBadgeType } from "../../constants";

export function LiquidcordTab() {
  const [authedId, setAuthedId] = useState<string | null>(null);
  const [profile, setProfile] = useState<LiquidProfile | null>(null);
  const [badgeTypes, setBadgeTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [customUsername, setCustomUsername] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [connections, setConnections] = useState<LiquidConnection[]>([]);

  const [nitroMonths, setNitroMonths] = useState<number | null>(null);
  const [nitroCustom, setNitroCustom] = useState("");
  const [nitroSinceDate, setNitroSinceDate] = useState("");

  const [connPlatform, setConnPlatform] = useState("youtube");
  const [connName, setConnName] = useState("");
  const [connUrl, setConnUrl] = useState("");

  async function load() {
    const id = await getStoredUserId();
    setAuthedId(id);
    if (!id) {
      setProfile(null);
      setBadgeTypes([]);
      setCustomUsername("");
      setRegistrationDate("");
      setConnections([]);
      setNitroMonths(null);
      setNitroCustom("");
      setNitroSinceDate("");
      setConnName("");
      setConnUrl("");
      return;
    }
    setLoading(true);
    try {
      let p = await fetchRemoteProfile(id);
      if (p && typeof p.badges === "string") {
        try { p = { ...p, badges: JSON.parse(p.badges) }; } catch { p = { ...p, badges: [] }; }
      }
      if (p && !Array.isArray(p.badges)) p = { ...p, badges: [] };
      setProfile(p);

      const types: string[] = [];
      const incomingBadges = Array.isArray(p?.badges) ? p.badges : [];
      for (const b of incomingBadges) {
        if (typeof b === "string") {
          if (REAL_DISCORD_BADGES.some(r => r.type === b)) types.push(b);
        } else if (b && b.iconSrc) {
          const m = REAL_DISCORD_BADGES.find(r => r.iconSrc === b.iconSrc);
          if (m) types.push(m.type);
        }
      }
      setBadgeTypes(types);

      setCustomUsername(p?.customUsername || "");
      setRegistrationDate(p?.registrationDate || "");
      setConnections(Array.isArray(p?.connections) ? p.connections : []);

      const loadedNitro = p?.nitroMonths ?? null;
      setNitroMonths(loadedNitro);
      const presets = [1,2,3,6,12,24,36,48,60,72];
      if (loadedNitro && !presets.includes(loadedNitro)) {
        setNitroCustom(String(loadedNitro));
      } else {
        setNitroCustom("");
      }
      setNitroSinceDate(p?.nitroSinceDate || "");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  function onAuthedChange() {
    load();
  }

  function addBadge() {
    const first = REAL_DISCORD_BADGES[0].type;
    setBadgeTypes(prev => (prev.includes(first) ? prev : [...prev, first]));
  }

  function changeBadgeType(idx: number, nextType: string) {
    setBadgeTypes(prev => {
      const copy = [...prev];
      copy[idx] = nextType;
      return copy;
    });
  }

  function removeBadge(idx: number) {
    setBadgeTypes(prev => prev.filter((_, i) => i !== idx));
  }

  function addConnection() {
    const name = connName.trim();
    if (!name || !connPlatform) return;
    const newConn: LiquidConnection = { type: connPlatform, name, url: connUrl.trim() || undefined };
    setConnections(prev => [...prev, newConn]);
    setConnName("");
    setConnUrl("");
  }

  function removeConnection(idx: number) {
    setConnections(prev => prev.filter((_, i) => i !== idx));
  }

  async function publish() {
    setSaving(true);
    const currentAuthedId = authedId;
    const uniqueTypes = Array.from(new Set(badgeTypes.filter(t => REAL_DISCORD_BADGES.some(r => r.type === t))));
    const inputNitro = parseInt(nitroCustom, 10);
    const effectiveNitro = nitroMonths ?? (isNaN(inputNitro) ? null : inputNitro);
    const data = {
      badges: uniqueTypes,
      customUsername: customUsername || null,
      registrationDate: registrationDate || null,
      connections: connections || [],
      nitroMonths: effectiveNitro,
      nitroSinceDate: nitroSinceDate || null,
    };
    const ok = await saveMyProfileData(data, currentAuthedId);
    setSaving(false);
    if (ok && currentAuthedId) {
      invalidateUser(currentAuthedId);
      let fresh = await fetchRemoteProfile(currentAuthedId);
      if (fresh && typeof fresh.badges === "string") {
        try { fresh = { ...fresh, badges: JSON.parse(fresh.badges) }; } catch { fresh = { ...fresh, badges: [] }; }
      }
      if (fresh && !Array.isArray(fresh.badges)) fresh = { ...fresh, badges: [] };
      setProfile(fresh);

      const types: string[] = [];
      const inc = Array.isArray(fresh?.badges) ? fresh.badges : [];
      for (const b of inc) {
        if (typeof b === "string") {
          if (REAL_DISCORD_BADGES.some(r => r.type === b)) types.push(b);
        } else if (b && b.iconSrc) {
          const m = REAL_DISCORD_BADGES.find(r => r.iconSrc === b.iconSrc);
          if (m) types.push(m.type);
        }
      }
      setBadgeTypes(types);

      setCustomUsername(fresh?.customUsername || "");
      setRegistrationDate(fresh?.registrationDate || "");
      setConnections(Array.isArray(fresh?.connections) ? fresh.connections : []);
      const freshNitro = fresh?.nitroMonths ?? null;
      setNitroMonths(freshNitro);
      const presets = [1,2,3,6,12,24,36,48,60,72];
      setNitroCustom( freshNitro && !presets.includes(freshNitro) ? String(freshNitro) : "" );
      setNitroSinceDate(fresh?.nitroSinceDate || "");
      Toasts.show({ id: Toasts.genId(), message: "Published to Liquidcord", type: Toasts.Type.SUCCESS });
    } else if (!ok) {
      Toasts.show({ id: Toasts.genId(), message: "Publish failed", type: Toasts.Type.FAILURE });
    }
  }

  const previewBadges = badgeTypes
    .map(t => resolveBadgeType(t))
    .filter((b): b is NonNullable<ReturnType<typeof resolveBadgeType>> => !!b);

  return (
    <>
      <Heading className={Margins.top16}>Liquidcord</Heading>
      <Paragraph className={Margins.bottom16}>
        Manage client-sided profile customizations synced to other Liquidcord users via backend.
      </Paragraph>

      <AuthSection onAuthedChange={onAuthedChange} />

      {authedId && (
        <div style={{ margin: "12px 0" }}>
          <Button onClick={publish} disabled={saving} size="small">
            {saving ? "Publishing..." : "Publish All Changes"}
          </Button>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            One click publishes badges, username, registration date, nitro age and connections.
          </div>
        </div>
      )}

      <Divider className={Margins.top20} />

      <Heading className={Margins.top16}>Badges</Heading>
      <Paragraph className={Margins.bottom8}>
        Select real Discord badges only. Icons, names and links are served from backend. No custom icons or text allowed.
      </Paragraph>

      {!authedId && <Paragraph style={{ opacity: 0.7 }}>Connect your account above to edit.</Paragraph>}

      {authedId && (
        <>
          {loading && <Paragraph>Loading from backend...</Paragraph>}
          {badgeTypes.map((t, i) => (
            <BadgeRow key={t + i} type={t} index={i} onChange={changeBadgeType} onRemove={removeBadge} />
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button onClick={addBadge} size="small">Add Badge</Button>
          </div>

          <Divider className={Margins.top16} />

          <Heading className={Margins.top16}>Username Modifier</Heading>
          <input
            type="text"
            value={customUsername}
            onChange={(e) => setCustomUsername(e.target.value)}
            placeholder="Custom @username (handle only; display name is real)"
            style={{ width: "100%", padding: "6px 8px", background: "var(--input-background)", color: "var(--text-normal)", border: "1px solid var(--input-border)", borderRadius: 4, marginBottom: 8 }}
          />

          <Divider className={Margins.top16} />

          <Heading className={Margins.top16}>Account Registration Date</Heading>
          <Paragraph className={Margins.bottom8} style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Set a custom registration date shown to other Liquidcord users (affects profile dates via User createdAt).
          </Paragraph>
          <input
            type="text"
            value={registrationDate}
            onChange={(e) => setRegistrationDate(e.target.value)}
            placeholder="2020-05-15 or 2021-03"
            style={{ width: "100%", padding: "6px 8px", background: "var(--input-background)", color: "var(--text-normal)", border: "1px solid var(--input-border)", borderRadius: 4, marginBottom: 8 }}
          />

          <Divider className={Margins.top16} />

          <Heading className={Margins.top16}>Nitro Age Modifier</Heading>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            Sets how many months of Nitro this profile shows when viewed by other Liquidcord users. Allows Opal / higher Nitro badges etc.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
            {[1,2,3,6,12,24,36,48,60,72].map(months => (
              <button
                key={months}
                onClick={() => { setNitroMonths(months); setNitroCustom(""); }}
                style={{
                  padding: "7px 0",
                  borderRadius: 6,
                  border: nitroMonths === months ? "2px solid var(--brand-500)" : "2px solid var(--background-modifier-accent)",
                  background: nitroMonths === months ? "var(--brand-500)" : "var(--background-secondary)",
                  color: nitroMonths === months ? "#fff" : "var(--text-normal)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "var(--font-primary)",
                }}
              >
                {months} month{months === 1 ? "" : "s"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              min={1}
              max={999}
              placeholder="Custom months…"
              value={nitroCustom}
              onChange={e => { setNitroCustom(e.currentTarget.value); setNitroMonths(null); }}
              style={{
                flex: 1,
                background: "var(--background-secondary)",
                border: "1px solid var(--background-modifier-accent)",
                borderRadius: 6,
                color: "var(--text-normal)",
                padding: "7px 10px",
                fontSize: 13,
                fontFamily: "var(--font-primary)",
                outline: "none",
              }}
            />
            <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>months</span>
            <button
              onClick={() => { setNitroMonths(null); setNitroCustom(""); }}
              style={{
                background: "transparent",
                border: "1px solid var(--text-danger, #f87171)",
                color: "var(--text-danger, #f87171)",
                borderRadius: 4,
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "var(--font-primary)",
              }}
            >
              Reset
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Custom "Subscriber since" date shown in the tenure badge description (e.g. 22/12/2016 or 8/3/2026). Leave empty to auto-calculate from nitro months.
            </div>
            <input
              type="text"
              value={nitroSinceDate}
              onChange={(e) => setNitroSinceDate(e.target.value)}
              placeholder="22/12/2016"
              style={{ width: "100%", padding: "6px 8px", background: "var(--input-background)", color: "var(--text-normal)", border: "1px solid var(--input-border)", borderRadius: 4 }}
            />
          </div>

          <Divider className={Margins.top16} />

          <Heading className={Margins.top16}>Connections</Heading>
          <Paragraph className={Margins.bottom8} style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Add platform connections. These are stored on backend and visible to other Liquidcord users viewing your profile (injected into real connectedAccounts).
          </Paragraph>

          {connections.length === 0 ? (
            <Paragraph style={{ opacity: 0.6, fontSize: 13, marginBottom: 8 }}>No connections yet.</Paragraph>
          ) : (
            connections.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "var(--background-secondary)", borderRadius: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.7, minWidth: 90 }}>{getPlatformLabel(c.type)}</span>
                <span style={{ flex: 1 }}>{c.name}</span>
                {c.url && <span style={{ fontSize: 11, opacity: 0.5 }}>🔗</span>}
                <Button color="red" size="small" onClick={() => removeConnection(i)}>Remove</Button>
              </div>
            ))
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8, padding: 8, border: "1px solid var(--background-modifier-accent)", borderRadius: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Add Connection</div>
            <SearchableSelect
              options={CONNECTION_PLATFORMS}
              value={CONNECTION_PLATFORMS.find(o => o.value === connPlatform)?.value ?? connPlatform}
              placeholder="Platform"
              maxVisibleItems={10}
              onChange={(v: string) => setConnPlatform(v)}
            />
            <input
              type="text"
              value={connName}
              onChange={(e) => setConnName(e.target.value)}
              placeholder="Display name e.g. yourchannel"
              style={{ width: "100%", padding: "6px 8px", background: "var(--input-background)", color: "var(--text-normal)", border: "1px solid var(--input-border)", borderRadius: 4 }}
            />
            <input
              type="text"
              value={connUrl}
              onChange={(e) => setConnUrl(e.target.value)}
              placeholder="https://... (optional)"
              style={{ width: "100%", padding: "6px 8px", background: "var(--input-background)", color: "var(--text-normal)", border: "1px solid var(--input-border)", borderRadius: 4 }}
            />
            <Button onClick={addConnection} size="small" disabled={!connName.trim()}>Add Connection</Button>
          </div>

          <Divider className={Margins.top16} />

          <Heading className={Margins.top8}>Preview (badges)</Heading>
          <ProfilePreview badges={previewBadges} />
        </>
      )}
    </>
  );
}
