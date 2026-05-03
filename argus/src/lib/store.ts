import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Medication, DoseLog, SymptomLog } from './types'
import { generateSeedData } from './seed'

export interface AppState {
  meds: Medication[]
  doses: DoseLog[]
  symptoms: SymptomLog[]
  hasData: boolean

  // Actions
  addMed: (med: Medication) => void
  addDose: (medId: string, withFood: boolean, skipped: boolean, notes?: string) => void
  addSymptom: (symptom: string, severity: 1 | 2 | 3 | 4 | 5, notes?: string) => void
  decrementPills: (medId: string) => void
  loadSeedData: () => void
  clearAll: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      meds: [],
      doses: [],
      symptoms: [],

      get hasData() {
        return get().meds.length > 0 || get().doses.length > 0 || get().symptoms.length > 0
      },

      addMed: (med) => {
        set((state) => ({
          meds: [...state.meds, med],
        }))
      },

      addDose: (medId, withFood, skipped, notes) => {
        set((state) => ({
          doses: [
            ...state.doses,
            {
              id: uuidv4(),
              medId,
              takenAt: new Date().toISOString(),
              withFood,
              skipped,
              notes,
            },
          ],
        }))
        // Auto-decrement pills if not skipped
        if (!skipped) {
          get().decrementPills(medId)
        }
      },

      addSymptom: (symptom, severity, notes) => {
        set((state) => ({
          symptoms: [
            ...state.symptoms,
            {
              id: uuidv4(),
              loggedAt: new Date().toISOString(),
              symptom,
              severity,
              notes,
            },
          ],
        }))
      },

      decrementPills: (medId) => {
        set((state) => ({
          meds: state.meds.map((m) =>
            m.id === medId ? { ...m, pillsRemaining: Math.max(0, m.pillsRemaining - 1) } : m,
          ),
        }))
      },

      loadSeedData: () => {
        const { meds, doses, symptoms } = generateSeedData()
        set({ meds, doses, symptoms })
      },

      clearAll: () => {
        set({ meds: [], doses: [], symptoms: [] })
      },
    }),
    {
      name: 'argus-store',
    },
  ),
)
