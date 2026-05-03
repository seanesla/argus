import { useEffect, useMemo, useState } from 'react'
import { medications } from '../data/medications'
import type { Medication } from '../types'

const STORAGE_PREFIX = 'argus.checklist.'

function todayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function isActiveToday(med: Medication, todayIso: string) {
  if (med.scheduledTimes.length === 0) return false
  if (med.startAt && todayIso < med.startAt) return false
  if (med.stopAt && todayIso > med.stopAt) return false
  return true
}

type Checked = Record<string, boolean>

export default function DailyChecklist() {
  const dayKey = todayKey()
  const storageKey = STORAGE_PREFIX + dayKey

  const activeMeds = useMemo(
    () => medications.filter((m) => isActiveToday(m, dayKey)),
    [dayKey],
  )

  const [checked, setChecked] = useState<Checked>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as Checked) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checked))
    } catch {
      /* ignore quota errors */
    }
  }, [checked, storageKey])

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const totalDoses = activeMeds.reduce((n, m) => n + m.scheduledTimes.length, 0)
  const takenDoses = activeMeds.reduce(
    (n, m) =>
      n +
      m.scheduledTimes.filter((t) => checked[`${m.id}@${t}`]).length,
    0,
  )

  return (
    <div className="checklist">
      <div className="checklist-head">
        <span className="checklist-label">today</span>
        <span className="checklist-count">
          {takenDoses}/{totalDoses}
        </span>
      </div>

      {activeMeds.length === 0 ? (
        <div className="checklist-empty">no scheduled doses</div>
      ) : (
        <ul className="checklist-list">
          {activeMeds.map((med) => (
            <li key={med.id} className="checklist-item">
              <div className="checklist-name">
                <span className="checklist-med">{med.name}</span>
                <span className="checklist-dose">{med.dosage}</span>
              </div>
              <div className="checklist-boxes">
                {med.scheduledTimes.map((t) => {
                  const key = `${med.id}@${t}`
                  const isOn = !!checked[key]
                  return (
                    <label
                      key={key}
                      className={`checklist-box${isOn ? ' is-on' : ''}`}
                      title={formatTime(t)}
                    >
                      <input
                        type="checkbox"
                        checked={isOn}
                        onChange={() => toggle(key)}
                      />
                      <span className="checklist-time">{formatTime(t)}</span>
                    </label>
                  )
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
