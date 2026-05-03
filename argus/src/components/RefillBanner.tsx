import { useEffect, useState } from 'react'
import { getActivePharmacy, useMode } from '@/lib/mode'
import { groupLowByPharmacy, type PharmacyGroup } from '@/lib/refillScan'
import RefillDraftModal from './RefillDraftModal'

const SNOOZE_KEY = 'argus.refillBanner.snoozed'

export default function RefillBanner() {
  const mode = useMode()
  const [groups, setGroups] = useState<PharmacyGroup[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    setGroups(groupLowByPharmacy())
    setDismissed(sessionStorage.getItem(SNOOZE_KEY) === '1')
  }, [mode])

  if (dismissed || groups.length === 0) return null

  const totalMeds = groups.reduce((acc, g) => acc + g.medications.length, 0)
  const summary = buildSummary(groups, totalMeds)

  function snooze() {
    sessionStorage.setItem(SNOOZE_KEY, '1')
    setDismissed(true)
  }

  return (
    <>
      <div className="refill-banner" role="status">
        <div className="refill-banner-text">
          <strong>argus</strong> · {summary} draft the refill {groups.length > 1 ? 'emails' : 'email'}?
        </div>
        <div className="refill-banner-actions">
          <button
            type="button"
            className="refill-btn refill-btn-primary"
            onClick={() => setModalOpen(true)}
          >
            yes, draft
          </button>
          <button type="button" className="refill-btn refill-btn-ghost" onClick={snooze}>
            not now
          </button>
        </div>
      </div>
      {modalOpen && (
        <RefillDraftModal groups={groups} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}

function buildSummary(groups: PharmacyGroup[], totalMeds: number): string {
  if (groups.length === 1) {
    const g = groups[0]
    const ph = getActivePharmacy(g.pharmacyId)
    const names = g.medications.map((m) => m.name)
    const list = humanList(names)
    const verb = totalMeds === 1 ? 'is' : 'are'
    return `${list} ${verb} running low${ph ? ` at ${ph.name}` : ''}.`
  }
  return `${totalMeds} medications are running low across ${groups.length} pharmacies.`
}

function humanList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}
