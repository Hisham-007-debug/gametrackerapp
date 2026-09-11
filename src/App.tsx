import { useRef, useState } from 'react'
import { STATUSES, addGame, isEntryList, removeGame, setStatus, type Entry, type Status } from './backlog.ts'
import { DEFAULT_COLORS, isColorMap } from './colors.ts'
import { coverUrl, releaseYear, searchGames, type Game } from './igdb.ts'
import { useStored } from './useStored.ts'

const LABELS: Record<Status, string> = {
  backlog: 'Backlog',
  playing: 'Playing',
  beaten: 'Beaten',
  dropped: 'Dropped',
}

function Poster({ imageId, name, index }: { imageId?: string; name: string; index: number }) {
  const src = coverUrl(imageId)
  // Stagger the entrance so a row of cards cascades in instead of popping at once.
  const style = { animationDelay: `${Math.min(index, 10) * 40}ms` }
  if (!src) {
    return (
      <div className="poster poster-empty" style={style}>
        <span>{name}</span>
      </div>
    )
  }
  return (
    <img className="poster" style={style} src={src} alt={`${name} cover art`} width={176} height={249} loading="lazy" />
  )
}

function Card({
  name,
  year,
  imageId,
  index,
  accent,
  children,
}: {
  name: string
  year?: number
  imageId?: string
  index: number
  accent?: string
  children: React.ReactNode
}) {
  return (
    <li className="card" style={accent ? { '--accent': accent } as React.CSSProperties : undefined}>
      <Poster imageId={imageId} name={name} index={index} />
      <div className="card-body">
        <p className="card-title">{name}</p>
        {year && <p className="card-year">{year}</p>}
        <div className="card-actions">{children}</div>
      </div>
    </li>
  )
}

export default function App() {
  const [entries, setEntries] = useStored<Entry[]>('backlog', [], isEntryList)
  const [colors, setColors] = useStored<Record<Status, string>>('colors', DEFAULT_COLORS, isColorMap)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Game[]>([])
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)
  const [view, setView] = useState<'home' | 'results'>('home')
  const fileInput = useRef<HTMLInputElement>(null)

  const owned = new Set(entries.map((e) => e.id))
  const custom = STATUSES.some((s) => colors[s] !== DEFAULT_COLORS[s])

  async function search(event: React.FormEvent) {
    event.preventDefault()
    if (query.trim().length < 2) return
    setSearching(true)
    setError('')
    try {
      setResults(await searchGames(query))
      setView('results')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Search failed. Check the Twitch credentials in .env.local, then retry.',
      )
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  function exportList() {
    const blob = new Blob([JSON.stringify({ entries, colors }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: 'gametracker.json' })
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importList(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (!isEntryList(data?.entries) || !isColorMap(data?.colors)) throw new Error()
      if (!confirm(`Replace your current list with ${data.entries.length} games from ${file.name}?`)) return
      setEntries(data.entries)
      setColors(data.colors)
      setError('')
    } catch {
      setError(`${file.name} is not a GameTracker export.`)
    }
  }

  function drop(entry: Entry) {
    if (confirm(`Remove ${entry.name} from your list?`)) setEntries(removeGame(entries, entry.id))
  }

  return (
    <>
      <header>
        <div className="bar">
          <h1>
            Game<span>Tracker</span>
          </h1>
          <form onSubmit={search} role="search">
            <label className="sr-only" htmlFor="search">
              Search Games
            </label>
            <input
              id="search"
              type="search"
              name="game"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search games…"
              autoComplete="off"
              spellCheck={false}
              minLength={2}
            />
            <button type="submit" className="primary">
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>
        </div>
      </header>

      <main>
        <p className="error" aria-live="polite">
          {error}
        </p>

        {view === 'results' ? (
          <section key="results" className="view">
            <div className="view-head">
              <button type="button" className="back" onClick={() => setView('home')}>
                <span aria-hidden="true">←</span> Back To My List
              </button>
              <h2>Results For “{query}”</h2>
            </div>
            {results.length === 0 ? (
              <p className="empty">No games matched. Try another title.</p>
            ) : (
              <ul className="grid">
                {results.map((game, i) => (
                  <Card
                    key={game.id}
                    index={i}
                    name={game.name}
                    year={releaseYear(game.first_release_date)}
                    imageId={game.cover?.image_id}
                    accent={colors.backlog}
                  >
                    <button
                      type="button"
                      className={owned.has(game.id) ? '' : 'primary'}
                      onClick={() => setEntries(addGame(entries, game))}
                      disabled={owned.has(game.id)}
                    >
                      {owned.has(game.id) ? 'In Your List' : '+ Add'}
                    </button>
                  </Card>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section key="home" className="view">
            <details className="settings">
              <summary>Backup</summary>
              <div className="swatches">
                <button type="button" onClick={exportList}>
                  Export JSON
                </button>
                <button type="button" onClick={() => fileInput.current?.click()}>
                  Import JSON…
                </button>
                <input ref={fileInput} type="file" accept=".json,application/json" onChange={importList} hidden />
              </div>
            </details>

            {entries.length === 0 ? (
              <div className="hero">
                <h2>Your Backlog Starts Here</h2>
              </div>
            ) : (
              <>
                <details className="settings">
                  <summary>Category Colors</summary>
                  <div className="swatches">
                    {STATUSES.map((status) => (
                      <label key={status} className="swatch">
                        <input
                          type="color"
                          value={colors[status]}
                          onChange={(e) => setColors({ ...colors, [status]: e.target.value })}
                        />
                        {LABELS[status]}
                      </label>
                    ))}
                    <button type="button" onClick={() => setColors(DEFAULT_COLORS)} disabled={!custom}>
                      Use Preset Colors
                    </button>
                  </div>
                </details>

                {STATUSES.map((status) => {
                  const group = entries.filter((e) => e.status === status)
                  if (group.length === 0) return null
                  return (
                    <div className="row" key={status} style={{ '--accent': colors[status] } as React.CSSProperties}>
                      <h2>
                        {LABELS[status]} <span className="count">{group.length}</span>
                      </h2>
                      <ul className="rail">
                        {group.map((entry, i) => (
                          <Card key={entry.id} index={i} name={entry.name} year={entry.year} imageId={entry.coverId}>
                            <label className="sr-only" htmlFor={`status-${entry.id}`}>
                              Status for {entry.name}
                            </label>
                            <select
                              id={`status-${entry.id}`}
                              value={entry.status}
                              onChange={(e) => setEntries(setStatus(entries, entry.id, e.target.value as Status))}
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {LABELS[s]}
                                </option>
                              ))}
                            </select>
                            <button type="button" aria-label={`Remove ${entry.name}`} onClick={() => drop(entry)}>
                              ✕
                            </button>
                          </Card>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </>
            )}
          </section>
        )}
      </main>
    </>
  )
}
