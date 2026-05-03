# argus

an AI agent that watches over your medications so you don't have to. built for CruzHacks 2026 (UC Santa Cruz).

named after Argus Panoptes — the hundred-eyed watcher of Greek myth.

## the idea

medication management is a **pattern problem**, not a memory problem. most people don't need another alarm — they need someone paying attention to the connections they're too close to see.

argus:
- tracks every dose and symptom you log
- surfaces patterns a human would miss (e.g. headaches that follow the morning BP med, side effects that only appear on days you skip food)
- watches supply and proactively drafts refill requests when a prescription is running low

## stack

- **frontend:** React 19, TypeScript, Vite 8, React Router 7
- **AI:** Google Gemini via `@google/genai`
- **charts:** Recharts
- **icons:** lucide-react
- **WebGL background:** ogl (the FaultyTerminal effect)
- **deploy:** Vercel
- **package manager:** pnpm

## repo layout

the actual app lives in `argus/argus/` (nested). top-level `argus/` is the git root.

```
argus/argus/src/
├── pages/         # ChatPage, MedicationsPage
├── components/    # Layout, FaultyTerminal, AccentPicker, ConsentModal,
│   │             # UnlockGate, ModeToggle, MedicationForm,
│   │             # AddMedicationDialog, DailyChecklist, RefillBanner,
│   │             # RefillDraftModal
│   └── charts/    # SupplyCard, CorrelationChart, SymptomTimeline,
│                  # TodaySchedule, ChartAttachment
├── agents/refill/ # refill agent: client, prompt, schema, tools
├── lib/           # gemini, chats, chatTools, mode, refillScan,
│                  # slashCommands, accent
├── data/          # medications, pharmacies, userProfile (mock/seed)
└── types.ts
```

## getting started

```bash
cd argus
pnpm install
pnpm dev
```

dev server runs on `http://localhost:5173`.

## scripts

```bash
pnpm dev        # vite dev server
pnpm build      # tsc -b && vite build
pnpm preview    # preview production build
pnpm lint       # eslint
```

## environment

create `argus/.env.local` with your Gemini API key:

```
VITE_GEMINI_API_KEY=your_key_here
```

never commit `.env.local`.

## notes

- not submitting to the Vercel v0 track
- date context: built 2026-05-03
