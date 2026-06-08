import { getCachedProfile } from "../cache/profileCache";
import { getPlatformLabel } from "../constants";
import { findByCodeLazy, findByPropsLazy, findComponentByCodeLazy } from "@webpack";
import { React } from "@webpack/common";

const useLegacyPlatformType: (t: string) => string = findByCodeLazy(".TWITTER_LEGACY:");
const platforms: { get(t: string): { icon: { lightSVG: string; darkSVG: string } } } = findByPropsLazy("isSupported", "getByUrl");
const getProfileThemeProps = findByCodeLazy(".getPreviewThemeColors", "primaryColor:");
const Section = findComponentByCodeLazy("headingVariant:", '"section"', "headingIcon:");

function getPlatformIcon(type: string, theme: string): string | null {
  try {
    const p = platforms.get(useLegacyPlatformType(type));
    if (!p) return null;
    return theme === "light" ? p.icon.lightSVG : p.icon.darkSVG;
  } catch { return null; }
}

interface Conn { type: string; name: string; url?: string; }

function ConnectionRow({ c, theme }: { c: Conn; theme: string }) {
  const iconSrc = getPlatformIcon(c.type, theme);
  const textColor = "#ddd";
  const hasLink = !!(c.url && c.url.trim());

  const inner = (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: textColor }}>{c.name}</span>
      <span style={{ color: textColor, fontSize: 12, opacity: 0.7 }}>↗</span>
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0" }}>
      <div style={{ width: 16, height: 16, flexShrink: 0 }}>
        {iconSrc ? <img src={iconSrc} alt="" style={{ width: 16, height: 16 }} /> : <div style={{ width: 16, height: 16, background: "#555", borderRadius: 2 }} />}
      </div>
      {hasLink ? (
        <a href={c.url} target="_blank" rel="noreferrer noopener" style={{ color: "inherit", textDecoration: "none", flex: 1, minWidth: 0 }}>{inner}</a>
      ) : (
        <div style={{ flex: 1, minWidth: 0 }}>{inner}</div>
      )}
    </div>
  );
}

export function ConnectionsSection({ userId, isSideBar }: { userId: string; isSideBar?: boolean }) {
  const lp = getCachedProfile(userId);
  const conns: Conn[] = Array.isArray(lp?.connections) ? lp.connections : [];
  if (!conns.length) return null;

  const [theme, setTheme] = React.useState("dark");
  React.useEffect(() => {
    try { setTheme(getProfileThemeProps({})?.theme ?? "dark"); } catch {}
  }, [userId]);

  const content = (
    <div>
      {conns.map((c, i) => (
        <ConnectionRow key={i} c={c} theme={theme} />
      ))}
    </div>
  );

  if (Section) {
    return (
      <Section
        heading="Connections"
        headingVariant={isSideBar ? "text-xs/semibold" : "text-xs/medium"}
        headingColor={isSideBar ? "text-strong" : "text-default"}
      >
        {content}
      </Section>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Connections</div>
      {content}
    </div>
  );
}