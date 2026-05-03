import { GoogleGenAI, Type } from '@google/genai'
import type { Medication } from '@/types'

export interface ExtractedMedication {
  name?: string
  dosage?: string
  frequency?: string
  scheduledTimes?: string[]
  pillsRemaining?: number
  refillsLeft?: number
  prescriber?: string
  prescribedAt?: string
  notes?: string
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

export const isGeminiConfigured = Boolean(apiKey)

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null

function buildSystemInstruction(meds: Medication[]): string {
  const medLines =
    meds.length === 0
      ? '(no medications in the vault yet)'
      : meds
          .map((m) => {
            const sched =
              m.scheduledTimes.length > 0
                ? `at ${m.scheduledTimes.join(', ')}`
                : '(as needed, no fixed time)'
            return `- ${m.name} ${m.dosage}, ${m.frequency.toLowerCase()} ${sched}. ${m.pillsRemaining} doses left, ${m.refillsLeft} refill(s) on file. Prescriber: ${m.prescriber}.${m.notes ? ` Note: ${m.notes}` : ''}`
          })
          .join('\n')

  return `You are Argus, a careful, calm medication copilot for the user.

You have access to the user's current medication list:
${medLines}

Today's date: ${new Date().toISOString().slice(0, 10)}.

Style rules:
- Keep replies short — usually 1 to 4 short sentences.
- Lowercase, conversational, but precise. No medical disclaimers unless directly asked.
- Use the medication list above as the source of truth. Don't invent meds, doses, or schedules.
- When asked about counts ("how many X left"), give the exact number from the list.
- If asked something genuinely medical (interactions, dose changes, side effects), give the safe baseline answer in one line, then add: "for anything unusual, talk to your prescriber."
- Never tell the user to stop or change a prescription on your own.`
}

export type ChatTurn = { role: 'user' | 'model'; text: string }

export async function* streamChat(
  history: ChatTurn[],
  userMessage: string,
  meds: Medication[],
) {
  if (!ai) {
    throw new Error(
      'Gemini is not configured. Add VITE_GEMINI_API_KEY to argus/.env.local and restart the dev server.',
    )
  }

  const contents = [
    ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: 'user' as const, parts: [{ text: userMessage }] },
  ]

  const stream = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents,
    config: { systemInstruction: buildSystemInstruction(meds) },
  })

  for await (const chunk of stream) {
    const text = chunk.text
    if (text) yield text
  }
}

const EXTRACTION_PROMPT = `You are looking at a photo of a medication label, prescription, or pill bottle.
Extract the structured data you can read into the schema. Use null/omit for any field you cannot
confidently determine from the image — do not guess. For frequency, prefer one of:
"Once daily", "Twice daily", "Three times daily", "Four times daily", "Every other day", "Weekly", "As needed".
For scheduledTimes, return 24h "HH:MM" strings (e.g. ["08:00", "20:00"]). For prescribedAt, use "YYYY-MM-DD".`

export async function extractMedicationFromImage(file: File): Promise<ExtractedMedication> {
  if (!ai) {
    throw new Error(
      'Gemini is not configured. Add VITE_GEMINI_API_KEY to argus/.env.local and restart the dev server.',
    )
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
  const base64 = dataUrl.split(',', 2)[1] ?? ''

  const result = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        role: 'user',
        parts: [
          { text: EXTRACTION_PROMPT },
          { inlineData: { mimeType: file.type || 'image/jpeg', data: base64 } },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Medication name' },
          dosage: { type: Type.STRING, description: 'Dose strength, e.g. "10 mg"' },
          frequency: { type: Type.STRING, description: 'How often the medication is taken' },
          scheduledTimes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '24h HH:MM times for scheduled doses',
          },
          pillsRemaining: { type: Type.NUMBER, description: 'Pills/doses left in the bottle' },
          refillsLeft: { type: Type.NUMBER, description: 'Authorized refills remaining' },
          prescriber: { type: Type.STRING, description: 'Prescribing doctor name' },
          prescribedAt: { type: Type.STRING, description: 'Date prescribed YYYY-MM-DD' },
          notes: { type: Type.STRING, description: 'Special instructions or warnings' },
        },
      },
    },
  })

  const text = result.text
  if (!text) throw new Error('empty response from extractor')
  try {
    return JSON.parse(text) as ExtractedMedication
  } catch {
    throw new Error('extractor returned invalid JSON')
  }
}
