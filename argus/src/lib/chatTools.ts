import type { Confidence, Correlation, Medication, SymptomEntry } from '@/types'

export type ChartAttachment =
  | SupplyAttachment
  | SymptomsAttachment
  | ScheduleAttachment
  | CorrelationsAttachment

export interface SupplyAttachment {
  kind: 'supply'
  createdAt: string
  meds: Array<{
    id: string
    name: string
    dosage: string
    pillsRemaining: number
    refillThreshold: number
    refillsLeft: number
  }>
}

export interface SymptomsAttachment {
  kind: 'symptoms'
  createdAt: string
  days: number
  symptomFilter: string | null
  buckets: Array<{
    date: string
    label: string
    mild: number
    moderate: number
    severe: number
    total: number
  }>
}

export interface ScheduleAttachment {
  kind: 'schedule'
  createdAt: string
  date: string
  items: Array<{
    medId: string
    medName: string
    dosage: string
    time: string
    status: 'past' | 'upcoming'
  }>
}

export interface CorrelationsAttachment {
  kind: 'correlations'
  createdAt: string
  filter: Confidence | null
  items: Array<{
    symptom: string
    medicationName: string
    scheduledTime: string
    matchedDays: number
    observedDays: number
    confidence: Confidence
    summary: string
  }>
}

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function dateKey(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10)
}

function shortLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function buildSupplyAttachment(meds: Medication[]): SupplyAttachment {
  return {
    kind: 'supply',
    createdAt: new Date().toISOString(),
    meds: meds.map((m) => ({
      id: m.id,
      name: m.name,
      dosage: m.dosage,
      pillsRemaining: m.pillsRemaining,
      refillThreshold: m.refillThreshold,
      refillsLeft: m.refillsLeft,
    })),
  }
}

export function buildSymptomsAttachment(
  symptoms: SymptomEntry[],
  days: number,
  symptomFilter: string | null,
  today = new Date(),
): SymptomsAttachment {
  const safeDays = Math.max(1, Math.min(60, Math.floor(days)))
  const base = startOfDay(today)
  const buckets: SymptomsAttachment['buckets'] = []
  const counts: Record<string, { mild: number; moderate: number; severe: number }> = {}

  const filterLower = symptomFilter ? symptomFilter.toLowerCase() : null

  for (const s of symptoms) {
    if (filterLower && !s.symptom.toLowerCase().includes(filterLower)) continue
    const k = dateKey(new Date(s.occurredAt))
    if (!counts[k]) counts[k] = { mild: 0, moderate: 0, severe: 0 }
    counts[k][s.severity] += 1
  }

  for (let i = safeDays - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    const k = dateKey(d)
    const c = counts[k] ?? { mild: 0, moderate: 0, severe: 0 }
    buckets.push({
      date: k,
      label: shortLabel(d),
      mild: c.mild,
      moderate: c.moderate,
      severe: c.severe,
      total: c.mild + c.moderate + c.severe,
    })
  }

  return {
    kind: 'symptoms',
    createdAt: new Date().toISOString(),
    days: safeDays,
    symptomFilter: symptomFilter ?? null,
    buckets,
  }
}

export function buildScheduleAttachment(
  meds: Medication[],
  now = new Date(),
): ScheduleAttachment {
  const items: ScheduleAttachment['items'] = []
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  for (const m of meds) {
    for (const t of m.scheduledTimes) {
      const [h, mm] = t.split(':').map(Number)
      const total = h * 60 + mm
      items.push({
        medId: m.id,
        medName: m.name,
        dosage: m.dosage,
        time: t,
        status: total <= nowMinutes ? 'past' : 'upcoming',
      })
    }
  }
  items.sort((a, b) => a.time.localeCompare(b.time))

  return {
    kind: 'schedule',
    createdAt: new Date().toISOString(),
    date: dateKey(now),
    items,
  }
}

export function buildCorrelationsAttachment(
  correlations: Correlation[],
  filter: Confidence | null,
): CorrelationsAttachment {
  const items = correlations
    .filter((c) => (filter ? c.confidence === filter : true))
    .map((c) => ({
      symptom: c.symptom,
      medicationName: c.medicationName,
      scheduledTime: c.scheduledTime,
      matchedDays: c.matchedDays,
      observedDays: c.observedDays,
      confidence: c.confidence,
      summary: c.summary,
    }))
  return {
    kind: 'correlations',
    createdAt: new Date().toISOString(),
    filter: filter ?? null,
    items,
  }
}

// Gemini function-calling tool schemas. Argus does NOT pass real data to the
// model — these tools render UI from local state. The model only chooses
// which one to invoke and with what args.
export const CHAT_TOOL_DECLARATIONS = [
  {
    name: 'show_supply',
    description:
      "Render a card showing each medication's pills remaining vs refill threshold and refills left. Use when the user asks about supply, refills, how much they have left, or what's running low.",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'show_symptoms',
    description:
      'Render a chart of the user\'s logged symptoms over the last N days, optionally filtered to a single symptom. Use when the user asks to see their symptoms, headaches, dizziness, fatigue, etc., over time.',
    parameters: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'How many days back to chart. Default 7. Max 60.',
        },
        symptom: {
          type: 'string',
          description:
            'Optional. Filter to symptoms whose name contains this string (case-insensitive). E.g. "headache".',
        },
      },
    },
  },
  {
    name: 'show_schedule',
    description:
      "Render a timeline of today's scheduled medication doses, with each dose marked past or upcoming. Use when the user asks about today's schedule, what's next, or what they have coming up.",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'show_correlations',
    description:
      'Render a chart of detected co-occurrence patterns between symptoms and medications. Use when the user asks about patterns Argus has noticed.',
    parameters: {
      type: 'object',
      properties: {
        confidence: {
          type: 'string',
          enum: ['strong', 'consistent', 'suggestive'],
          description:
            'Optional. Show only patterns at this confidence tier.',
        },
      },
    },
  },
] as const

export type ChatToolName = (typeof CHAT_TOOL_DECLARATIONS)[number]['name']
