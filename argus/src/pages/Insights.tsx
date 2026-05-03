import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Insight {
  title: string
  description: string
  confidence: number
  evidence: { date: string; doseEntry: string; symptomEntry: string }[]
  suggestion: string
}

export default function Insights() {
  const { meds, doses, symptoms } = useStore()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)

  if (!meds.length) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground">No data available. Load demo data to analyze.</p>
      </div>
    )
  }

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meds, doses, symptoms }),
      })
      const data = await res.json()
      setInsights(data.insights || [])
    } catch (error) {
      console.error('Failed to fetch insights:', error)
      setInsights([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Pattern Analysis</h1>
        <p className="text-muted-foreground">
          Argus analyzes your medication and symptom logs to discover hidden patterns.
        </p>
      </div>

      <Button onClick={handleAnalyze} disabled={loading} size="lg">
        {loading ? 'Analyzing...' : 'Analyze My Patterns'}
      </Button>

      {loading && (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-8">
          <div className="animate-pulse text-center">
            <p className="text-muted-foreground">Argus is analyzing your data...</p>
          </div>
        </div>
      )}

      {insights.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No insights yet. Click "Analyze My Patterns" to discover correlations.
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {insights.map((insight, i) => (
          <Card key={i} className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-blue-900">{insight.title}</CardTitle>
                  <p className="mt-1 text-sm text-blue-800">{insight.description}</p>
                </div>
                <Badge variant="secondary">
                  {(insight.confidence * 100).toFixed(0)}% confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-blue-900">💡 Suggestion</p>
                <p className="text-blue-800">{insight.suggestion}</p>
              </div>
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-blue-700 hover:text-blue-900">
                  Show evidence ({insight.evidence.length} occurrences)
                </summary>
                <div className="mt-2 space-y-1 rounded bg-white p-2 text-sm">
                  {insight.evidence.map((ev, j) => (
                    <p key={j} className="text-gray-700">
                      <strong>{ev.date}</strong> - {ev.doseEntry} → {ev.symptomEntry}
                    </p>
                  ))}
                </div>
              </details>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
