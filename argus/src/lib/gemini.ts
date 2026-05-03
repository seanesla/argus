import { GoogleGenAI } from '@google/genai'
import { medications } from '@/data/medications'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

export const isGeminiConfigured = Boolean(apiKey)

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null

const MED_LINES = medications
  .map((m) => {
    const sched =
      m.scheduledTimes.length > 0
        ? `at ${m.scheduledTimes.join(', ')}`
        : '(as needed, no fixed time)'
    return `- ${m.name} ${m.dosage}, ${m.frequency.toLowerCase()} ${sched}. ${m.pillsRemaining} doses left, ${m.refillsLeft} refill(s) on file. Prescriber: ${m.prescriber}.${m.notes ? ` Note: ${m.notes}` : ''}`
  })
  .join('\n')

const SYSTEM_INSTRUCTION = `You are Argus, a careful, calm medication copilot for the user.

You have access to the user's current medication list:
${MED_LINES}

Today's date: ${new Date().toISOString().slice(0, 10)}.

Style rules:
- Keep replies short — usually 1 to 4 short sentences.
- Lowercase, conversational, but precise. No medical disclaimers unless directly asked.
- Use the medication list above as the source of truth. Don't invent meds, doses, or schedules.
- When asked about counts ("how many X left"), give the exact number from the list.
- If asked something genuinely medical (interactions, dose changes, side effects), give the safe baseline answer in one line, then add: "for anything unusual, talk to your prescriber."
- Never tell the user to stop or change a prescription on your own.`

export type ChatTurn = { role: 'user' | 'model'; text: string }

export async function* streamChat(history: ChatTurn[], userMessage: string) {
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
    config: { systemInstruction: SYSTEM_INSTRUCTION },
  })

  for await (const chunk of stream) {
    const text = chunk.text
    if (text) yield text
  }
}
