import { useEffect } from 'react'
import { ACCENTS, applyAccentClass, setAccent, useAccent } from '@/lib/accent'

export default function AccentPicker() {
  const accent = useAccent()

  // Apply class on first mount in case nothing else has yet
  useEffect(() => {
    applyAccentClass(accent)
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
