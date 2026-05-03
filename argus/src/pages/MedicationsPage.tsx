import { medications } from '../data/medications'
import type { Medication } from '../types'

function formatDate(iso: string | null) {
  if (!iso) return 'Ongoing'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function lowStock(med: Medication) {
  return med.pillsRemaining <= med.refillThreshold
}

export default function MedicationsPage() {
  return (
    <div className="meds">
      <header className="meds-header">
        <div>
          <h1 className="meds-title">Medications</h1>
          <p className="meds-subtitle">
            {medications.length} active prescriptions tracked by Argus.
          </p>
        </div>
      </header>

      <div className="meds-grid">
        {medications.map((med) => {
          const low = lowStock(med)
          return (
            <article key={med.id} className={`med-card${low ? ' med-card-low' : ''}`}>
              <div className="med-card-top">
                <div>
                  <h2 className="med-name">{med.name}</h2>
                  <div className="med-dosage">{med.dosage}</div>
                </div>
                <div className={`med-stock${low ? ' med-stock-low' : ''}`}>
                  <div className="med-stock-num">{med.pillsRemaining}</div>
                  <div className="med-stock-label">pills left</div>
                </div>
              </div>

              <dl className="med-details">
                <div className="med-row">
                  <dt>Prescribed</dt>
                  <dd>{formatDate(med.prescribedAt)}</dd>
                </div>
                <div className="med-row">
                  <dt>Frequency</dt>
                  <dd>{med.frequency}</dd>
                </div>
                <div className="med-row">
                  <dt>Stops</dt>
                  <dd>{formatDate(med.stopAt)}</dd>
                </div>
                <div className="med-row">
                  <dt>Prescriber</dt>
                  <dd>{med.prescriber}</dd>
                </div>
              </dl>

              <div className="med-times">
                <div className="med-times-label">Scheduled times</div>
                {med.scheduledTimes.length === 0 ? (
                  <div className="med-times-empty">As needed</div>
                ) : (
                  <div className="med-times-list">
                    {med.scheduledTimes.map((t) => (
                      <span key={t} className="time-pill">
                        {formatTime(t)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {med.notes && <p className="med-notes">{med.notes}</p>}

              {low && (
                <div className="med-alert">
                  Low stock — {med.refillsLeft > 0
                    ? `${med.refillsLeft} refill${med.refillsLeft === 1 ? '' : 's'} left at pharmacy.`
                    : 'no refills left, doctor approval needed.'}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
