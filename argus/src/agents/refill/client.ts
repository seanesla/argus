import { GoogleGenAI, type Content, type FunctionDeclaration } from '@google/genai'
import { toolHandlers } from './tools'

export type AgentErrorKind =
  | 'not_configured'
  | 'rate_limited'
  | 'api_error'
  | 'invalid_output'
  | 'aborted'
  | 'loop_exhausted'

export class AgentError extends Error {
  kind: AgentErrorKind
  constructor(kind: AgentErrorKind, message: string) {
    super(message)
    this.name = 'AgentError'
    this.kind = kind
  }
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

export const isAgentConfigured = Boolean(apiKey)

export interface RunAgentOptions {
  model: string
  systemPrompt: string
  tools: FunctionDeclaration[]
  userMessage: string
  responseJsonSchema: unknown
  maxIterations?: number
  signal?: AbortSignal
}

export async function runAgent(options: RunAgentOptions): Promise<string> {
  if (!apiKey) {
    throw new AgentError(
      'not_configured',
      'VITE_GEMINI_API_KEY is not set. Add it to argus/.env.local and restart the dev server.',
    )
  }

  const {
    model,
    systemPrompt,
    tools,
    userMessage,
    responseJsonSchema,
    maxIterations = 5,
    signal,
  } = options

  const ai = new GoogleGenAI({ apiKey })

  const contents: Content[] = [
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  for (let i = 0; i < maxIterations; i++) {
    if (signal?.aborted) throw new AgentError('aborted', 'Agent run aborted')

    let response
    try {
      response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: tools }],
          responseMimeType: 'application/json',
          responseJsonSchema,
        },
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (/\b429\b/.test(message) || /rate.?limit/i.test(message) || /quota/i.test(message)) {
        throw new AgentError('rate_limited', message)
      }
      throw new AgentError('api_error', message)
    }

    const candidate = response.candidates?.[0]
    const parts = candidate?.content?.parts ?? []
    const functionCalls = parts.filter((p) => p.functionCall)

    if (functionCalls.length > 0) {
      // Preserve full parts (including thoughtSignature) — Gemini 3 requires it
      // on functionCall parts when echoed back. See:
      // https://ai.google.dev/gemini-api/docs/thought-signatures
      contents.push({ role: 'model', parts })

      const responseParts = functionCalls.map((p) => {
        const call = p.functionCall!
        const handler = toolHandlers[call.name ?? '']
        let result: unknown
        try {
          result = handler
            ? handler((call.args ?? {}) as Record<string, unknown>)
            : { error: `Unknown tool "${call.name}"` }
        } catch (err) {
          result = { error: err instanceof Error ? err.message : String(err) }
        }
        return {
          functionResponse: {
            name: call.name,
            response: { result },
          },
        }
      })

      contents.push({ role: 'user', parts: responseParts })
      continue
    }

    const text = response.text
    if (typeof text === 'string' && text.length > 0) {
      return text
    }

    throw new AgentError('invalid_output', 'Model returned no text and no tool call')
  }

  throw new AgentError('loop_exhausted', `Agent did not finish within ${maxIterations} iterations`)
}
