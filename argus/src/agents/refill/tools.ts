import type { FunctionDeclaration } from '@google/genai'
import { medications } from '@/data/medications'
import { getActivePharmacy, getActiveUserProfile } from '@/lib/mode'

export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_user_profile',
    description:
      "Returns the active user's profile: full name, date of birth (YYYY-MM-DD), contact email, phone. Returns null fields if data is unavailable.",
    parametersJsonSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_pharmacy',
    description:
      'Look up a pharmacy by id. Returns name, email (or null), phone (or null), portalUrl (or null).',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Pharmacy id, e.g. "ph-northgate"' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_medication',
    description:
      'Look up a medication by id. Returns name, dosage, Rx number, prescribing physician, frequency, pillsRemaining, refillsLeft.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Medication id, e.g. "med-001"' },
      },
      required: ['id'],
    },
  },
]

export type ToolHandler = (args: Record<string, unknown>) => unknown

export const toolHandlers: Record<string, ToolHandler> = {
  get_user_profile: () => {
    const profile = getActiveUserProfile()
    if (!profile) {
      return {
        error: 'No user profile saved. Real-mode profile has not been entered yet.',
      }
    }
    return profile
  },
  get_pharmacy: (args) => {
    const id = String(args.id ?? '')
    const pharmacy = getActivePharmacy(id)
    return pharmacy ?? { error: `No pharmacy found with id "${id}"` }
  },
  get_medication: (args) => {
    const id = String(args.id ?? '')
    const med = medications.find((m) => m.id === id)
    if (!med) return { error: `No medication found with id "${id}"` }
    return {
      id: med.id,
      name: med.name,
      dosage: med.dosage,
      rxNumber: med.rxNumber,
      prescriber: med.prescriber,
      frequency: med.frequency,
      pillsRemaining: med.pillsRemaining,
      refillsLeft: med.refillsLeft,
    }
  },
}
