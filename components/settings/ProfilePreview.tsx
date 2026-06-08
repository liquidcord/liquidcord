import { React } from "@webpack/common";
import type { ResolvedBadge } from "../../types";

interface Props {
  badges: ResolvedBadge[];
}

export function ProfilePreview({ badges }: Props) {
  if (!badges.length) return <div style={{ opacity: 0.6, fontSize: 13 }}>No badges yet. Add some above and publish.</div>;

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "6px 8px", background: "var(--background-secondary)", borderRadius: 4 }}>
      {badges.map((b, i) => (
        <a
          key={i}
          href={b.link || undefined}
          target={b.link ? "_blank" : undefined}
          title={b.description}
          style={{ display: "inline-flex" }}
        >
          <img
            src={b.iconSrc}
            alt={b.description ?? "badge"}
            style={{ width: 22, height: 22, objectFit: "contain", borderRadius: 3 }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
          />
        </a>
      ))}
    </div>
  );
}
