import { setMode, useMode } from '@/lib/mode'

export default function ModeToggle() {
  const mode = useMode()

  return (
    <div className="mode-toggle">
      <div className="mode-toggle-label">mode</div>
      <div className="mode-toggle-buttons">
        <button
          type="button"
          className={`mode-btn${mode === 'demo' ? ' active' : ''}`}
          onClick={() => setMode('demo')}
        >
          demo
        </button>
        <button
          type="button"
          className={`mode-btn${mode === 'real' ? ' active' : ''}`}
          onClick={() => setMode('real')}
        >
          real
        </button>
      </div>
    </div>
  )
}
