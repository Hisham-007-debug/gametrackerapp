import { useEffect, useState } from 'react'

/** State mirrored into localStorage. Falls back to `initial` when storage is empty or unreadable. */
export function useStored<T>(key: string, initial: T, valid: (value: unknown) => boolean) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return initial
      const parsed = JSON.parse(raw)
      // Corrupt or hand-edited storage must not white-screen the app.
      return valid(parsed) ? (parsed as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Private mode / quota full: keep working in memory for this session.
    }
  }, [key, value])

  return [value, setValue] as const
}
