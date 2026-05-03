import type { SupplyAttachment } from '@/lib/chatTools'

interface Props {
  data: SupplyAttachment
}

function status(remaining: number, threshold: number): 'low' | 'watch' | 'ok' {
  if (remaining <= threshold) return 'low'
  if (remaining <= threshold * 1.5) return 'watch'
  return 'ok'
}

export default function SupplyCard({ data }: Props) {
  if (data.meds.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-title">supply</div>
        <div className="chart-empty">no meds on file yet.</div>
      </div>
    )
  }
  const max = Math.max(...data.meds.map((m) => Math.max(m.pillsRemaining, m.refillThreshold * 2, 1)))

  return (
    <div className="chart-card">
      <div className="chart-title">supply</div>
      <ul className="supply-list">
        {data.meds.map((m) => {
          const tag = status(m.pillsRemaining, m.refillThreshold)
          const pct = Math.min(100, (m.pillsRemaining / max) * 100)
          const thresholdPct = Math.min(100, (m.refillThreshold / max) * 100)
          return (
            <li key={m.id} className="supply-row">
              <div className="supply-row-head">
                <span className="supply-name">
                  {m.name} <span className="supply-dose">{m.dosage}</span>
                </span>
                <span className={`supply-tag supply-tag-${tag}`}>
                  {m.pillsRemaining} left · {m.refillsLeft} refill{m.refillsLeft === 1 ? '' : 's'}
                </span>
              </div>
              <div className="supply-bar-track">
                <div
                  className={`supply-bar-fill supply-bar-${tag}`}
                  style={{ width: `${pct}%` }}
                />
                <div
                  className="supply-bar-threshold"
                  style={{ left: `${thresholdPct}%` }}
                  title={`refill threshold: ${m.refillThreshold}`}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
