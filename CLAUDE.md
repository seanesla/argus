# Argus — CruzHacks 2026

## Hackathon

- **Event:** CruzHacks 2026 (UC Santa Cruz).
- **Tracks:** We are NOT submitting to the v0 track. Do not assume v0-specific
  patterns, components, or constraints when generating code.
- **Date context:** Today is 2026-05-03.

## What Argus is

Argus is an AI agent that watches over a user's medications so they don't have
to. It is named after the hundred-eyed watcher of Greek myth. The core thesis:
medication management is a *pattern* problem, not a *memory* problem. Most
people don't need another alarm — they need someone paying attention to the
connections they're too close to see.

What it does:
- Tracks every dose and symptom the user logs.
- Surfaces patterns a human would miss (e.g., headaches that consistently
  follow the morning blood-pressure med, side effects that only appear on
  days the user skips food).
- Watches medication supply and proactively drafts refill requests when a
  prescription is running low, so the user never runs out mid-week.

See `idea.md` for the full pitch.

## Repo layout

The actual app lives in `argus/argus/` (nested). Top-level `argus/` is just
the git root.

- `argus/argus/` — Vite + React 19 + TypeScript app.
  - `src/pages/` — `ChatPage.tsx` (talk to Argus), `MedicationsPage.tsx`.
  - `src/components/` — `Layout.tsx`, `FaultyTerminal.*` (background effect),
    `AccentPicker.tsx`.
  - `src/lib/gemini.ts` — Google Gemini client (`@google/genai`). The agent
    brain runs through here.
  - `src/lib/accent.ts` — accent color theming.
  - `src/data/medications.ts` — medication data (currently mock/seed).
- Deployed via Vercel (`.vercel/` present).

## Stack

- React 19, React Router 7, TypeScript, Vite 8.
- `@google/genai` for the LLM (Gemini).
- `ogl` for WebGL background effects, `lucide-react` for icons.
- Package manager: pnpm (lockfile present); npm lockfile also present.

## Working in this repo

- Run dev server from `argus/argus/`: `pnpm dev`.
- Build: `pnpm build` (runs `tsc -b && vite build`).
- API keys live in `argus/argus/.env.local` — do not commit or echo them.
