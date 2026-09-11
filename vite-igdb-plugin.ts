import { loadEnv, type Plugin } from 'vite'
import { BadRequest, searchGames } from './server/igdb.ts'

// ponytail: dev-server adapter only. Hosting = a serverless function with these same ~10
// lines around searchGames(). The client just POSTs { q } to /api/search either way.

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

      server.middlewares.use('/api/search', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        const fail = (status: number, error: string) => {
          res.statusCode = status
          res.end(JSON.stringify({ error }))
        }

        if (req.method !== 'POST') return fail(405, 'POST only')
        if (!clientId || !clientSecret) {
          return fail(500, 'Missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET. Copy .env.example to .env.local.')
        }

        let q: unknown
        try {
          q = JSON.parse(await readBody(req)).q
        } catch {
          return fail(400, 'Expected JSON body { q: string }')
        }

        try {
          res.end(JSON.stringify(await searchGames(q, { clientId, clientSecret })))
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          fail(err instanceof BadRequest ? 400 : 502, message)
        }
      })
    },
  }
}
