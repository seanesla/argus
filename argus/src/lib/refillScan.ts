import type { Medication } from '@/types'
import { medications } from '@/data/medications'

export function isLow(med: Medication): boolean {
  return med.pillsRemaining <= med.refillThreshold && med.refillThreshold > 0
}

export function getLowMedications(): Medication[] {
  return medications.filter(isLow)
}

export interface PharmacyGroup {
  pharmacyId: string
  medications: Medication[]
}

export function groupLowByPharmacy(): PharmacyGroup[] {
  const low = getLowMedications()
  const map = new Map<string, Medication[]>()
  for (const med of low) {
    const list = map.get(med.pharmacyId) ?? []
    list.push(med)
    map.set(med.pharmacyId, list)
  }
  return Array.from(map.entries()).map(([pharmacyId, meds]) => ({
    pharmacyId,
    medications: meds,
  }))
}
