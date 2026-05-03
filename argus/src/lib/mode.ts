import { useSyncExternalStore } from 'react'
import type { Pharmacy, UserProfile } from '@/types'
import { demoPharmacies } from '@/data/pharmacies'
import { demoUserProfile } from '@/data/userProfile'

export type Mode = 'demo' | 'real'

const MODE_KEY = 'argus.mode'
const REAL_PHARMACIES_KEY = 'argus.real.pharmacies'
const REAL_PROFILE_KEY = 'argus.real.userProfile'

const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage unavailable — silently no-op
  }
}

export function getMode(): Mode {
  if (typeof localStorage === 'undefined') return 'demo'
  const v = localStorage.getItem(MODE_KEY)
  return v === 'real' ? 'real' : 'demo'
}

export function setMode(mode: Mode) {
  try {
    localStorage.setItem(MODE_KEY, mode)
  } catch {
    // localStorage unavailable — silently no-op
  }
  emit()
}

export function getRealPharmacies(): Pharmacy[] {
  return readJson<Pharmacy[]>(REAL_PHARMACIES_KEY, [])
}

export function setRealPharmacies(pharmacies: Pharmacy[]) {
  writeJson(REAL_PHARMACIES_KEY, pharmacies)
  emit()
}

export function getRealUserProfile(): UserProfile | null {
  return readJson<UserProfile | null>(REAL_PROFILE_KEY, null)
}

export function setRealUserProfile(profile: UserProfile | null) {
  writeJson(REAL_PROFILE_KEY, profile)
  emit()
}

export function getActivePharmacies(): Pharmacy[] {
  return getMode() === 'demo' ? demoPharmacies : getRealPharmacies()
}

export function getActiveUserProfile(): UserProfile | null {
  return getMode() === 'demo' ? demoUserProfile : getRealUserProfile()
}

export function getActivePharmacy(id: string): Pharmacy | null {
  return getActivePharmacies().find((p) => p.id === id) ?? null
}

export function useMode(): Mode {
  return useSyncExternalStore(subscribe, getMode, () => 'demo')
}
