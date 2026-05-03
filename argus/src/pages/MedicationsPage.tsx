import { useState } from 'react'
import { medications as DEMO_MEDS } from '../data/medications'
import type { Medication } from '../types'
import { setMeds, useVault } from '@/lib/useVault'
import AddMedicationDialog from '@/components/AddMedicationDialog'

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
  // Only flag low-stock when both numbers are configured. A fresh entry with
  // pillsRemaining=0 and refillThreshold=0 isn't "low" — it's untracked.
  return med.refillThreshold > 0 && med.pillsRemaining > 0 && med.pillsRemaining <= med.refillThreshold
}

export default function MedicationsPage() {
  const { meds } = useVault()
  const [dialogOpen, setDialogOpen] = useState(false)

  if (meds.length === 0) {
    return (
      <div className="meds">
        <header className="meds-header">
          <div>
            <h1 className="meds-title">medications</h1>
            <p className="meds-subtitle">no prescriptions yet.</p>
          </div>
          <button
            type="button"
            className="meds-add-btn"
            onClick={() => setDialogOpen(true)}
          >
            + add medication
          </button>
        </header>

        <div className="meds-empty">
          <p>your vault is empty. add your meds, or load demo data to explore.</p>
          <div className="meds-empty-actions">
            <button
              type="button"
              className="meds-empty-action"
              onClick={() => setDialogOpen(true)}
            >
              add medication
            </button>
            <button
              type="button"
              className="meds-empty-action meds-empty-action-secondary"
              onClick={() => void setMeds(DEMO_MEDS)}
            >
              load demo data
            </button>
          </div>
        </div>

        <AddMedicationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      </div>
    )
  }

  return (
    <div className="meds">
      <header className="meds-header">
        <div>
          <h1 className="meds-title">medications</h1>
          <p className="meds-subtitle">
            {meds.length} active prescription{meds.length === 1 ? '' : 's'} tracked by argus.
          </p>
        </div>
        <button
          type="button"
          className="meds-add-btn"
          onClick={() => setDialogOpen(true)}
        >
          + add medication
        </button>
      </header>

      <div className="meds-grid">
        {meds.map((med) => {
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
                {med.stopAt && (
                  <div className="med-row">
                    <dt>Stops</dt>
                    <dd>{formatDate(med.stopAt)}</dd>
                  </div>
                )}
                {med.prescriber && (
                  <div className="med-row">
                    <dt>Prescriber</dt>
                    <dd>{med.prescriber}</dd>
                  </div>
                )}
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

      <AddMedicationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
