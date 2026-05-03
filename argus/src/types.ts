export type Frequency =
  | 'Once daily'
  | 'Twice daily'
  | 'Three times daily'
  | 'Four times daily'
  | 'Every other day'
  | 'Weekly'
  | 'As needed'

export interface Medication {
  id: string
  name: string
  dosage: string
  prescribedAt: string
  startAt: string
  stopAt: string | null
  frequency: Frequency
  scheduledTimes: string[]
  pillsRemaining: number
  refillThreshold: number
  refillsLeft: number
  prescriber: string
  notes?: string
}

export type Severity = 'mild' | 'moderate' | 'severe'

export interface SymptomEntry {
  id: string
  occurredAt: string
  loggedAt: string
  symptom: string
  severity: Severity
  rawText: string
}

export interface Correlation {
  symptom: string
  medicationId: string
  medicationName: string
  windowMinutes: number
  matchedDays: number
  observedDays: number
  scheduledTime: string
  summary: string
}
