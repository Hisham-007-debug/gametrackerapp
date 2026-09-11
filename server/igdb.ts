import type { Game } from '../src/igdb.ts'

// Host-agnostic IGDB search. The Vite dev plugin wraps this today; a serverless function
// wraps it the same way when the app is hosted. Only the query text crosses the wire —
// the IGDB query body is built here so clients can't run arbitrary queries on our credentials.

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
const IGDB_URL = 'https://api.igdb.com/v4'

export const MIN_QUERY = 2
export const MAX_QUERY = 100

export type Credentials = { clientId: string; clientSecret: string }

/** Thrown for bad input; hosts map it to a 400. Anything else is an upstream failure. */
export class BadRequest extends Error {}

let cached: { token: string; expiresAt: number } | undefined

async function getToken({ clientId, clientSecret }: Credentials) {
  if (cached && cached.expiresAt > Date.now()) return cached.token

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  })
  const res = await fetch(`${TOKEN_URL}?${params}`, { method: 'POST' })
  if (!res.ok) throw new Error(`Twitch auth failed (${res.status}): ${await res.text()}`)

  const { access_token, expires_in } = (await res.json()) as { access_token: string; expires_in: number }
  // Expire a minute early so an in-flight request can't race the real expiry.
  cached = { token: access_token, expiresAt: Date.now() + expires_in * 1000 - 60_000 }
  return cached.token
}

export async function searchGames(q: unknown, creds: Credentials): Promise<Game[]> {
  if (typeof q !== 'string') throw new BadRequest('Expected { q: string }')
  const query = q.trim().replace(/["\\]/g, '')
  if (query.length < MIN_QUERY) throw new BadRequest(`Search needs at least ${MIN_QUERY} characters`)
  if (query.length > MAX_QUERY) throw new BadRequest(`Search is limited to ${MAX_QUERY} characters`)

  const res = await fetch(`${IGDB_URL}/games`, {
    method: 'POST',
    headers: {
      'Client-ID': creds.clientId,
      Authorization: `Bearer ${await getToken(creds)}`,
      Accept: 'application/json',
    },
    body: `search "${query}"; fields name,cover.image_id,first_release_date; limit 20;`,
  })
  const data = (await res.json()) as Game[] & { 0?: { cause?: string } }
  if (!res.ok) throw new Error(data[0]?.cause ?? `IGDB error ${res.status}`)
  return data
}
