import { v4 as uuidv4 } from 'uuid'
import type { Medication, DoseLog, SymptomLog } from './types'

export function generateSeedData() {
  const now = new Date()
  const daysAgo = (n: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() - n)
    return d
  }

  const meds: Medication[] = [
    {
      id: 'med-1',
      name: 'Lisinopril',
      dosage: '10mg',
      schedule: ['08:00'],
      pillsRemaining: 4,
      refillThresholdDays: 5,
      prescriber: 'Dr. Smith',
      pharmacy: 'CVS',
      pharmacyEmail: 'pharmacy@cvs.com',
      notes: 'Blood pressure medication',
    },
    {
      id: 'med-2',
      name: 'Metformin',
      dosage: '500mg',
      schedule: ['08:00', '20:00'],
      pillsRemaining: 50,
      refillThresholdDays: 7,
      prescriber: 'Dr. Smith',
      pharmacy: 'CVS',
      notes: 'Take with food',
    },
    {
      id: 'med-3',
      name: 'Atorvastatin',
      dosage: '20mg',
      schedule: ['21:00'],
      pillsRemaining: 28,
      refillThresholdDays: 5,
      prescriber: 'Dr. Johnson',
      pharmacy: 'Walgreens',
    },
    {
      id: 'med-4',
      name: 'Sertraline',
      dosage: '50mg',
      schedule: ['08:00'],
      pillsRemaining: 25,
      refillThresholdDays: 7,
      prescriber: 'Dr. Johnson',
      pharmacy: 'Walgreens',
    },
  ]

  // 14 days of dose logs
  const doses: DoseLog[] = []
  for (let day = 13; day >= 0; day--) {
    const dayDate = daysAgo(day)
    const dateStr = dayDate.toISOString().split('T')[0]

    // Lisinopril: mostly taken, skip on days 3, 7, 10
    if (![3, 7, 10].includes(day)) {
      doses.push({
        id: uuidv4(),
        medId: 'med-1',
        takenAt: new Date(`${dateStr}T08:00:00Z`).toISOString(),
        withFood: true,
        skipped: false,
      })
    } else {
      doses.push({
        id: uuidv4(),
        medId: 'med-1',
        takenAt: new Date(`${dateStr}T08:00:00Z`).toISOString(),
        withFood: false,
        skipped: true,
      })
    }

    // Metformin morning: 5 times without food (days 2, 5, 8, 11, 13)
    const withoutFood = [2, 5, 8, 11, 13].includes(day)
    doses.push({
      id: uuidv4(),
      medId: 'med-2',
      takenAt: new Date(`${dateStr}T08:00:00Z`).toISOString(),
      withFood: !withoutFood,
      skipped: false,
    })

    // Metformin evening: always with food
    doses.push({
      id: uuidv4(),
      medId: 'med-2',
      takenAt: new Date(`${dateStr}T20:00:00Z`).toISOString(),
      withFood: true,
      skipped: false,
    })

    // Atorvastatin: every day at 21:00
    doses.push({
      id: uuidv4(),
      medId: 'med-3',
      takenAt: new Date(`${dateStr}T21:00:00Z`).toISOString(),
      withFood: Math.random() > 0.5,
      skipped: false,
    })

    // Sertraline: every day at 08:00
    doses.push({
      id: uuidv4(),
      medId: 'med-4',
      takenAt: new Date(`${dateStr}T08:00:00Z`).toISOString(),
      withFood: true,
      skipped: false,
    })
  }

  // Symptom logs
  const symptoms: SymptomLog[] = []

  // Nausea on days with no-food Metformin: days 2, 5, 8, 11, 13
  // Log nausea 2-3 hours after morning dose (08:00 + 2h = 10:00)
  for (const day of [2, 5, 8, 11]) {
    const dayDate = daysAgo(day)
    const symptomTime = new Date(dayDate)
    symptomTime.setHours(10, 0, 0)
    symptoms.push({
      id: uuidv4(),
      loggedAt: symptomTime.toISOString(),
      symptom: 'nausea',
      severity: [3, 4, 3, 4][Math.floor(Math.random() * 2)] as 3 | 4,
    })
  }

  // Headaches on days when Lisinopril was skipped: days 3, 7, 10
  for (const day of [3, 7]) {
    const dayDate = daysAgo(day)
    const symptomTime = new Date(dayDate)
    symptomTime.setHours(14, 0, 0)
    symptoms.push({
      id: uuidv4(),
      loggedAt: symptomTime.toISOString(),
      symptom: 'headache',
      severity: [3, 4][Math.floor(Math.random() * 2)] as 3 | 4,
    })
  }

  // Random noise symptoms
  const noiseSymptoms = ['fatigue', 'insomnia', 'dizziness', 'itching', 'dry_mouth']
  for (let i = 0; i < 5; i++) {
    const randomDay = Math.floor(Math.random() * 14)
    const dayDate = daysAgo(randomDay)
    const symptomTime = new Date(dayDate)
    symptomTime.setHours(Math.floor(Math.random() * 24), 0, 0)
    symptoms.push({
      id: uuidv4(),
      loggedAt: symptomTime.toISOString(),
      symptom: noiseSymptoms[Math.floor(Math.random() * noiseSymptoms.length)],
      severity: (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5,
    })
  }

  return { meds, doses, symptoms }
}
