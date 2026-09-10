import type { Status } from './backlog.ts'

/** Preset accent per category. Users can override any of these; Reset restores them. */
export const DEFAULT_COLORS: Record<Status, string> = {
  backlog: '#e50914',
  playing: '#2dd4a7',
  beaten: '#4d8bff',
  dropped: '#8b8b96',
}

export function isColorMap(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v))
  )
}
