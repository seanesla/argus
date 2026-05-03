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
  pharmacyId: string
  rxNumber: string
  notes?: string
}

export interface Pharmacy {
  id: string
  name: string
  email: string | null
  phone: string | null
  portalUrl: string | null
}

export interface UserProfile {
  fullName: string
  dateOfBirth: string
  contactEmail: string
  phone: string | null
}
