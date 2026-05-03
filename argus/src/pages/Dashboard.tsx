import { useStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import QuickLog from '@/components/QuickLog'
import RefillAlerts from '@/components/RefillAlerts'

export default function Dashboard() {
  const { meds, doses, symptoms } = useStore()

  if (!meds.length) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground">No medications loaded. Load demo data to begin.</p>
      </div>
    )
  }

  // Today's schedule
  const today = new Date().toISOString().split('T')[0]
  const todayDoses = doses.filter((d) => d.takenAt.startsWith(today))

  // Recent symptoms (last 7 days)
  const recentSymptoms = symptoms.slice(-5)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Quick log */}
      <Card>
        <CardHeader>
          <CardTitle>Log Dose or Symptom</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickLog />
        </CardContent>
      </Card>

      {/* Refill alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Refill Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <RefillAlerts />
        </CardContent>
      </Card>

      {/* Today's medications */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {todayDoses.length === 0 ? (
            <p className="text-muted-foreground">No doses logged today yet.</p>
          ) : (
            <ul className="space-y-2">
              {todayDoses.map((dose) => {
                const med = meds.find((m) => m.id === dose.medId)
                return (
                  <li key={dose.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{med?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {dose.skipped ? 'Skipped' : 'Taken'} at{' '}
                        {new Date(dose.takenAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {dose.skipped && (
                      <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                        SKIPPED
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Recent symptoms */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Symptoms</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSymptoms.length === 0 ? (
            <p className="text-muted-foreground">No symptoms logged yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentSymptoms.map((sym) => (
                <li key={sym.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium capitalize">{sym.symptom.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sym.loggedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-lg">{'⭐'.repeat(sym.severity)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
