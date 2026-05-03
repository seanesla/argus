import { useEffect, useRef, useState } from 'react'
import { draftRefillEmail, AgentError, type RefillDraft } from '@/agents/refill'
import { getActivePharmacy } from '@/lib/mode'
import type { PharmacyGroup } from '@/lib/refillScan'

interface Props {
  groups: PharmacyGroup[]
  onClose: () => void
}

type CardState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; draft: RefillDraft }

export default function RefillDraftModal({ groups, onClose }: Props) {
  const [states, setStates] = useState<Record<string, CardState>>(() =>
    Object.fromEntries(groups.map((g) => [g.pharmacyId, { status: 'loading' as const }])),
  )
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    abortRef.current = controller
    let cancelled = false

    Promise.all(
      groups.map(async (group) => {
        try {
          const draft = await draftRefillEmail(
            group.pharmacyId,
            group.medications.map((m) => m.id),
            controller.signal,
          )
          if (cancelled) return
          setStates((s) => ({ ...s, [group.pharmacyId]: { status: 'ready', draft } }))
        } catch (err) {
          if (cancelled) return
          const msg =
            err instanceof AgentError
              ? `${err.kind}: ${err.message}`
              : err instanceof Error
                ? err.message
                : String(err)
          setStates((s) => ({ ...s, [group.pharmacyId]: { status: 'error', message: msg } }))
        }
      }),
    )

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [groups])

  function handleSend(draft: RefillDraft) {
    const url = new URL('https://mail.google.com/mail/')
    url.searchParams.set('view', 'cm')
    url.searchParams.set('fs', '1')
    url.searchParams.set('to', draft.to)
    url.searchParams.set('su', draft.subject)
    url.searchParams.set('body', draft.body)
    window.open(url.toString(), '_blank', 'noopener,noreferrer')
  }

  function updateDraft(pharmacyId: string, patch: Partial<RefillDraft>) {
    setStates((s) => {
      const cur = s[pharmacyId]
      if (cur?.status !== 'ready') return s
      return { ...s, [pharmacyId]: { status: 'ready', draft: { ...cur.draft, ...patch } } }
    })
  }

  return (
    <div className="refill-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="refill-modal" onClick={(e) => e.stopPropagation()}>
        <header className="refill-modal-header">
          <h2>refill drafts</h2>
          <button type="button" className="refill-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="refill-modal-body">
          {groups.map((group) => {
            const pharmacy = getActivePharmacy(group.pharmacyId)
            const state = states[group.pharmacyId]
            return (
              <article key={group.pharmacyId} className="refill-card">
                <header className="refill-card-header">
                  <h3>{pharmacy?.name ?? group.pharmacyId}</h3>
                  <div className="refill-card-meds">
                    {group.medications.map((m) => m.name).join(' · ')}
                  </div>
                </header>

                {state.status === 'loading' && (
                  <div className="refill-card-status">drafting email…</div>
                )}

                {state.status === 'error' && (
                  <div className="refill-card-error">
                    couldn't draft: {state.message}
                  </div>
                )}

                {state.status === 'ready' && (
                  <>
                    <div className="refill-rationale">{state.draft.rationale}</div>
                    <label className="refill-field">
                      <span>to</span>
                      <input
                        type="text"
                        value={state.draft.to}
                        onChange={(e) => updateDraft(group.pharmacyId, { to: e.target.value })}
                        placeholder="pharmacy email"
                      />
                    </label>
                    <label className="refill-field">
                      <span>subject</span>
                      <input
                        type="text"
                        value={state.draft.subject}
                        onChange={(e) => updateDraft(group.pharmacyId, { subject: e.target.value })}
                      />
                    </label>
                    <label className="refill-field">
                      <span>body</span>
                      <textarea
                        rows={10}
                        value={state.draft.body}
                        onChange={(e) => updateDraft(group.pharmacyId, { body: e.target.value })}
                      />
                    </label>
                    <div className="refill-card-actions">
                      <button
                        type="button"
                        className="refill-btn refill-btn-primary"
                        disabled={!state.draft.to.trim()}
                        onClick={() => handleSend(state.draft)}
                      >
                        open in gmail
                      </button>
                    </div>
                  </>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
