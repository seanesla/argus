import type { Confidence, Correlation, Medication, SymptomEntry } from '@/types'
import {
  buildCorrelationsAttachment,
  buildScheduleAttachment,
  buildSupplyAttachment,
  buildSymptomsAttachment,
  type ChartAttachment,
} from './chatTools'

export interface SlashCommandResult {
  attachment: ChartAttachment
  reply: string
}

export const SLASH_HELP = [
  '/supply — show pills remaining and refills for each med',
  '/symptoms [Nd] [name] — chart symptoms over the last N days (default 7)',
  '/schedule — show today\'s scheduled doses',
  '/patterns [strong|consistent|suggestive] — show detected patterns',
]

export function isSlashCommand(text: string): boolean {
  return text.trim().startsWith('/')
}

interface ParseInput {
  meds: Medication[]
  symptoms: SymptomEntry[]
  correlations: Correlation[]
}

// Parses a slash command. Returns null if input is not a known command (caller
// should fall back to LLM). Throws nothing — bad args produce a help reply.
export function runSlashCommand(
  text: string,
  ctx: ParseInput,
): SlashCommandResult | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith('/')) return null

  const [cmdRaw, ...rest] = trimmed.slice(1).split(/\s+/)
  const cmd = cmdRaw.toLowerCase()

  switch (cmd) {
    case 'supply':
    case 'refills': {
      return {
        attachment: buildSupplyAttachment(ctx.meds),
        reply:
          ctx.meds.length === 0
            ? "no meds on file yet — head to the meds page and add one."
            : 'here\'s your current supply.',
      }
    }
    case 'symptoms':
    case 'symptom': {
      // /symptoms 14d headache  →  days=14, filter=headache
      // /symptoms headache     →  days=7,  filter=headache
      let days = 7
      const filterParts: string[] = []
      for (const tok of rest) {
        const m = tok.match(/^(\d+)d?$/i)
        if (m && filterParts.length === 0) {
          days = parseInt(m[1], 10)
        } else {
          filterParts.push(tok)
        }
      }
      const filter = filterParts.length > 0 ? filterParts.join(' ') : null
      return {
        attachment: buildSymptomsAttachment(ctx.symptoms, days, filter),
        reply: filter
          ? `${filter} over the last ${days} day${days === 1 ? '' : 's'}.`
          : `your symptoms over the last ${days} day${days === 1 ? '' : 's'}.`,
      }
    }
    case 'schedule':
    case 'today': {
      return {
        attachment: buildScheduleAttachment(ctx.meds),
        reply: "here's what's on for today.",
      }
    }
    case 'patterns':
    case 'correlations': {
      const tier = rest[0]?.toLowerCase()
      const filter: Confidence | null =
        tier === 'strong' || tier === 'consistent' || tier === 'suggestive'
          ? tier
          : null
      return {
        attachment: buildCorrelationsAttachment(ctx.correlations, filter),
        reply: filter
          ? `${filter} patterns argus has noticed.`
          : 'patterns argus has noticed.',
      }
    }
    case 'help':
    case '?': {
      // Special: no attachment, just help text. Return null and the caller
      // can route as plain text. We'll handle this case in the page directly.
      return null
    }
    default:
      return null
  }
}
