import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
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
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const now = new Date().toISOString()
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      createdAt: now,
    }
    const placeholder: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content:
        "I haven't been wired up to the model yet — once the agent loop is connected I'll handle this.",
      createdAt: now,
    }
    setMessages((m) => [...m, userMsg, placeholder])
    setDraft('')
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(draft)
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
              <div className="log-body">{m.content}</div>
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
        <button className="composer-send" type="submit" disabled={!draft.trim()}>
          send
        </button>
      </form>
    </div>
  )
}
