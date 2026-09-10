# GameTracker

A web app for killing your game backlog.

You buy games faster than you finish them. They scatter across Steam, a console library, a
wishlist, and memory — so nothing gets played, because you can't see what's waiting. GameTracker
gives that pile one home: search the IGDB database of games, add the ones you own, and move each
one through the four states that actually matter.

## What it does

- **Search real games.** Type a title and get results straight from [IGDB](https://www.igdb.com/)
  — official cover art and release year, no manual data entry.
- **Track four states.** Every game sits in `Backlog`, `Playing`, `Beaten`, or `Dropped`. Change a
  game's state from a dropdown on its card; the list regroups instantly.
- **See the pile at a glance.** Each state is a Netflix-style horizontal rail of cover art with a
  count badge, so "23 in Backlog, 2 Playing" is the first thing you see.
- **Colour-code your categories.** Ships with a preset palette, or pick your own colour per
  category. The accent drives that category's heading, count badge, and card stripes.
- **Remembers itself.** Your list and colours persist in the browser's `localStorage` — no account,
  no sign-in, no server storing your data.

`Dropped` is deliberate: admitting you're never going to finish something is how a backlog actually
shrinks.

## Scope, honestly

This runs on your machine, for you. The list lives in one browser's `localStorage`, so there's no
sync across devices and no accounts. IGDB access needs a Twitch client secret, which can never be
shipped to a browser — so the credential lives in a Vite dev-server middleware
([vite-igdb-plugin.ts](vite-igdb-plugin.ts)) that fetches the OAuth token and proxies
`/api/igdb/*`. That means **the app only works under `npm run dev`**; a static production build has
no proxy to talk to. Hosting it means porting that one file to a serverless function.

## Setup

1. Create an application at https://dev.twitch.tv/console/apps — IGDB authenticates through Twitch.
2. Copy the example env file and fill in your two keys:
   ```bash
   cp .env.example .env.local
   ```
   ```
   TWITCH_CLIENT_ID=your_client_id
   TWITCH_CLIENT_SECRET=your_client_secret
   ```
   Put real keys **only** in `.env.local` — it is gitignored. Never in `.env.example`, which is
   committed. No `VITE_` prefix on these names: that prefix is what would bundle them into the
   client-side JavaScript.
3. Start it:
   ```bash
   npm install
   npm run dev
   ```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server plus the IGDB proxy — the way to actually run the app |
| `npm test` | Backlog logic checks (`node --test`) |
| `npm run lint` | ESLint |
| `npm run build` | Type-check and build (UI only; no IGDB proxy in the output) |

## Built with

React 19 with the React Compiler, TypeScript, and Vite. No UI framework, no state library, no
runtime dependencies beyond React itself.
