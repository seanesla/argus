import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenerativeAI } from '@google/genai'

interface InsightRequest {
  meds: { id: string; name: string; dosage: string }[]
  doses: { medId: string; takenAt: string; withFood: boolean; skipped: boolean }[]
  symptoms: { loggedAt: string; symptom: string; severity: number }[]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { meds, doses, symptoms } = req.body as InsightRequest

    if (!meds || !doses || !symptoms) {
      return res.status(400).json({ error: 'Missing meds, doses, or symptoms data' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' })
    }

    const client = new GoogleGenerativeAI({ apiKey })

    const prompt = `You are Argus, a medication pattern analyst. Examine these logs for causal-looking correlations between medication events (doses, skips, with/without food) and symptoms within a 24-hour window.

Rules:
1. Require at least 3 supporting occurrences. Ignore patterns with 1-2 instances.
2. Compute confidence as (supporting occurrences / total opportunities).
3. Skip patterns below 0.5 confidence.
4. If nothing meets the bar, return {"insights": []}.
5. Never invent symptoms or doses not present in the data.
6. Prefer specific actionable suggestions ("take with breakfast") over vague ones.
7. Maximum 3 insights, ranked by confidence (highest first).

Return ONLY valid JSON matching this schema:
{
  insights: [{
    title: string,
    description: string,
    confidence: number (0-1),
    evidence: [{ date: string, doseEntry: string, symptomEntry: string }],
    suggestion: string
  }]
}

Data:
Medications: ${JSON.stringify(meds)}
Dose Logs: ${JSON.stringify(doses)}
Symptom Logs: ${JSON.stringify(symptoms)}`

    const model = client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    })

    const result = await model
    const text = result.text

    try {
      const parsed = JSON.parse(text)
      res.json(parsed)
    } catch {
      res.json({ insights: [] })
    }
  } catch (error) {
    console.error('Insights endpoint error:', error)
    res.status(500).json({ error: 'Failed to generate insights' })
  }
}
