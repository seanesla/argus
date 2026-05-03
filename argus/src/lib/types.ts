export type Medication = {
  id: string
  name: string
  dosage: string                    // "10mg"
  schedule: string[]                // ["08:00", "20:00"] in 24h local time
  pillsRemaining: number
  refillThresholdDays: number       // alert when daysLeft < this
  prescriber?: string
  pharmacy?: string
  pharmacyEmail?: string
  notes?: string                    // "take with food"
}

export type DoseLog = {
  id: string
  medId: string
  takenAt: string                   // ISO 8601 UTC
  withFood: boolean
  skipped: boolean
  notes?: string
}

export type SymptomLog = {
  id: string
  loggedAt: string                  // ISO 8601 UTC
  symptom: string                   // "headache"
  severity: 1 | 2 | 3 | 4 | 5
  notes?: string
}

export type Insight = {
  title: string
  description: string
  confidence: number                // 0-1
  evidence: { date: string; doseEntry: string; symptomEntry: string }[]
  suggestion: string
}

export type RefillDraft = {
  medId: string
  medName: string
  daysLeft: number
  subject: string
  body: string
}
