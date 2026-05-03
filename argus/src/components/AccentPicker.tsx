import { useEffect, useState } from 'react'

const ACCENTS = ['brass', 'iris', 'monitor', 'sakura', 'lichen', 'ember'] as const
type Accent = (typeof ACCENTS)[number]

const STORAGE_KEY = 'argus.accent'

function applyAccent(a: Accent) {
  const root = document.documentElement
  ACCENTS.forEach((x) => root.classList.remove(`accent-${x}`))
  root.classList.add(`accent-${a}`)
}

function readStoredAccent(): Accent {
  if (typeof window === 'undefined') return 'brass'
  const stored = localStorage.getItem(STORAGE_KEY) as Accent | null
  return stored && (ACCENTS as readonly string[]).includes(stored) ? stored : 'brass'
}

export default function AccentPicker() {
  const [accent, setAccent] = useState<Accent>(() => readStoredAccent())

  useEffect(() => {
    applyAccent(accent)
    localStorage.setItem(STORAGE_KEY, accent)
  }, [accent])

  return (
    <div className="accent-picker">
      <div className="accent-picker-label">accent</div>
      <div className="accent-picker-swatches">
        {ACCENTS.map((a) => (
          <button
            key={a}
            type="button"
            title={a}
            aria-label={`accent ${a}`}
            className={`accent-swatch accent-swatch-${a}${a === accent ? ' active' : ''}`}
            onClick={() => setAccent(a)}
          />
        ))}
      </div>
    </div>
  )
}
