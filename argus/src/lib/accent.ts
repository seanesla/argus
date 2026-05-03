import { useEffect, useState } from 'react'

export const ACCENTS = ['brass', 'iris', 'monitor', 'sakura', 'lichen', 'ember'] as const
export type Accent = (typeof ACCENTS)[number]

export const ACCENT_HEX: Record<Accent, string> = {
  brass: '#c89b3c',
  iris: '#8b6dba',
  monitor: '#3a8d8a',
  sakura: '#c98a8a',
  lichen: '#7a9472',
  ember: '#d97757',
}

const STORAGE_KEY = 'argus.accent'
const EVENT_NAME = 'argus:accent-change'

function isAccent(value: unknown): value is Accent {
  return typeof value === 'string' && (ACCENTS as readonly string[]).includes(value)
}

export function getStoredAccent(): Accent {
  if (typeof window === 'undefined') return 'brass'
  const stored = localStorage.getItem(STORAGE_KEY)
  return isAccent(stored) ? stored : 'brass'
}

export function applyAccentClass(a: Accent) {
  const root = document.documentElement
  ACCENTS.forEach((x) => root.classList.remove(`accent-${x}`))
  root.classList.add(`accent-${a}`)
}

export function setAccent(a: Accent) {
  applyAccentClass(a)
  localStorage.setItem(STORAGE_KEY, a)
  window.dispatchEvent(new CustomEvent<Accent>(EVENT_NAME, { detail: a }))
}

export function useAccent(): Accent {
  const [accent, setAccentState] = useState<Accent>(() => getStoredAccent())

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Accent>).detail
      if (isAccent(detail)) setAccentState(detail)
    }
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  }, [])

  return accent
}
