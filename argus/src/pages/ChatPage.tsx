import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { isGeminiConfigured, streamChat, type ChatTurn } from '@/lib/gemini'
import { extractSymptoms } from '@/lib/symptomExtractor'
import { addSymptoms } from '@/lib/symptoms'
import { useMedications } from '@/lib/medications'
import {
  getActiveConversation,
  startNewConversation,
  updateActiveMessages,
  useActiveConversation,
  type ChatMessage,
} from '@/lib/chats'

const SUGGESTIONS = [
  'felt dizzy this morning around 8',
  'how many lisinopril do i have left?',
  'mild headache around 2pm',
  'draft a refill request for atorvastatin',
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
  const conv = useActiveConversation()
  const messages = conv.messages
  const meds = useMedications()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const draftRef = useRef<HTMLInputElement>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  function setMessages(updater: (prev: ChatMessage[]) => ChatMessage[]) {
    // Always read the freshest persisted messages so concurrent updates
    // (streaming chunk + symptom extraction) don't clobber each other.
    const current = getActiveConversation().messages
    updateActiveMessages(updater(current))
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busyRef.current) return
    const now = new Date().toISOString()
    const userMsgId = crypto.randomUUID()
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      createdAt: now,
    }
    const assistantId = crypto.randomUUID()
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: now,
      pending: true,
    }

    const baseHistory: ChatTurn[] = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      text: m.content,
    }))

    setMessages((m) => [...m, userMsg, assistantMsg])
    if (draftRef.current) draftRef.current.value = ''

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

    busyRef.current = true

    void extractSymptoms(trimmed)
      .then((extracted) => {
        if (extracted.length === 0) return
        addSymptoms(extracted)
        setMessages((m) =>
          m.map((msg) =>
            msg.id === userMsgId ? { ...msg, loggedSymptoms: extracted } : msg,
          ),
        )
      })
      .catch(() => {})

    try {
      let acc = ''
      for await (const chunk of streamChat(meds, baseHistory, trimmed)) {
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
      busyRef.current = false
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draftRef.current) return
    void send(draftRef.current.value)
  }

  function onNewChat() {
    if (busyRef.current) return
    startNewConversation()
    if (draftRef.current) draftRef.current.value = ''
  }

  return (
    <div className="chat">
      <header className="chat-header">
        <div className="chat-header-row">
          <h1 className="chat-title">argus</h1>
          <button type="button" className="chip" onClick={onNewChat}>
            + new chat
          </button>
        </div>
        <p className="chat-subtitle">
          your medication copilot — describe how you're feeling to log it, or ask about your meds.
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
              {m.loggedSymptoms && m.loggedSymptoms.length > 0 && (
                <div className="log-receipt">
                  <div className="log-receipt-label">
                    logged to patterns
                  </div>
                  <ul className="log-receipt-list">
                    {m.loggedSymptoms.map((s) => (
                      <li key={s.id} className="log-receipt-item">
                        <span className={`severity-dot severity-${s.severity}`} />
                        <span className="log-receipt-symptom">{s.symptom}</span>
                        <span className="log-receipt-time">
                          {formatTime(s.occurredAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/patterns" className="log-receipt-link">
                    view in patterns →
                  </Link>
                </div>
              )}
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
          ref={draftRef}
          autoFocus
        />
        <button className="composer-send" type="submit">
          send
        </button>
      </form>
    </div>
  )
}

