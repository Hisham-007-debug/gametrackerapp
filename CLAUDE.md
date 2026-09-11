# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — the only way to actually run the app (starts Vite + the IGDB proxy middleware)
- `npm test` — `node --test src/*.test.ts`; single file: `node --test src/backlog.test.ts`
- `npm run lint` — ESLint
- `npm run build` — `tsc -b && vite build`; output is UI-only, no IGDB proxy, so the built app cannot search

Requires `.env.local` with `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` (Twitch app from https://dev.twitch.tv/console/apps). Never add a `VITE_` prefix to these — that would bundle the secret into the client.

## Architecture

React 19 + React Compiler, TypeScript, Vite. No UI framework, no state library, no runtime deps beyond React. Tests use Node's built-in runner and import `.ts` directly (hence explicit `.ts` extensions in imports).

- `server/igdb.ts` — host-agnostic `searchGames(q, creds)`: validates `q` (2–100 chars), caches the Twitch OAuth token, builds the IGDB query body itself so clients can't run arbitrary queries. Throws `BadRequest` for bad input (→ 400), plain `Error` for upstream failure (→ 502). Type-checked via `tsconfig.node.json`.
- `vite-igdb-plugin.ts` — dev-server-only adapter (`apply: 'serve'`) exposing `POST /api/search` `{ q }` around `searchGames`. Hosting = the same ~10 lines in a serverless function.
- `src/igdb.ts` — client `POST /api/search`; `Game` type, cover URL helper.
- `src/backlog.ts` — pure list operations (`addGame`, `setStatus`, `removeGame`) and `isEntryList` validator over `Entry[]` with four `STATUSES`. All logic that deserves tests lives here; keep it React-free.
- `src/useStored.ts` — `useState` mirrored to `localStorage` with a validator callback so corrupt storage falls back to the initial value instead of crashing.
- `src/colors.ts` — per-status accent presets + validator for stored colour map.
- `src/App.tsx` — single component tree; state is two `useStored` values (`backlog` entries, `colors`) plus search state. Accent colours flow to cards via the `--accent` CSS custom property. Backup panel exports/imports `{ entries, colors }` JSON (import replaces, after `confirm()`).

All user data is `localStorage` only — no accounts, no sync.
