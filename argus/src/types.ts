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
