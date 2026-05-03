import { useEffect, useState } from 'react'

const CONSENT_KEY = 'argus.consent.v1'
const CONSENT_EVENT = 'argus:consent-change'

export function hasConsent(): boolean {
  return localStorage.getItem(CONSENT_KEY) === 'granted'
}

export function grantConsent(): void {
  localStorage.setItem(CONSENT_KEY, 'granted')
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

export function useConsent(): boolean {
  const [granted, setGranted] = useState<boolean>(() => hasConsent())
  useEffect(() => {
    const refresh = () => setGranted(hasConsent())
    window.addEventListener(CONSENT_EVENT, refresh)
    return () => window.removeEventListener(CONSENT_EVENT, refresh)
  }, [])
  return granted
}
