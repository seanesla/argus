import { useState } from 'react'
import type { Frequency, Medication } from '@/types'

const FREQUENCIES: Frequency[] = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every other day',
  'Weekly',
  'As needed',
]

interface Props {
  initial?: Medication
  onSave: (m: Medication) => void
  onCancel: () => void
}

const HHMM = /^\d{2}:\d{2}$/

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function parseTimes(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => HHMM.test(s))
}

export default function MedicationForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [dosage, setDosage] = useState(initial?.dosage ?? '')
  const [frequency, setFrequency] = useState<Frequency>(
    initial?.frequency ?? 'Once daily',
  )
  const [scheduledTimes, setScheduledTimes] = useState(
    initial?.scheduledTimes.join(', ') ?? '08:00',
  )
  const [pillsRemaining, setPillsRemaining] = useState(
    String(initial?.pillsRemaining ?? 30),
  )
  const [refillThreshold, setRefillThreshold] = useState(
    String(initial?.refillThreshold ?? 7),
  )
  const [refillsLeft, setRefillsLeft] = useState(
    String(initial?.refillsLeft ?? 0),
  )
  const [prescriber, setPrescriber] = useState(initial?.prescriber ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !dosage.trim()) return
    const times = frequency === 'As needed' ? [] : parseTimes(scheduledTimes)
    const med: Medication = {
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      dosage: dosage.trim(),
      prescribedAt: initial?.prescribedAt ?? todayISO(),
      startAt: initial?.startAt ?? todayISO(),
      stopAt: initial?.stopAt ?? null,
      frequency,
      scheduledTimes: times,
      pillsRemaining: Math.max(0, Number(pillsRemaining) || 0),
      refillThreshold: Math.max(0, Number(refillThreshold) || 0),
      refillsLeft: Math.max(0, Number(refillsLeft) || 0),
      prescriber: prescriber.trim() || 'Unknown',
      notes: notes.trim() || undefined,
    }
    onSave(med)
  }

  return (
    <form className="med-form" onSubmit={onSubmit}>
      <div className="med-form-title">
        {initial ? 'edit medication' : 'add medication'}
      </div>

      <div className="med-form-grid">
        <label className="med-form-field">
          <span>name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lisinopril"
            autoFocus
            required
          />
        </label>

        <label className="med-form-field">
          <span>dosage</span>
          <input
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="e.g. 10 mg"
            required
          />
        </label>

        <label className="med-form-field">
          <span>frequency</span>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <label className="med-form-field">
          <span>scheduled times (HH:MM, comma-separated)</span>
          <input
            value={scheduledTimes}
            onChange={(e) => setScheduledTimes(e.target.value)}
            placeholder="08:00, 20:00"
            disabled={frequency === 'As needed'}
          />
        </label>

        <label className="med-form-field">
          <span>pills remaining</span>
          <input
            type="number"
            min="0"
            value={pillsRemaining}
            onChange={(e) => setPillsRemaining(e.target.value)}
          />
        </label>

        <label className="med-form-field">
          <span>refill threshold</span>
          <input
            type="number"
            min="0"
            value={refillThreshold}
            onChange={(e) => setRefillThreshold(e.target.value)}
          />
        </label>

        <label className="med-form-field">
          <span>refills left</span>
          <input
            type="number"
            min="0"
            value={refillsLeft}
            onChange={(e) => setRefillsLeft(e.target.value)}
          />
        </label>

        <label className="med-form-field">
          <span>prescriber</span>
          <input
            value={prescriber}
            onChange={(e) => setPrescriber(e.target.value)}
            placeholder="e.g. Dr. Patel"
          />
        </label>

        <label className="med-form-field med-form-field-wide">
          <span>notes</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="optional"
          />
        </label>
      </div>

      <div className="med-form-actions">
        <button type="button" className="chip" onClick={onCancel}>
          cancel
        </button>
        <button
          type="submit"
          className="composer-send"
          disabled={!name.trim() || !dosage.trim()}
        >
          {initial ? 'save changes' : 'add medication'}
        </button>
      </div>
    </form>
  )
}
