import { useEffect, useRef, useState } from 'react'
import {
  extractMedicationFromImage,
  isGeminiConfigured,
  type ExtractedMedication,
} from '@/lib/gemini'
import { addMed } from '@/lib/useVault'
import type { Frequency, Medication } from '@/types'

interface Draft {
  name: string
  dosage: string
  frequency: Frequency
  scheduledTimesText: string
  prescribedAt: string
  stopAt: string
  pillsRemaining: string
  refillThreshold: string
  refillsLeft: string
  prescriber: string
  notes: string
}

const FREQUENCIES: Frequency[] = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every other day',
  'Weekly',
  'As needed',
]

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyDraft(): Draft {
  return {
    name: '',
    dosage: '',
    frequency: 'Once daily',
    scheduledTimesText: '',
    prescribedAt: todayISO(),
    stopAt: '',
    pillsRemaining: '',
    refillThreshold: '0',
    refillsLeft: '0',
    prescriber: '',
    notes: '',
  }
}

function matchFrequency(s: string | undefined): Frequency | undefined {
  if (!s) return undefined
  const norm = s.toLowerCase().trim()
  return FREQUENCIES.find((f) => f.toLowerCase() === norm)
}

function draftToMedication(d: Draft): Medication {
  const scheduledTimes = d.scheduledTimesText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const prescribedAt = d.prescribedAt || todayISO()
  return {
    id: crypto.randomUUID(),
    name: d.name.trim(),
    dosage: d.dosage.trim(),
    frequency: d.frequency,
    scheduledTimes,
    prescribedAt,
    startAt: prescribedAt,
    stopAt: d.stopAt || null,
    pillsRemaining: Number(d.pillsRemaining) || 0,
    refillThreshold: Number(d.refillThreshold) || 0,
    refillsLeft: Number(d.refillsLeft) || 0,
    prescriber: d.prescriber.trim(),
    notes: d.notes.trim() || undefined,
  }
}

function extractedToMedication(e: ExtractedMedication): Medication {
  const prescribedAt = e.prescribedAt || todayISO()
  return {
    id: crypto.randomUUID(),
    name: e.name?.trim() || 'unnamed medication',
    dosage: e.dosage?.trim() || '',
    frequency: matchFrequency(e.frequency) ?? 'Once daily',
    scheduledTimes: e.scheduledTimes ?? [],
    prescribedAt,
    startAt: prescribedAt,
    stopAt: null,
    pillsRemaining: e.pillsRemaining ?? 0,
    refillThreshold: 0,
    refillsLeft: e.refillsLeft ?? 0,
    prescriber: e.prescriber?.trim() ?? '',
    notes: e.notes?.trim() || undefined,
  }
}

interface Props {
  open: boolean
  onClose: () => void
}

type Mode = 'manual' | 'photo'

export default function AddMedicationDialog({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<Mode>('manual')
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  useEffect(() => {
    if (!open) {
      setMode('manual')
      setDraft(emptyDraft())
      setImageFile(null)
      setImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setError(null)
      setBusy(false)
    }
  }, [open])

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageFile(file)
    setImageUrl(file ? URL.createObjectURL(file) : null)
    setError(null)
  }

  async function onPhotoSubmit() {
    if (!imageFile || busy) return
    setBusy(true)
    setError(null)
    try {
      const extracted = await extractMedicationFromImage(imageFile)
      await addMed(extractedToMedication(extracted))
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function onManualSubmit() {
    if (busy) return
    if (!draft.name.trim()) {
      setError('medication needs a name')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await addMed(draftToMedication(draft))
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="med-dialog"
      onClose={onClose}
      onCancel={onClose}
    >
      <form
        className="med-dialog-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (mode === 'photo') void onPhotoSubmit()
          else void onManualSubmit()
        }}
      >
        <header className="med-dialog-header">
          <h2 className="med-dialog-title">add medication</h2>
          <button
            type="button"
            className="med-dialog-close"
            onClick={onClose}
            aria-label="close"
          >
            ✕
          </button>
        </header>

        <div className="med-dialog-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'manual'}
            className={`med-dialog-tab${mode === 'manual' ? ' is-active' : ''}`}
            onClick={() => {
              setMode('manual')
              setError(null)
            }}
          >
            manual
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'photo'}
            className={`med-dialog-tab${mode === 'photo' ? ' is-active' : ''}`}
            onClick={() => {
              setMode('photo')
              setError(null)
            }}
          >
            from photo
          </button>
        </div>

        {mode === 'photo' ? (
          <section className="med-dialog-body med-dialog-photo">
            {!isGeminiConfigured && (
              <p className="med-dialog-warn">
                gemini is not configured. add VITE_GEMINI_API_KEY to argus/.env.local
                to use photo extraction.
              </p>
            )}

            <p className="med-dialog-hint">
              upload a photo of the prescription label or pill bottle. argus reads it
              and adds it to your list.
            </p>

            <label className="med-dialog-file">
              <input
                type="file"
                accept="image/*"
                onChange={onPickFile}
                disabled={!isGeminiConfigured || busy}
              />
              <span>{imageFile ? imageFile.name : 'choose image…'}</span>
            </label>

            {imageUrl && (
              <img
                src={imageUrl}
                alt="prescription preview"
                className="med-dialog-preview"
              />
            )}

            {error && <p className="med-dialog-error">{error}</p>}
          </section>
        ) : (
          <fieldset className="med-dialog-body med-dialog-fields" disabled={busy}>
            <label className="field">
              <span>name</span>
              <input
                value={draft.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="lisinopril"
              />
            </label>

            <label className="field">
              <span>dosage</span>
              <input
                value={draft.dosage}
                onChange={(e) => update('dosage', e.target.value)}
                placeholder="10 mg"
              />
            </label>

            <label className="field">
              <span>frequency</span>
              <select
                value={draft.frequency}
                onChange={(e) => update('frequency', e.target.value as Frequency)}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>scheduled times</span>
              <input
                value={draft.scheduledTimesText}
                onChange={(e) => update('scheduledTimesText', e.target.value)}
                placeholder="08:00, 20:00"
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span>prescribed</span>
                <input
                  type="date"
                  value={draft.prescribedAt}
                  onChange={(e) => update('prescribedAt', e.target.value)}
                />
              </label>
              <label className="field">
                <span>stops</span>
                <input
                  type="date"
                  value={draft.stopAt}
                  onChange={(e) => update('stopAt', e.target.value)}
                />
              </label>
            </div>

            <div className="field-row">
              <label className="field">
                <span>pills left</span>
                <input
                  type="number"
                  min="0"
                  value={draft.pillsRemaining}
                  onChange={(e) => update('pillsRemaining', e.target.value)}
                  placeholder="0"
                />
              </label>
              <label className="field">
                <span>refill threshold</span>
                <input
                  type="number"
                  min="0"
                  value={draft.refillThreshold}
                  onChange={(e) => update('refillThreshold', e.target.value)}
                />
              </label>
              <label className="field">
                <span>refills left</span>
                <input
                  type="number"
                  min="0"
                  value={draft.refillsLeft}
                  onChange={(e) => update('refillsLeft', e.target.value)}
                />
              </label>
            </div>

            <label className="field">
              <span>prescriber</span>
              <input
                value={draft.prescriber}
                onChange={(e) => update('prescriber', e.target.value)}
                placeholder="dr. patel"
              />
            </label>

            <label className="field">
              <span>notes</span>
              <textarea
                value={draft.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="take with water, morning"
                rows={2}
              />
            </label>

            {error && <p className="med-dialog-error">{error}</p>}
          </fieldset>
        )}

        <footer className="med-dialog-footer">
          <button type="button" className="med-dialog-cancel" onClick={onClose}>
            cancel
          </button>
          {mode === 'photo' ? (
            <button
              type="submit"
              className="med-dialog-save"
              disabled={busy || !imageFile || !isGeminiConfigured}
            >
              {busy ? 'reading & adding…' : 'extract & add'}
            </button>
          ) : (
            <button type="submit" className="med-dialog-save" disabled={busy}>
              {busy ? 'saving…' : 'save medication'}
            </button>
          )}
        </footer>
      </form>
    </dialog>
  )
}
