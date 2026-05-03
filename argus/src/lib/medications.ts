import { useEffect, useState } from 'react'
import { medications as DEMO_MEDICATIONS } from '@/data/medications'
import { getMode, MODE_EVENT, useMode } from './mode'
import {
  addMed,
  getMedsSnapshot,
  removeMed,
  updateMed,
  useVault,
} from './useVault'
import type { Medication } from '@/types'

// In demo mode meds live in plaintext localStorage (so the demo experience
// works without setting up a vault). In real mode they live in the encrypted
// vault and are accessed through the useVault store.

const DEMO_KEY = 'argus.demo.medications'
const MEDS_EVENT = 'argus:meds-change'

function loadDemo(): Medication[] {
  const raw = localStorage.getItem(DEMO_KEY)
  if (raw === null) {
    saveDemo(DEMO_MEDICATIONS)
    return DEMO_MEDICATIONS
  }
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Medication[]) : []
  } catch {
    return []
  }
}

function saveDemo(meds: Medication[]): void {
  localStorage.setItem(DEMO_KEY, JSON.stringify(meds))
  window.dispatchEvent(new Event(MEDS_EVENT))
}

export function loadMedications(): Medication[] {
  if (getMode() === 'real') return getMedsSnapshot()
  return loadDemo()
}

export function saveMedications(meds: Medication[]): void {
  // Real mode persists through the vault; callers that want to bulk-set in
  // real mode should go through useVault's setMeds. Demo mode is a plain
  // overwrite.
  if (getMode() === 'real') return
  saveDemo(meds)
}

export async function addMedication(m: Medication): Promise<void> {
  if (getMode() === 'real') {
    await addMed(m)
    return
  }
  saveDemo([...loadDemo(), m])
}

export async function updateMedication(
  id: string,
  patch: Partial<Medication>,
): Promise<void> {
  if (getMode() === 'real') {
    const cur = getMedsSnapshot().find((m) => m.id === id)
    if (!cur) return
    await updateMed({ ...cur, ...patch })
    return
  }
  saveDemo(loadDemo().map((m) => (m.id === id ? { ...m, ...patch } : m)))
}

export async function markDoseTaken(id: string): Promise<void> {
  if (getMode() === 'real') {
    const cur = getMedsSnapshot().find((m) => m.id === id)
    if (!cur) return
    await updateMed({
      ...cur,
      pillsRemaining: Math.max(0, cur.pillsRemaining - 1),
    })
    return
  }
  saveDemo(
    loadDemo().map((m) =>
      m.id === id
        ? { ...m, pillsRemaining: Math.max(0, m.pillsRemaining - 1) }
        : m,
    ),
  )
}

export async function removeMedication(id: string): Promise<void> {
  if (getMode() === 'real') {
    await removeMed(id)
    return
  }
  saveDemo(loadDemo().filter((m) => m.id !== id))
}

export function useMedications(): Medication[] {
  const mode = useMode()
  const vaultState = useVault()
  const [demoMeds, setDemoMeds] = useState<Medication[]>(() =>
    getMode() === 'demo' ? loadDemo() : [],
  )
  useEffect(() => {
    const refresh = () => setDemoMeds(getMode() === 'demo' ? loadDemo() : [])
    window.addEventListener(MEDS_EVENT, refresh)
    window.addEventListener(MODE_EVENT, refresh)
    return () => {
      window.removeEventListener(MEDS_EVENT, refresh)
      window.removeEventListener(MODE_EVENT, refresh)
    }
  }, [])
  return mode === 'real' ? vaultState.meds : demoMeds
}
