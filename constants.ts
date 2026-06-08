export const DATASTORE_TOKEN_KEY = "liquidcord:token";
export const DATASTORE_USERID_KEY = "liquidcord:userId";
export const BADGE_ID_PREFIX = "liquidcord";

export interface RealDiscordBadge {
  type: string;
  iconSrc: string;
  description: string;
  link: string;
}

export interface ResolvedBadge {
  iconSrc: string;
  description: string;
  link: string;
}

export const REAL_DISCORD_BADGES: RealDiscordBadge[] = [
  { type: "staff", iconSrc: "https://cdn.discordapp.com/badge-icons/5e74e9b61934fc1f67c65515d1f7e60d.png", description: "Discord Staff", link: "https://discord.com/company" },
  { type: "hypesquad", iconSrc: "https://cdn.discordapp.com/badge-icons/bf01d1073931f921909045f3a39fd264.png", description: "HypeSquad Events", link: "https://discord.com/hypesquad" },
  { type: "hypesquad_house_1", iconSrc: "https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png", description: "HypeSquad Bravery", link: "https://discord.com/settings/hypesquad-online" },
  { type: "hypesquad_house_2", iconSrc: "https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png", description: "HypeSquad Brilliance", link: "https://discord.com/settings/hypesquad-online" },
  { type: "hypesquad_house_3", iconSrc: "https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png", description: "HypeSquad Balance", link: "https://discord.com/settings/hypesquad-online" },
  { type: "partner", iconSrc: "https://cdn.discordapp.com/badge-icons/3f9748e53446a137a052f3454e2de41e.png", description: "Partnered Server Owner", link: "https://discord.com/partners" },
  { type: "early_supporter", iconSrc: "https://cdn.discordapp.com/badge-icons/7060786766c9c840eb3019e725d2b358.png", description: "Early Supporter", link: "https://discord.com/settings/premium" },
  { type: "bug_hunter_level_1", iconSrc: "https://cdn.discordapp.com/badge-icons/2717692c7dca7289b35297368a940dd0.png", description: "Bug Hunter", link: "https://support.discord.com/hc/en-us/articles/360046057772-Discord-Bugs" },
  { type: "bug_hunter_level_2", iconSrc: "https://cdn.discordapp.com/badge-icons/848f79194d4be5ff5f81505cbd0ce1e6.png", description: "Bug Hunter Gold", link: "https://support.discord.com/hc/en-us/articles/360046057772-Discord-Bugs" },
  { type: "verified_developer", iconSrc: "https://cdn.discordapp.com/badge-icons/6df5892e0f35b051f8b61eace34f4967.png", description: "Early Verified Bot Developer", link: "" },
  { type: "active_developer", iconSrc: "https://cdn.discordapp.com/badge-icons/6bdc42827a38498929a4920da12695d9.png", description: "Active Developer", link: "https://support-dev.discord.com/hc/en-us/articles/10113997751447" },
  { type: "premium", iconSrc: "https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png", description: "Nitro Subscriber", link: "https://discord.com/settings/premium" }
];

export const CONNECTION_PLATFORMS = [
  { label: "YouTube", value: "youtube" },
  { label: "Twitch", value: "twitch" },
  { label: "Twitter / X", value: "twitter" },
  { label: "GitHub", value: "github" },
  { label: "Steam", value: "steam" },
  { label: "Spotify", value: "spotify" },
  { label: "Reddit", value: "reddit" },
  { label: "TikTok", value: "tiktok" },
  { label: "Instagram", value: "instagram" },
  { label: "Roblox", value: "roblox" },
  { label: "Facebook", value: "facebook" },
  { label: "Xbox", value: "xbox" },
  { label: "PlayStation", value: "playstation" },
  { label: "Epic Games", value: "epicgames" },
  { label: "Battle.net", value: "battlenet" },
  { label: "League of Legends", value: "leagueoflegends" },
  { label: "Riot Games", value: "riotgames" },
  { label: "SoundCloud", value: "soundcloud" },
  { label: "Bluesky", value: "bluesky" },
  { label: "Mastodon", value: "mastodon" },
  { label: "Crunchyroll", value: "crunchyroll" },
  { label: "Domain", value: "domain" },
];

export function getPlatformLabel(type: string): string {
  return CONNECTION_PLATFORMS.find(o => o.value === type)?.label ?? type;
}

export function resolveBadgeType(typeOrSrc: string): ResolvedBadge | null {
  const found = REAL_DISCORD_BADGES.find(r => r.type === typeOrSrc || r.iconSrc === typeOrSrc);
  if (!found) return null;
  return { iconSrc: found.iconSrc, description: found.description, link: found.link };
}
