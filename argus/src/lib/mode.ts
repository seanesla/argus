import { useSyncExternalStore } from 'react'
import type { Pharmacy, UserProfile } from '@/types'
import { demoPharmacies } from '@/data/pharmacies'
import { demoUserProfile } from '@/data/userProfile'

export type Mode = 'demo' | 'real'

const MODE_KEY = 'argus.mode'
const REAL_PHARMACIES_KEY = 'argus.real.pharmacies'
const REAL_PROFILE_KEY = 'argus.real.userProfile'

export const MODE_EVENT = 'argus:mode-change'

const listeners = new Set<() => void>()

function emit(mode: Mode) {
  for (const l of listeners) l()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<Mode>(MODE_EVENT, { detail: mode }))
  }
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

function isMode(value: unknown): value is Mode {
  return value === 'demo' || value === 'real'
}

export function getMode(): Mode {
  if (typeof localStorage === 'undefined') return 'demo'
  const v = localStorage.getItem(MODE_KEY)
  return isMode(v) ? v : 'demo'
}

export function setMode(mode: Mode) {
  try {
    localStorage.setItem(MODE_KEY, mode)
  } catch {
    // localStorage unavailable — silently no-op
  }
  emit(mode)
}

export function getRealPharmacies(): Pharmacy[] {
  return readJson<Pharmacy[]>(REAL_PHARMACIES_KEY, [])
}

export function setRealPharmacies(pharmacies: Pharmacy[]) {
  writeJson(REAL_PHARMACIES_KEY, pharmacies)
  emit(getMode())
}

export function getRealUserProfile(): UserProfile | null {
  return readJson<UserProfile | null>(REAL_PROFILE_KEY, null)
}

export function setRealUserProfile(profile: UserProfile | null) {
  writeJson(REAL_PROFILE_KEY, profile)
  emit(getMode())
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
