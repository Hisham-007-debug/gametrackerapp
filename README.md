# Game Backlog Tracker

Search IGDB, track what you own, move each game through `Backlog → Playing → Beaten → Dropped`.
List lives in `localStorage`. Runs locally only.

## Setup

1. Create an application at https://dev.twitch.tv/console/apps (IGDB auth is Twitch OAuth).
2. `cp .env.example .env.local` and fill in `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`.
   These stay server-side: the Vite dev-server middleware in `vite-igdb-plugin.ts` fetches the
   token and proxies `/api/igdb/*` to IGDB, so neither value reaches the browser.
3. `npm run dev`

## Scripts

- `npm run dev` — dev server with the IGDB proxy
- `npm test` — backlog logic checks (`node --test`)
- `npm run lint`, `npm run build`
