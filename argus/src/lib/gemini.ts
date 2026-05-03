import { GoogleGenAI } from '@google/genai'
import type { Medication } from '@/types'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

export const isGeminiConfigured = Boolean(apiKey)

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null

function medLines(meds: Medication[]): string {
  if (meds.length === 0) {
    return '(the user has not added any medications yet.)'
  }
  return meds
    .map((m) => {
      const sched =
        m.scheduledTimes.length > 0
          ? `at ${m.scheduledTimes.join(', ')}`
          : '(as needed, no fixed time)'
      return `- ${m.name} ${m.dosage}, ${m.frequency.toLowerCase()} ${sched}. ${m.pillsRemaining} doses left, ${m.refillsLeft} refill(s) on file. Prescriber: ${m.prescriber}.${m.notes ? ` Note: ${m.notes}` : ''}`
    })
    .join('\n')
}

function buildSystemInstruction(meds: Medication[]): string {
  const noMeds = meds.length === 0
  return `You are Argus, a careful, calm medication copilot for the user.

You have access to the user's current medication list:
${medLines(meds)}

Today's date: ${new Date().toISOString().slice(0, 10)}.

Style rules:
- Keep replies short — usually 1 to 4 short sentences.
- Lowercase, conversational, but precise. No medical disclaimers unless directly asked.
- Use the medication list above as the source of truth. Don't invent meds, doses, or schedules.
${noMeds ? `- If the user asks about meds, doses, or refills, tell them gently: "no meds on file yet — head to the meds page and add one and i'll start tracking."` : '- When asked about counts ("how many X left"), give the exact number from the list.'}
- If asked something genuinely medical (interactions, dose changes, side effects), give the safe baseline answer in one line, then add: "for anything unusual, talk to your prescriber."
- Never tell the user to stop or change a prescription on your own.
- Symptom logging: if the user clearly describes how they feel (dizzy, headache, nausea, tired, etc.), a separate process logs it AND the UI shows a visible "logged to patterns" receipt under their message — so do NOT repeat or list what was logged in your reply (it's already on screen). Just respond naturally to whatever they asked or said next. If they didn't describe any feeling, never claim anything was logged.`
}

export type ChatTurn = { role: 'user' | 'model'; text: string }

export async function* streamChat(
  meds: Medication[],
  history: ChatTurn[],
  userMessage: string,
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
