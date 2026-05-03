export interface RefillDraft {
  to: string
  subject: string
  body: string
  rationale: string
}

export const refillDraftJsonSchema = {
  type: 'object',
  properties: {
    to: { type: 'string' },
    subject: { type: 'string' },
    body: { type: 'string' },
    rationale: { type: 'string' },
  },
  required: ['to', 'subject', 'body', 'rationale'],
  propertyOrdering: ['to', 'subject', 'body', 'rationale'],
} as const

export function isRefillDraft(value: unknown): value is RefillDraft {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.to === 'string' &&
    typeof v.subject === 'string' &&
    typeof v.body === 'string' &&
    typeof v.rationale === 'string'
  )
}
