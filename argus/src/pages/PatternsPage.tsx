import { useMemo, useState } from 'react'
import { medications } from '@/data/medications'
import {
  ensureSeededOnFirstLoad,
  findCorrelations,
  addSymptoms,
  removeSymptom,
  resetDemoData,
} from '@/lib/symptoms'
import {
  extractSymptoms,
  isExtractorConfigured,
} from '@/lib/symptomExtractor'
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

const SUGGESTIONS = [
  'felt dizzy this morning around 8',
  'mild headache around 2pm',
  'nausea after lunch',
  'tired all afternoon',
]

export default function PatternsPage() {
  const [entries, setEntries] = useState<SymptomEntry[]>(() =>
    ensureSeededOnFirstLoad(),
  )
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null,
  )

  const correlations = useMemo(
    () => findCorrelations(entries, medications),
    [entries],
  )

  const grouped = useMemo(() => groupByDay(entries), [entries])

  async function handleLog(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    setBusy(true)
    setStatus(null)
    try {
      if (!isExtractorConfigured) {
        setStatus({
          kind: 'err',
          text: 'add VITE_GEMINI_API_KEY to argus/.env.local and restart the dev server.',
        })
        return
      }
      const extracted = await extractSymptoms(trimmed)
      if (extracted.length === 0) {
        setStatus({ kind: 'ok', text: 'no symptoms detected.' })
        return
      }
      const next = addSymptoms(extracted)
      setEntries(next)
      setDraft('')
      const summary = extracted.map((e) => e.symptom).join(', ')
      setStatus({
        kind: 'ok',
        text: `logged ${extracted.length} entr${extracted.length === 1 ? 'y' : 'ies'}: ${summary}`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setStatus({ kind: 'err', text: `error: ${message}` })
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    void handleLog(draft)
  }

  function onDelete(id: string) {
    setEntries(removeSymptom(id))
  }

  function onReset() {
    setEntries(resetDemoData())
    setStatus({ kind: 'ok', text: 'demo data reset.' })
  }

  return (
    <div className="patterns">
      <header className="patterns-header">
        <h1 className="patterns-title">patterns</h1>
        <p className="patterns-subtitle">
          what your body's telling argus.
        </p>
      </header>

      <section className="patterns-section">
        <div className="patterns-section-label">log how you feel</div>
        <form className="symptom-form" onSubmit={onSubmit}>
          <textarea
            className="symptom-textarea"
            placeholder="e.g. felt dizzy this morning, mild headache around 2pm…"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={busy}
          />
          <div className="symptom-form-row">
            <div className="symptom-suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="chip"
                  onClick={() => void handleLog(s)}
                  disabled={busy}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="composer-send"
              disabled={!draft.trim() || busy}
            >
              {busy ? 'reading' : 'log it'}
            </button>
          </div>
          {status && (
            <div
              className={`symptom-status symptom-status-${status.kind}`}
              role="status"
            >
              {status.text}
            </div>
          )}
        </form>
      </section>

      <section className="patterns-section">
        <div className="patterns-section-label">patterns</div>
        {correlations.length === 0 ? (
          <div className="patterns-empty">
            not enough data yet — log a few more days and i'll start
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
          <button type="button" className="chip" onClick={onReset}>
            reset demo data
          </button>
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
