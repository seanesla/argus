import { GoogleGenAI } from '@google/genai'
import type { Severity, SymptomEntry } from '@/types'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

export const isExtractorConfigured = Boolean(apiKey)

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null

const responseJsonSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['occurredAt', 'symptom', 'severity', 'rawText'],
    properties: {
      occurredAt: {
        type: 'string',
        description: 'ISO 8601 timestamp of when the symptom occurred',
      },
      symptom: {
        type: 'string',
        description: 'lowercase canonical noun, e.g. dizziness, headache, nausea, fatigue',
      },
      severity: {
        type: 'string',
        enum: ['mild', 'moderate', 'severe'],
      },
      rawText: {
        type: 'string',
        description: 'the verbatim quote from the user input that this entry was extracted from',
      },
    },
  },
}

interface ExtractedItem {
  occurredAt: string
  symptom: string
  severity: Severity
  rawText: string
}

export async function extractSymptoms(rawInput: string): Promise<SymptomEntry[]> {
  if (!ai) {
    throw new Error(
      'Gemini is not configured. Add VITE_GEMINI_API_KEY to argus/.env.local and restart the dev server.',
    )
  }

  const trimmed = rawInput.trim()
  if (!trimmed) return []

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const localTime = now.toTimeString().slice(0, 5)

  const systemInstruction = `You convert free-text symptom logs into structured records.

Today is ${today}. Current local time is ${localTime}.

Resolve relative times:
- "this morning" → 08:00 today
- "afternoon" → 14:00 today
- "evening" / "tonight" → 21:00 today
- "last night" → 22:00 yesterday
- "yesterday morning" → 08:00 yesterday
- bare times like "2pm" or "around 9" → today at that time
If no time is mentioned, use the current local time (${localTime}) today.

Canonicalize symptoms to a single lowercase noun: dizziness, headache, nausea, fatigue, palpitations, anxiety, insomnia, cramps, etc. Never use plural ("headaches" → "headache").

Severity defaults to "mild" if unstated. Use "moderate" for words like "pretty bad", "really", "noticeable". Use "severe" only for "terrible", "awful", "unbearable".

Return one object per distinct symptom mention. If the user does not describe any symptom, return an empty array.`

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: trimmed,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseJsonSchema,
    },
  })

  const text = response.text
  if (!text) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  return (parsed as ExtractedItem[])
    .filter((item) => item && item.symptom && item.occurredAt)
    .map((item) => ({
      id: crypto.randomUUID(),
      occurredAt: item.occurredAt,
      loggedAt: new Date().toISOString(),
      symptom: item.symptom.toLowerCase().trim(),
      severity: (['mild', 'moderate', 'severe'] as const).includes(item.severity)
        ? item.severity
        : 'mild',
      rawText: item.rawText || trimmed,
    }))
}
