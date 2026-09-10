import type { Game } from './igdb.ts'

export const STATUSES = ['backlog', 'playing', 'beaten', 'dropped'] as const
export type Status = (typeof STATUSES)[number]

export type Entry = {
  id: number
  name: string
  coverId?: string
  year?: number
  status: Status
  addedAt: number
}

export function addGame(list: Entry[], game: Game): Entry[] {
  if (list.some((e) => e.id === game.id)) return list
  return [
    ...list,
    {
      id: game.id,
      name: game.name,
      coverId: game.cover?.image_id,
      year: game.first_release_date
        ? new Date(game.first_release_date * 1000).getFullYear()
        : undefined,
      status: 'backlog',
      addedAt: Date.now(),
    },
  ]
}

export function setStatus(list: Entry[], id: number, status: Status): Entry[] {
  return list.map((e) => (e.id === id ? { ...e, status } : e))
}

export function removeGame(list: Entry[], id: number): Entry[] {
  return list.filter((e) => e.id !== id)
}
