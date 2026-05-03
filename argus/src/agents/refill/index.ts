import { SYSTEM_PROMPT } from './prompt'
import { toolDeclarations } from './tools'
import { isRefillDraft, refillDraftJsonSchema, type RefillDraft } from './schema'
import { AgentError, runAgent } from './client'

const MODEL = 'gemini-3-flash-preview'

export async function draftRefillEmail(
  pharmacyId: string,
  medicationIds: string[],
  signal?: AbortSignal,
): Promise<RefillDraft> {
  if (medicationIds.length === 0) {
    throw new AgentError('invalid_output', 'No medications provided')
  }

  const userMessage =
    `Draft a single combined refill-request email to pharmacy id "${pharmacyId}" covering medication ids: ${medicationIds.map((id) => `"${id}"`).join(', ')}.\n` +
    `Use the tools to look up the pharmacy, the user profile, and each medication. Then output the JSON draft.`

  const text = await runAgent({
    model: MODEL,
    systemPrompt: SYSTEM_PROMPT,
    tools: toolDeclarations,
    userMessage,
    responseJsonSchema: refillDraftJsonSchema,
    signal,
  })

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    throw new AgentError(
      'invalid_output',
      `Model output was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  if (!isRefillDraft(parsed)) {
    throw new AgentError('invalid_output', 'Model output failed schema validation')
  }
  return parsed
}

export { AgentError, isAgentConfigured } from './client'
export type { RefillDraft } from './schema'
