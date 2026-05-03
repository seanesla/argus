import type { Pharmacy } from '../types'

export const demoPharmacies: Pharmacy[] = [
  {
    id: 'ph-northgate',
    name: 'Northgate Pharmacy',
    email: 'refills@northgate.argus.demo',
    phone: '+1-555-0142',
    portalUrl: null,
  },
  {
    id: 'ph-bayside',
    name: 'Bayside Family Drugs',
    email: 'rx@bayside.argus.demo',
    phone: '+1-555-0177',
    portalUrl: 'https://bayside.argus.demo/refill',
  },
]
