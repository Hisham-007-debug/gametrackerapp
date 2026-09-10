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

## Built with

React 19 with the React Compiler, TypeScript, and Vite. No UI framework, no state library, no
runtime dependencies beyond React itself.
