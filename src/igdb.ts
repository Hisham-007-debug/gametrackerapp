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

export async function searchGames(query: string): Promise<Game[]> {
  const search = query.replace(/["\\]/g, '')
  const res = await fetch('/api/igdb/games', {
    method: 'POST',
    body: `search "${search}"; fields name,cover.image_id,first_release_date; limit 20;`,
  })
  const data = (await res.json()) as Game[] & { error?: string; 0?: { cause?: string } }
  if (!res.ok) throw new Error(data.error ?? data[0]?.cause ?? `IGDB error ${res.status}`)
  return data
}
