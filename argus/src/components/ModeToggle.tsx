import { setMode, useMode, type Mode } from '@/lib/mode'

const OPTIONS: Mode[] = ['demo', 'real']

export default function ModeToggle() {
  const mode = useMode()
  return (
    <div className="mode-toggle">
      <div className="mode-toggle-label">data</div>
      <div className="mode-toggle-pill" role="radiogroup" aria-label="data mode">
        {OPTIONS.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            className={`mode-toggle-option${mode === m ? ' active' : ''}`}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}
