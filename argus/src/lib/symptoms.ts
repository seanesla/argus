import type { Correlation, Medication, SymptomEntry } from '@/types'

export const STORAGE_KEY = 'argus.symptoms'

export const LOOKBACK_DAYS = 14
export const WINDOW_MINUTES = 90
const MIN_MATCHED_DAYS = 3
const MIN_RATIO = 0.5

export function loadSymptoms(): SymptomEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SymptomEntry[]) : []
  } catch {
    return []
  }
}

export function saveSymptoms(entries: SymptomEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function addSymptoms(newEntries: SymptomEntry[]): SymptomEntry[] {
  const merged = [...loadSymptoms(), ...newEntries]
  saveSymptoms(merged)
  return merged
}

export function removeSymptom(id: string): SymptomEntry[] {
  const next = loadSymptoms().filter((e) => e.id !== id)
  saveSymptoms(next)
  return next
}

export function clearSymptoms(): void {
  localStorage.removeItem(STORAGE_KEY)
}

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function dateKey(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return startOfDay(d).toISOString().slice(0, 10)
}

function atTimeOnDay(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const c = new Date(day)
  c.setHours(h, m, 0, 0)
  return c
}

function minutesBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 60000
}

function lastNDays(n: number, today = new Date()): Date[] {
  const days: Date[] = []
  const base = startOfDay(today)
  for (let i = 0; i < n; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    days.push(d)
  }
  return days
}

function isMedActiveOn(med: Medication, day: Date): boolean {
  const start = startOfDay(new Date(med.startAt))
  if (day < start) return false
  if (med.stopAt) {
    const stop = startOfDay(new Date(med.stopAt))
    if (day > stop) return false
  }
  return true
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`
}

function writeSummary(args: {
  symptom: string
  medName: string
  scheduledTime: string
  matched: number
  observed: number
  windowMinutes: number
}): string {
  const hours = (args.windowMinutes / 60).toFixed(args.windowMinutes % 60 === 0 ? 0 : 1)
  return `Your ${args.symptom} shows up within ${hours} hour${hours === '1' ? '' : 's'} of your ${formatTime(args.scheduledTime)} ${args.medName} ${args.matched} of the last ${args.observed} days — worth flagging.`
}

export function findCorrelations(
  entries: SymptomEntry[],
  meds: Medication[],
  today = new Date(),
): Correlation[] {
  if (entries.length === 0 || meds.length === 0) return []

  const days = lastNDays(LOOKBACK_DAYS, today)
  const symptoms = Array.from(new Set(entries.map((e) => e.symptom)))
  const results: Correlation[] = []

  for (const med of meds) {
    if (med.scheduledTimes.length === 0) continue

    const doseDays = days.filter((d) => isMedActiveOn(med, d))
    if (doseDays.length === 0) continue

    for (const T of med.scheduledTimes) {
      for (const S of symptoms) {
        const matched = doseDays.filter((day) => {
          const target = atTimeOnDay(day, T)
          return entries.some(
            (e) =>
              e.symptom === S &&
              dateKey(e.occurredAt) === dateKey(day) &&
              minutesBetween(new Date(e.occurredAt), target) <= WINDOW_MINUTES,
          )
        })

        if (
          matched.length >= MIN_MATCHED_DAYS &&
          matched.length / doseDays.length >= MIN_RATIO
        ) {
          results.push({
            symptom: S,
            medicationId: med.id,
            medicationName: med.name,
            windowMinutes: WINDOW_MINUTES,
            matchedDays: matched.length,
            observedDays: doseDays.length,
            scheduledTime: T,
            summary: writeSummary({
              symptom: S,
              medName: med.name,
              scheduledTime: T,
              matched: matched.length,
              observed: doseDays.length,
              windowMinutes: WINDOW_MINUTES,
            }),
          })
        }
      }
    }
  }

  results.sort((a, b) => b.matchedDays - a.matchedDays)
  return results.slice(0, 3)
}

function makeEntry(
  occurredAt: Date,
  symptom: string,
  severity: SymptomEntry['severity'],
  rawText: string,
): SymptomEntry {
  return {
    id: crypto.randomUUID(),
    occurredAt: occurredAt.toISOString(),
    loggedAt: new Date().toISOString(),
    symptom,
    severity,
    rawText,
  }
}

export function seedDemoData(today = new Date()): SymptomEntry[] {
  const base = startOfDay(today)
  const dayOff = (offset: number, hhmm: string): Date => {
    const d = new Date(base)
    d.setDate(base.getDate() + offset)
    const [h, m] = hhmm.split(':').map(Number)
    d.setHours(h, m, 0, 0)
    return d
  }
  return [
    makeEntry(dayOff(-6, '08:45'), 'dizziness', 'mild', 'felt a bit dizzy after my morning meds'),
    makeEntry(dayOff(-5, '09:10'), 'dizziness', 'mild', 'lightheaded around 9'),
    makeEntry(dayOff(-4, '14:30'), 'nausea', 'mild', 'queasy in the afternoon'),
    makeEntry(dayOff(-3, '08:30'), 'dizziness', 'moderate', 'pretty dizzy this morning'),
    makeEntry(dayOff(-3, '22:00'), 'fatigue', 'mild', 'tired before bed'),
    makeEntry(dayOff(-1, '09:00'), 'dizziness', 'mild', 'morning dizziness again'),
    makeEntry(dayOff(-1, '15:00'), 'headache', 'mild', 'mild headache mid afternoon'),
    makeEntry(dayOff(0, '08:20'), 'dizziness', 'mild', 'dizzy after breakfast'),
  ]
}

export function ensureSeededOnFirstLoad(): SymptomEntry[] {
  if (localStorage.getItem(STORAGE_KEY) !== null) return loadSymptoms()
  const seeded = seedDemoData()
  saveSymptoms(seeded)
  return seeded
}

export function resetDemoData(): SymptomEntry[] {
  const seeded = seedDemoData()
  saveSymptoms(seeded)
  return seeded
}
