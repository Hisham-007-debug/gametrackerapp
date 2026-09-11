export type Game = {
  id: number
  name: string
  cover?: { image_id: string }
  first_release_date?: number
}

export function coverUrl(imageId: string | undefined) {
  return imageId
    ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`
    : undefined
}

export function releaseYear(timestamp: number | undefined) {
  return timestamp ? new Date(timestamp * 1000).getFullYear() : undefined
}

/** The server builds the IGDB query; only the search text is sent. See server/igdb.ts. */
export async function searchGames(q: string): Promise<Game[]> {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q }),
  })
  const data = (await res.json()) as Game[] & { error?: string }
  if (!res.ok) throw new Error(data.error ?? `Search failed (${res.status})`)
  return data
}
