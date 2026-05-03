import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenerativeAI } from '@google/genai'

interface RefillRequest {
  medId: string
  name: string
  dosage: string
  prescriber?: string
  pharmacy?: string
  pillsRemaining: number
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, dosage, prescriber, pharmacy, pillsRemaining } = req.body as RefillRequest

    if (!name || !dosage) {
      return res.status(400).json({ error: 'Missing medication name or dosage' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' })
    }

    const prompt = `Draft a polite, concise refill request from a patient to their pharmacy.

Medication: ${name} ${dosage}
${prescriber ? `Prescriber: ${prescriber}` : ''}
${pharmacy ? `Pharmacy: ${pharmacy}` : ''}
Doses remaining: ${pillsRemaining}

Output JSON: { "subject": string, "body": string }

Body should be under 80 words, professional but warm. Include the medication name + dosage ${prescriber ? '+ prescriber name' : ''}, and a sentence about timing.`

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
      res.json({
        subject: `Refill Request for ${name}`,
        body: `Hello, I would like to request a refill of my ${name} ${dosage} prescription. Thank you.`,
      })
    }
  } catch (error) {
    console.error('Refill endpoint error:', error)
    res.status(500).json({ error: 'Failed to generate refill draft' })
  }
}
