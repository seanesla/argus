import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const SEED_MESSAGES: Message[] = [
  {
    id: 'm1',
    role: 'assistant',
    content:
      "Hi, I'm Argus. I keep an eye on your medications, log doses as you take them, and draft refill requests before you run out. What would you like to do?",
  },
]

const SUGGESTIONS = [
  'Log my morning dose',
  'How many Lisinopril do I have left?',
  'Draft a refill request for Atorvastatin',
  'What am I taking tonight?',
]

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
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    }
    const placeholder: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content:
        "I haven't been wired up to the model yet — once the agent loop is connected I'll handle this.",
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
        <div>
          <h1 className="chat-title">Argus</h1>
          <p className="chat-subtitle">
            Your medication copilot — ask me anything about your prescriptions.
          </p>
        </div>
      </header>

      <div className="chat-scroller" ref={scrollerRef}>
        <div className="chat-thread">
          {messages.map((m) => (
            <div key={m.id} className={`bubble bubble-${m.role}`}>
              {m.role === 'assistant' && <div className="bubble-avatar">A</div>}
              <div className="bubble-body">{m.content}</div>
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
          placeholder="Message Argus…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
        <button className="composer-send" type="submit" disabled={!draft.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
