import { useEffect, useState } from 'react'
import { medications as DEMO_MEDICATIONS } from '@/data/medications'
import { getMode, MODE_EVENT } from './mode'
import type { Medication } from '@/types'

const MEDS_EVENT = 'argus:meds-change'

function storageKey(): string {
  return getMode() === 'demo' ? 'argus.demo.medications' : 'argus.real.medications'
}

export function loadMedications(): Medication[] {
  const k = storageKey()
  const raw = localStorage.getItem(k)
  if (raw === null) {
    // Demo namespace seeds itself on first read; real namespace stays empty.
    if (getMode() === 'demo') {
      saveMedications(DEMO_MEDICATIONS)
      return DEMO_MEDICATIONS
    }
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Medication[]) : []
  } catch {
    return []
  }
}

export function saveMedications(meds: Medication[]): void {
  localStorage.setItem(storageKey(), JSON.stringify(meds))
  window.dispatchEvent(new Event(MEDS_EVENT))
}

export function addMedication(m: Medication): Medication[] {
  const next = [...loadMedications(), m]
  saveMedications(next)
  return next
}

export function updateMedication(id: string, patch: Partial<Medication>): Medication[] {
  const next = loadMedications().map((m) => (m.id === id ? { ...m, ...patch } : m))
  saveMedications(next)
  return next
}

export function markDoseTaken(id: string): Medication[] {
  const next = loadMedications().map((m) =>
    m.id === id ? { ...m, pillsRemaining: Math.max(0, m.pillsRemaining - 1) } : m,
  )
  saveMedications(next)
  return next
}

export function removeMedication(id: string): Medication[] {
  const next = loadMedications().filter((m) => m.id !== id)
  saveMedications(next)
  return next
}

export function useMedications(): Medication[] {
  const [meds, setMeds] = useState<Medication[]>(() => loadMedications())
  useEffect(() => {
    const refresh = () => setMeds(loadMedications())
    window.addEventListener(MEDS_EVENT, refresh)
    window.addEventListener(MODE_EVENT, refresh)
    return () => {
      window.removeEventListener(MEDS_EVENT, refresh)
      window.removeEventListener(MODE_EVENT, refresh)
    }
  }, [])
  return meds
}
