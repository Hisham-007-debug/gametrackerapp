import { loadEnv, type Plugin } from 'vite'

// ponytail: dev-server middleware only. Deploying means porting this one handler to a
// serverless function — the client just POSTs to /api/igdb/<endpoint> either way.

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
const IGDB_URL = 'https://api.igdb.com/v4'

let cached: { token: string; expiresAt: number } | undefined

async function getToken(clientId: string, clientSecret: string) {
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

function readBody(req: import('node:http').IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

export function igdbProxy(): Plugin {
  return {
    name: 'igdb-proxy',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.envDir, '')
      const clientId = env.TWITCH_CLIENT_ID
      const clientSecret = env.TWITCH_CLIENT_SECRET

      server.middlewares.use('/api/igdb', async (req, res, next) => {
        // req.url is already stripped of the /api/igdb prefix by connect.
        const endpoint = (req.url ?? '/').replace(/^\/+/, '').split('?')[0]
        if (!endpoint) return next()

        res.setHeader('Content-Type', 'application/json')

        if (!clientId || !clientSecret) {
          res.statusCode = 500
          res.end(
            JSON.stringify({
              error: 'Missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET. Copy .env.example to .env.local.',
            }),
          )
          return
        }

        try {
          const body = await readBody(req)
          const upstream = await fetch(`${IGDB_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
              'Client-ID': clientId,
              Authorization: `Bearer ${await getToken(clientId, clientSecret)}`,
              Accept: 'application/json',
            },
            body,
          })
          res.statusCode = upstream.status
          res.end(await upstream.text())
        } catch (err) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
        }
      })
    },
  }
}
