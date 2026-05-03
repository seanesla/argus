import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function RefillAlerts() {
  const { meds } = useStore()
  const [draft, setDraft] = useState({ subject: '', body: '' })

  const alertMeds = meds.filter((m) => {
    const daysPerDose = m.schedule.length // rough estimate
    const daysLeft = m.pillsRemaining / daysPerDose
    return daysLeft < m.refillThresholdDays
  })

  if (alertMeds.length === 0) {
    return <p className="text-muted-foreground">All medications well-stocked.</p>
  }

  const handleGenerateDraft = async (med: typeof meds[0]) => {
    try {
      const res = await fetch('/api/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medId: med.id,
          name: med.name,
          dosage: med.dosage,
          prescriber: med.prescriber,
          pharmacy: med.pharmacy,
          pillsRemaining: med.pillsRemaining,
        }),
      })
      const data = await res.json()
      setDraft(data)
    } catch (error) {
      console.error('Failed to generate refill draft:', error)
    }
  }

  return (
    <div className="space-y-3">
      {alertMeds.map((med) => {
        const daysLeft = (med.pillsRemaining / med.schedule.length).toFixed(1)
        return (
          <Card key={med.id} className="border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-yellow-900">⚠️ {med.name}</p>
                <p className="text-sm text-yellow-800">Runs out in ~{daysLeft} days</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => handleGenerateDraft(med)}
                    variant="default"
                    size="sm"
                  >
                    Draft Refill
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Refill Request for {med.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium">Subject</label>
                      <input
                        type="text"
                        value={draft.subject}
                        onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                        className="w-full rounded border border-input px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Body</label>
                      <textarea
                        value={draft.body}
                        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                        className="w-full rounded border border-input px-3 py-2"
                        rows={4}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(draft.body)
                        alert('Copied to clipboard!')
                      }}
                      className="w-full"
                    >
                      Copy to Clipboard
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
