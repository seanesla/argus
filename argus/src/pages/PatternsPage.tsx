import { useMemo } from 'react'
import { useMedications } from '@/lib/medications'
import { useMode } from '@/lib/mode'
import {
  findCorrelations,
  removeSymptom,
  resetDemoData,
  useSymptoms,
} from '@/lib/symptoms'
import type { SymptomEntry } from '@/types'

const dayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})
const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function groupByDay(entries: SymptomEntry[]) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )
  const groups = new Map<string, SymptomEntry[]>()
  for (const e of sorted) {
    const key = e.occurredAt.slice(0, 10)
    const list = groups.get(key) ?? []
    list.push(e)
    groups.set(key, list)
  }
  return Array.from(groups.entries())
}

export default function PatternsPage() {
  const entries = useSymptoms()
  const meds = useMedications()
  const mode = useMode()

  const correlations = useMemo(
    () => findCorrelations(entries, meds),
    [entries, meds],
  )

  const grouped = useMemo(() => groupByDay(entries), [entries])

  function onDelete(id: string) {
    removeSymptom(id)
  }

  function onReset() {
    resetDemoData()
  }

  return (
    <div className="patterns">
      <header className="patterns-header">
        <h1 className="patterns-title">patterns</h1>
        <p className="patterns-subtitle">
          what argus has noticed — talk to argus on the chat page to log how you're feeling.
        </p>
      </header>

      <section className="patterns-section">
        <div className="patterns-section-label">patterns</div>
        {correlations.length === 0 ? (
          <div className="patterns-empty">
            not enough data yet — log a few more days from the chat page and i'll start
            connecting dots.
          </div>
        ) : (
          <div className="insights-list">
            {correlations.map((c) => (
              <article
                key={`${c.medicationId}-${c.scheduledTime}-${c.symptom}`}
                className="insight-card"
              >
                <div className="insight-summary">{c.summary}</div>
                <div className="insight-meta">
                  based on last {c.observedDays} days · ±
                  {c.windowMinutes} min window · {c.matchedDays}/{c.observedDays}{' '}
                  match rate
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="patterns-section">
        <div className="patterns-section-header">
          <div className="patterns-section-label">history</div>
          {mode === 'demo' && (
            <button type="button" className="chip" onClick={onReset}>
              reset demo data
            </button>
          )}
        </div>
        {grouped.length === 0 ? (
          <div className="patterns-empty">no entries yet.</div>
        ) : (
          <div className="history-list">
            {grouped.map(([day, items]) => (
              <div key={day} className="history-day-block">
                <div className="history-day">
                  {dayFormatter.format(new Date(day))}
                </div>
                {items.map((e) => (
                  <div key={e.id} className="history-entry">
                    <span className="history-time">
                      {timeFormatter.format(new Date(e.occurredAt))}
                    </span>
                    <span className={`severity-dot severity-${e.severity}`} />
                    <span className="history-symptom">{e.symptom}</span>
                    <span className="history-raw">"{e.rawText}"</span>
                    <button
                      type="button"
                      className="history-delete"
                      title="remove"
                      onClick={() => onDelete(e.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
