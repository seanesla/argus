import { useState, useRef, useEffect } from 'react'
import { isGeminiConfigured, streamChat, type ChatTurn } from '@/lib/gemini'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  pending?: boolean
}

const SEED_MESSAGES: Message[] = [
  {
    id: 'm1',
    role: 'assistant',
    content:
      "Hi, I'm Argus. I keep an eye on your medications, log doses as you take them, and draft refill requests before you run out. What would you like to do?",
    createdAt: new Date().toISOString(),
  },
]

const SUGGESTIONS = [
  'log my morning dose',
  'how many lisinopril do i have left?',
  'draft a refill request for atorvastatin',
  'what am i taking tonight?',
]

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function formatTime(iso: string) {
  return timeFormatter.format(new Date(iso))
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    const now = new Date().toISOString()
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      createdAt: now,
    }
    const assistantId = crypto.randomUUID()
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: now,
      pending: true,
    }

    setMessages((m) => [...m, userMsg, assistantMsg])
    setDraft('')

    if (!isGeminiConfigured) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  "i'm not wired to a model yet — add VITE_GEMINI_API_KEY to argus/.env.local and restart the dev server.",
                pending: false,
              }
            : msg,
        ),
      )
      return
    }

    const history: ChatTurn[] = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      text: m.content,
    }))

    setBusy(true)
    try {
      let acc = ''
      for await (const chunk of streamChat(history, trimmed)) {
        acc += chunk
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId ? { ...msg, content: acc } : msg,
          ),
        )
      }
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId ? { ...msg, pending: false } : msg,
        ),
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: `error: ${message}`, pending: false }
            : msg,
        ),
      )
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    void send(draft)
  }

  return (
    <div className="chat">
      <header className="chat-header">
        <h1 className="chat-title">argus</h1>
        <p className="chat-subtitle">
          Your medication copilot — ask me anything about your prescriptions.
        </p>
      </header>

      <div className="chat-scroller" ref={scrollerRef}>
        <div className="chat-thread">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`log-entry log-entry-${m.role === 'user' ? 'user' : 'assistant'}`}
            >
              <div className="log-meta">
                {formatTime(m.createdAt)}
                {' · '}
                <span className="log-meta-role">
                  {m.role === 'user' ? 'you' : 'argus'}
                </span>
              </div>
              <div className="log-body">
                {m.content || (m.pending ? '…' : '')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>

      <form className="chat-composer" onSubmit={onSubmit}>
        <input
          className="composer-input"
          placeholder="message argus…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
        <button
          className="composer-send"
          type="submit"
          disabled={!draft.trim() || busy}
        >
          {busy ? 'sending' : 'send'}
        </button>
      </form>
    </div>
  )
}
