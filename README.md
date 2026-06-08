# Liquidcord

Client-sided profile customizations for Vencord and forks.

You can change your badges (only real Discord ones), username, account registration date, connections, and fake Nitro tenure. Other people running the plugin will see the changes.

It works by pulling from a backend. Badges, icons, names, and links are always the real ones from Discord.

---

## Compatibility

Liquidcord works with **any Vencord version**:

- Official Vencord
- Equicord
- Any other fork

Just install it like a normal user plugin.

---

## Requirements

- [ ] Node.js (latest)
- [ ] pnpm

Install pnpm if you don't already have it:

```bash
npm install -g pnpm
```

---

## Installation

1. Git clone whichever Vencord version or fork you want to use.
2. Inside your Vencord source folder, create the `src/userplugins` directory if it doesn't exist yet.
3. Place the entire `liquidcord` folder into `src/userplugins/liquidcord`.
4. From the root of your Vencord folder, install the dependencies:

   ```bash
   pnpm i
   ```

5. Build and inject:

   ```bash
   pnpm build
   pnpm inject
   ```

Once it's injected, open Discord settings and look for the Liquidcord tab.

---

## Backend

By default the plugin points at a public backend so the sync works out of the box for anyone using the plugin.

If you want to self-host everything, there's a `backend/` folder with the server code (Bun + Postgres + Elysia).

---

## Quick note

Only people who have the plugin installed will see your faked profile data. Everyone else sees your real profile.
