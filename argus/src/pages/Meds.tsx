import { useStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Meds() {
  const { meds } = useStore()

  if (!meds.length) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground">No medications loaded.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Medications</h1>

      <div className="grid gap-4">
        {meds.map((med) => (
          <Card key={med.id}>
            <CardHeader>
              <CardTitle>{med.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Dosage</p>
                  <p className="font-medium">{med.dosage}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Schedule</p>
                  <p className="font-medium">{med.schedule.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pills Remaining</p>
                  <p className="font-medium">{med.pillsRemaining}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Refill Threshold</p>
                  <p className="font-medium">{med.refillThresholdDays} days</p>
                </div>
              </div>
              {med.prescriber && (
                <div>
                  <p className="text-sm text-muted-foreground">Prescriber</p>
                  <p className="font-medium">{med.prescriber}</p>
                </div>
              )}
              {med.pharmacy && (
                <div>
                  <p className="text-sm text-muted-foreground">Pharmacy</p>
                  <p className="font-medium">{med.pharmacy}</p>
                </div>
              )}
              {med.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{med.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
