import { useMemo, useState } from 'react'
import { useMedications } from '@/lib/medications'
import { useMode } from '@/lib/mode'
import {
  dismissCorrelation,
  findCorrelations,
  removeSymptom,
  resetDemoData,
  useDismissed,
  useSymptoms,
} from '@/lib/symptoms'
import { useConsent } from '@/lib/consent'
import ConsentModal from '@/components/ConsentModal'
import type { Correlation, SymptomEntry } from '@/types'

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

function buildCopyBlock(
  c: Correlation,
  totalSymptomLogs: number,
  startIso: string,
  endIso: string,
): string {
  const hours = (c.windowMinutes / 60).toFixed(c.windowMinutes % 60 === 0 ? 0 : 1)
  return [
    'Argus pattern observation',
    '=========================',
    `Date range: ${startIso} → ${endIso}`,
    `Medication: ${c.medicationName}, scheduled at ${c.scheduledTime}`,
    `Symptom: ${c.symptom} (self-reported in plain English)`,
    `Time window: within ${hours} hours after the dose`,
    `Match: ${c.matchedDays} of ${c.observedDays} dose-days in this period`,
    `Symptom logs in this period (any time of day): ${totalSymptomLogs}`,
    `Confidence (per Argus' internal heuristic): ${c.confidence}`,
    `Lift over baseline: ${c.lift.toFixed(1)}×`,
    `Out-of-window occurrences of the same symptom: ${c.outOfWindowSymptomDays} day(s)`,
    '',
    'This is patient self-report from a hackathon prototype. It is not a',
    'clinical measurement and not a medical diagnosis. Argus shows',
    'co-occurrence, not causation.',
  ].join('\n')
}

export default function PatternsPage() {
  const entries = useSymptoms()
  const meds = useMedications()
  const dismissed = useDismissed()
  const mode = useMode()
  const consented = useConsent()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const correlations = useMemo(
    () => findCorrelations(entries, meds, dismissed),
    [entries, meds, dismissed],
  )

  const grouped = useMemo(() => groupByDay(entries), [entries])

  function onDelete(id: string) {
    removeSymptom(id)
  }

  function onReset() {
    resetDemoData()
  }

  function onDismiss(c: Correlation) {
    dismissCorrelation(c)
  }

  async function onCopy(c: Correlation) {
    const days = entries
      .map((e) => e.occurredAt.slice(0, 10))
      .sort()
    const start = days[0] ?? new Date().toISOString().slice(0, 10)
    const end = new Date().toISOString().slice(0, 10)
    const block = buildCopyBlock(c, entries.length, start, end)
    try {
      await navigator.clipboard.writeText(block)
      const key = `${c.symptom}|${c.medicationId}|${c.scheduledTime}`
      setCopiedKey(key)
      setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), 2000)
    } catch {
      // Fallback: select-and-copy a hidden textarea
      const ta = document.createElement('textarea')
      ta.value = block
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
  }

  if (!consented) {
    return <ConsentModal />
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
            {correlations.map((c) => {
              const cKey = `${c.symptom}|${c.medicationId}|${c.scheduledTime}`
              const copied = copiedKey === cKey
              return (
                <article
                  key={cKey}
                  className={`insight-card insight-${c.confidence}`}
                >
                  <div className="insight-card-header">
                    <span className={`confidence-chip confidence-${c.confidence}`}>
                      {c.confidence}
                    </span>
                  </div>
                  <div className="insight-summary">{c.summary}</div>
                  <div className="insight-meta">
                    {c.matchedDays}/{c.observedDays} dose-days · ±
                    {c.windowMinutes} min window · lift {c.lift.toFixed(1)}×
                  </div>
                  <div className="insight-disclaimer">
                    self-reported pattern from your log. argus shows
                    co-occurrence, not cause. not medical advice.
                  </div>
                  <div className="insight-actions">
                    <button
                      type="button"
                      className="chip"
                      onClick={() => onCopy(c)}
                    >
                      {copied ? 'copied' : 'copy for doctor'}
                    </button>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => onDismiss(c)}
                      title="hide for 7 days; will resurface if it gets more frequent"
                    >
                      snooze 7d
                    </button>
                  </div>
                </article>
              )
            })}
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
