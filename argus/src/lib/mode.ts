import { useEffect, useState } from 'react'
import type { Pharmacy, UserProfile } from '@/types'
import { demoPharmacies } from '@/data/pharmacies'
import { demoUserProfile } from '@/data/userProfile'

export type Mode = 'demo' | 'real'

const STORAGE_KEY = 'argus.mode'
const REAL_PHARMACIES_KEY = 'argus.real.pharmacies'
const REAL_PROFILE_KEY = 'argus.real.userProfile'
const EVENT_NAME = 'argus:mode-change'

function isMode(value: unknown): value is Mode {
  return value === 'demo' || value === 'real'
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

function emitChange(detail?: Mode) {
  window.dispatchEvent(new CustomEvent<Mode | undefined>(EVENT_NAME, { detail }))
}

export function getMode(): Mode {
  if (typeof window === 'undefined') return 'demo'
  const stored = localStorage.getItem(STORAGE_KEY)
  return isMode(stored) ? stored : 'demo'
}

export function setMode(m: Mode): void {
  localStorage.setItem(STORAGE_KEY, m)
  emitChange(m)
}

export function getRealPharmacies(): Pharmacy[] {
  return readJson<Pharmacy[]>(REAL_PHARMACIES_KEY, [])
}

export function setRealPharmacies(pharmacies: Pharmacy[]) {
  writeJson(REAL_PHARMACIES_KEY, pharmacies)
  emitChange()
}

export function getRealUserProfile(): UserProfile | null {
  return readJson<UserProfile | null>(REAL_PROFILE_KEY, null)
}

export function setRealUserProfile(profile: UserProfile | null) {
  writeJson(REAL_PROFILE_KEY, profile)
  emitChange()
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
  const [mode, setModeState] = useState<Mode>(() => getMode())
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Mode | undefined>).detail
      if (isMode(detail)) setModeState(detail)
      else setModeState(getMode())
    }
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  }, [])
  return mode
}

export const MODE_EVENT = EVENT_NAME
