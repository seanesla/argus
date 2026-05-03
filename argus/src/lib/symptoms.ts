import { useEffect, useState } from 'react'
import { getMode, MODE_EVENT } from './mode'
import type {
  Confidence,
  Correlation,
  DismissedCorrelation,
  Medication,
  SymptomEntry,
} from '@/types'

const SYMPTOMS_EVENT = 'argus:symptoms-change'
const DISMISSED_EVENT = 'argus:dismissed-change'

function storageKey(): string {
  return getMode() === 'demo' ? 'argus.demo.symptoms' : 'argus.real.symptoms'
}

function dismissedKey(): string {
  return getMode() === 'demo'
    ? 'argus.demo.dismissed-correlations'
    : 'argus.real.dismissed-correlations'
}

export const LOOKBACK_DAYS = 14
export const WINDOW_MINUTES = 90
const MIN_MATCHED_DAYS = 5
const MIN_RATIO = 0.6
const MIN_LIFT = 2
const WILSON_LOWER_FLOOR = 0.35
const FDR_Q = 0.1
const MIN_LOOKBACK_DAYS_FOR_STRONG = 28
const SNOOZE_DEFAULT_DAYS = 7
const RESURFACE_RATIO = 1.5

export function loadSymptoms(): SymptomEntry[] {
  try {
    const raw = localStorage.getItem(storageKey())
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SymptomEntry[]) : []
  } catch {
    return []
  }
}

export function saveSymptoms(entries: SymptomEntry[]): void {
  localStorage.setItem(storageKey(), JSON.stringify(entries))
  window.dispatchEvent(new Event(SYMPTOMS_EVENT))
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
  localStorage.removeItem(storageKey())
  window.dispatchEvent(new Event(SYMPTOMS_EVENT))
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

// ---------------- Statistics helpers ----------------

function wilsonLower(k: number, n: number, z = 1.96): number {
  if (n === 0) return 0
  const p = k / n
  const denom = 1 + (z * z) / n
  const center = p + (z * z) / (2 * n)
  const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))
  return Math.max(0, (center - margin) / denom)
}

function binomCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  if (k === 0 || k === n) return 1
  k = Math.min(k, n - k)
  let c = 1
  for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1)
  return c
}

function binomPMF(k: number, n: number, p: number): number {
  if (p <= 0) return k === 0 ? 1 : 0
  if (p >= 1) return k === n ? 1 : 0
  return binomCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k)
}

function binomPGE(k: number, n: number, p: number): number {
  let total = 0
  for (let i = k; i <= n; i++) total += binomPMF(i, n, p)
  return Math.min(1, Math.max(0, total))
}

// Benjamini-Hochberg: returns indices of p-values that pass at level q.
function bhPass(pvals: number[], q: number): boolean[] {
  const n = pvals.length
  const order = pvals.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p)
  const pass = new Array(n).fill(false)
  let maxK = -1
  for (let rank = 0; rank < n; rank++) {
    if (order[rank].p <= ((rank + 1) / n) * q) maxK = rank
  }
  for (let rank = 0; rank <= maxK; rank++) pass[order[rank].i] = true
  return pass
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// ---------------- Copy templates (de-causalized) ----------------

const TEMPLATES: Record<Confidence, string[]> = {
  strong: [
    'You logged {symptom} on {matched} of {observed} days you took {med} at {time}, within ~{hours}h. Bring it up at your next visit.',
    '{matched} of {observed} {med} dose-days at {time} co-occurred with {symptom} (within ~{hours}h). Worth mentioning to your doctor.',
  ],
  consistent: [
    '{symptom} has co-occurred with {med} at {time} on {matched} of {observed} dose-days (within ~{hours}h). Argus is watching this.',
    'On {matched} of {observed} days you took {med} at {time}, you logged {symptom} within ~{hours}h.',
  ],
  suggestive: [
    'Early signal: {symptom} near your {time} {med} on {matched} of {observed} dose-days. Not enough data yet to say much.',
    'Possible co-occurrence: {symptom} within ~{hours}h of {time} {med} ({matched}/{observed} days). Argus will keep watching.',
  ],
}

function writeSummary(args: {
  symptom: string
  medName: string
  scheduledTime: string
  matched: number
  observed: number
  windowMinutes: number
  confidence: Confidence
  medicationId: string
}): string {
  const hours = (args.windowMinutes / 60).toFixed(args.windowMinutes % 60 === 0 ? 0 : 1)
  const pool = TEMPLATES[args.confidence]
  const idx = hashStr(`${args.symptom}|${args.medicationId}|${args.scheduledTime}`) % pool.length
  return pool[idx]
    .replaceAll('{symptom}', args.symptom)
    .replaceAll('{med}', args.medName)
    .replaceAll('{time}', formatTime(args.scheduledTime))
    .replaceAll('{matched}', String(args.matched))
    .replaceAll('{observed}', String(args.observed))
    .replaceAll('{hours}', hours)
}

// ---------------- Dismissed correlations ----------------

export function correlationKey(
  c: Pick<Correlation, 'symptom' | 'medicationId' | 'scheduledTime'>,
): string {
  return `${c.symptom}|${c.medicationId}|${c.scheduledTime}`
}

export function loadDismissed(): DismissedCorrelation[] {
  try {
    const raw = localStorage.getItem(dismissedKey())
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as DismissedCorrelation[]) : []
  } catch {
    return []
  }
}

function saveDismissed(list: DismissedCorrelation[]): void {
  localStorage.setItem(dismissedKey(), JSON.stringify(list))
  window.dispatchEvent(new Event(DISMISSED_EVENT))
}

export function dismissCorrelation(
  c: Correlation,
  days: number = SNOOZE_DEFAULT_DAYS,
): void {
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
  const baselineMatchRate =
    c.observedDays > 0 ? c.matchedDays / c.observedDays : 0
  const list = loadDismissed().filter(
    (d) => correlationKey(d) !== correlationKey(c),
  )
  list.push({
    symptom: c.symptom,
    medicationId: c.medicationId,
    scheduledTime: c.scheduledTime,
    until,
    baselineMatchRate,
  })
  saveDismissed(list)
}

export function useDismissed(): DismissedCorrelation[] {
  const [list, setList] = useState<DismissedCorrelation[]>(() => loadDismissed())
  useEffect(() => {
    const refresh = () => setList(loadDismissed())
    window.addEventListener(DISMISSED_EVENT, refresh)
    window.addEventListener(MODE_EVENT, refresh)
    return () => {
      window.removeEventListener(DISMISSED_EVENT, refresh)
      window.removeEventListener(MODE_EVENT, refresh)
    }
  }, [])
  return list
}

// ---------------- Correlation engine ----------------

interface RawCandidate {
  symptom: string
  medicationId: string
  medicationName: string
  scheduledTime: string
  matchedDayKeys: string[]
  observedDays: number
  matched: number
  pInWindow: number
  pOverall: number
  lift: number
  wLower: number
  pValue: number
  outOfWindowSymptomDays: number
  lookbackDaysCovered: number
}

export function findCorrelations(
  entries: SymptomEntry[],
  meds: Medication[],
  dismissed: DismissedCorrelation[] = [],
  today = new Date(),
): Correlation[] {
  if (entries.length === 0 || meds.length === 0) return []

  const days = lastNDays(LOOKBACK_DAYS, today)
  const symptoms = Array.from(new Set(entries.map((e) => e.symptom)))
  const candidates: RawCandidate[] = []

  // Days each symptom occurred at all (for pOverall baseline).
  const symptomDayKeys: Record<string, Set<string>> = {}
  for (const S of symptoms) {
    symptomDayKeys[S] = new Set(
      entries.filter((e) => e.symptom === S).map((e) => dateKey(e.occurredAt)),
    )
  }
  const lookbackKeys = new Set(days.map((d) => dateKey(d)))

  for (const med of meds) {
    if (med.scheduledTimes.length === 0) continue
    const doseDays = days.filter((d) => isMedActiveOn(med, d))
    if (doseDays.length === 0) continue

    for (const T of med.scheduledTimes) {
      for (const S of symptoms) {
        const matchedDays = doseDays.filter((day) => {
          const target = atTimeOnDay(day, T)
          return entries.some(
            (e) =>
              e.symptom === S &&
              dateKey(e.occurredAt) === dateKey(day) &&
              minutesBetween(new Date(e.occurredAt), target) <= WINDOW_MINUTES,
          )
        })
        const matched = matchedDays.length
        if (matched < MIN_MATCHED_DAYS) continue
        const ratio = matched / doseDays.length
        if (ratio < MIN_RATIO) continue

        const symptomDaysInLookback = Array.from(symptomDayKeys[S]).filter(
          (k) => lookbackKeys.has(k),
        )
        const pOverall = Math.max(
          symptomDaysInLookback.length / days.length,
          1 / days.length,
        )
        const lift = ratio / pOverall
        if (lift < MIN_LIFT) continue

        const wLower = wilsonLower(matched, doseDays.length)
        if (wLower < WILSON_LOWER_FLOOR) continue

        const pValue = binomPGE(matched, doseDays.length, pOverall)
        const matchedDayKeys = matchedDays.map((d) => dateKey(d))
        const outOfWindowSymptomDays = symptomDaysInLookback.filter(
          (k) => !matchedDayKeys.includes(k),
        ).length

        candidates.push({
          symptom: S,
          medicationId: med.id,
          medicationName: med.name,
          scheduledTime: T,
          matchedDayKeys,
          observedDays: doseDays.length,
          matched,
          pInWindow: ratio,
          pOverall,
          lift,
          wLower,
          pValue,
          outOfWindowSymptomDays,
          lookbackDaysCovered: doseDays.length,
        })
      }
    }
  }

  if (candidates.length === 0) return []

  // BH-FDR across all candidate cells.
  const fdrPass = bhPass(
    candidates.map((c) => c.pValue),
    FDR_Q,
  )
  let surviving = candidates.filter((_, i) => fdrPass[i])
  if (surviving.length === 0) return []

  // Dedupe overlapping doses: same (symptom, scheduledTime), different med,
  // ≥80% overlap in matched day-sets → collapse to one with med name "X or Y"
  // and confidence dropped one tier (cause is ambiguous).
  type Group = { key: string; members: RawCandidate[] }
  const groups = new Map<string, Group>()
  for (const c of surviving) {
    const k = `${c.symptom}|${c.scheduledTime}`
    const g = groups.get(k) ?? { key: k, members: [] }
    g.members.push(c)
    groups.set(k, g)
  }
  const mergedAmbiguous = new Set<RawCandidate>()
  const ambiguousMerges: RawCandidate[] = []
  for (const g of groups.values()) {
    if (g.members.length < 2) continue
    g.members.sort((a, b) => b.matched - a.matched)
    const seed = g.members[0]
    const seedSet = new Set(seed.matchedDayKeys)
    const overlapping = g.members.filter((m) => {
      if (m === seed) return true
      const inter = m.matchedDayKeys.filter((k) => seedSet.has(k)).length
      return inter / Math.max(seedSet.size, m.matchedDayKeys.length) >= 0.8
    })
    if (overlapping.length < 2) continue
    for (const m of overlapping) mergedAmbiguous.add(m)
    const names = Array.from(
      new Set(overlapping.map((m) => m.medicationName)),
    ).join(' or ')
    ambiguousMerges.push({ ...seed, medicationName: names })
  }
  surviving = surviving
    .filter((c) => !mergedAmbiguous.has(c))
    .concat(ambiguousMerges)

  // Filter out dismissed entries unless they have worsened past the
  // resurface threshold (current rate ≥ 1.5× baselineMatchRate).
  const now = Date.now()
  surviving = surviving.filter((c) => {
    const k = correlationKey(c)
    const d = dismissed.find((x) => correlationKey(x) === k)
    if (!d) return true
    if (new Date(d.until).getTime() < now) return true
    if (
      d.baselineMatchRate > 0 &&
      c.pInWindow >= d.baselineMatchRate * RESURFACE_RATIO
    ) {
      return true
    }
    return false
  })

  // Tier and finalize.
  const total = entries.length
  const out: Correlation[] = surviving.map((c) => {
    const ambiguous = c.medicationName.includes(' or ')
    let confidence: Confidence
    if (
      !ambiguous &&
      c.matched >= 6 &&
      c.wLower >= 0.55 &&
      c.lift >= 3 &&
      total >= MIN_LOOKBACK_DAYS_FOR_STRONG
    ) {
      confidence = 'strong'
    } else if (!ambiguous && c.matched >= 5 && c.wLower >= 0.4 && c.lift >= 2) {
      confidence = 'consistent'
    } else {
      confidence = 'suggestive'
    }
    if (ambiguous && confidence === 'strong') confidence = 'consistent'
    if (ambiguous && confidence === 'consistent') confidence = 'suggestive'

    return {
      symptom: c.symptom,
      medicationId: c.medicationId,
      medicationName: c.medicationName,
      windowMinutes: WINDOW_MINUTES,
      matchedDays: c.matched,
      observedDays: c.observedDays,
      scheduledTime: c.scheduledTime,
      summary: writeSummary({
        symptom: c.symptom,
        medName: c.medicationName,
        scheduledTime: c.scheduledTime,
        matched: c.matched,
        observed: c.observedDays,
        windowMinutes: WINDOW_MINUTES,
        confidence,
        medicationId: c.medicationId,
      }),
      confidence,
      wilsonLower: c.wLower,
      lift: c.lift,
      pOverall: c.pOverall,
      outOfWindowSymptomDays: c.outOfWindowSymptomDays,
      lookbackDaysCovered: c.lookbackDaysCovered,
    }
  })

  // Sort: strong first, then matched count.
  const tierRank = { strong: 0, consistent: 1, suggestive: 2 } as const
  out.sort((a, b) => {
    const t = tierRank[a.confidence] - tierRank[b.confidence]
    if (t !== 0) return t
    return b.matchedDays - a.matchedDays
  })
  return out
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
  // Real mode never auto-seeds — start empty.
  if (getMode() !== 'demo') return loadSymptoms()
  if (localStorage.getItem(storageKey()) !== null) return loadSymptoms()
  const seeded = seedDemoData()
  saveSymptoms(seeded)
  return seeded
}

export function resetDemoData(): SymptomEntry[] {
  const seeded = seedDemoData()
  saveSymptoms(seeded)
  return seeded
}

export function useSymptoms(): SymptomEntry[] {
  const [entries, setEntries] = useState<SymptomEntry[]>(() =>
    ensureSeededOnFirstLoad(),
  )
  useEffect(() => {
    const refresh = () => setEntries(ensureSeededOnFirstLoad())
    window.addEventListener(SYMPTOMS_EVENT, refresh)
    window.addEventListener(MODE_EVENT, refresh)
    return () => {
      window.removeEventListener(SYMPTOMS_EVENT, refresh)
      window.removeEventListener(MODE_EVENT, refresh)
    }
  }, [])
  return entries
}
