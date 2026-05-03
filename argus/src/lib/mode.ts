import { useEffect, useState } from 'react'

export type Mode = 'demo' | 'real'

const STORAGE_KEY = 'argus.mode'
const EVENT_NAME = 'argus:mode-change'

function isMode(value: unknown): value is Mode {
  return value === 'demo' || value === 'real'
}

export function getMode(): Mode {
  if (typeof window === 'undefined') return 'demo'
  const stored = localStorage.getItem(STORAGE_KEY)
  return isMode(stored) ? stored : 'demo'
}

export function setMode(m: Mode): void {
  localStorage.setItem(STORAGE_KEY, m)
  window.dispatchEvent(new CustomEvent<Mode>(EVENT_NAME, { detail: m }))
}

export function useMode(): Mode {
  const [mode, setModeState] = useState<Mode>(() => getMode())
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Mode>).detail
      if (isMode(detail)) setModeState(detail)
    }
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  }, [])
  return mode
}

export const MODE_EVENT = EVENT_NAME
