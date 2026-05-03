import { useNavigate } from 'react-router-dom'
import {
  deleteConversation,
  setActiveConversation,
  startNewConversation,
  useActiveConversation,
  useConversations,
  type Conversation,
} from '@/lib/chats'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function formatWhen(iso: string): string {
  const then = new Date(iso)
  const now = Date.now()
  const diffMin = (now - then.getTime()) / 60000
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${Math.floor(diffMin)}m ago`
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}h ago`
  return dateFormatter.format(then)
}

function preview(conv: Conversation): string {
  const firstUser = conv.messages.find((m) => m.role === 'user')
  if (firstUser) return firstUser.content
  return 'no messages yet'
}

export default function HistoryPage() {
  const conversations = useConversations()
  const active = useActiveConversation()
  const navigate = useNavigate()

  function onOpen(id: string) {
    setActiveConversation(id)
    navigate('/')
  }

  function onNew() {
    startNewConversation()
    navigate('/')
  }

  function onDelete(id: string, title: string) {
    if (!confirm(`delete "${title}"?`)) return
    deleteConversation(id)
  }

  return (
    <div className="history">
      <header className="history-header">
        <div>
          <h1 className="history-title">history</h1>
          <p className="history-subtitle">
            {conversations.length} conversation{conversations.length === 1 ? '' : 's'} with argus.
          </p>
        </div>
        <button type="button" className="composer-send" onClick={onNew}>
          + new chat
        </button>
      </header>

      <div className="history-list">
        {conversations.map((c) => {
          const isActive = c.id === active.id
          const userMsgCount = c.messages.filter((m) => m.role === 'user').length
          return (
            <article
              key={c.id}
              className={`history-card${isActive ? ' history-card-active' : ''}`}
            >
              <button
                type="button"
                className="history-card-main"
                onClick={() => onOpen(c.id)}
              >
                <div className="history-card-top">
                  <span className="history-card-title">{c.title}</span>
                  {isActive && <span className="history-card-pill">active</span>}
                </div>
                <div className="history-card-preview">{preview(c)}</div>
                <div className="history-card-meta">
                  {formatWhen(c.updatedAt)} · {userMsgCount} message
                  {userMsgCount === 1 ? '' : 's'}
                </div>
              </button>
              <button
                type="button"
                className="chip history-card-delete"
                onClick={() => onDelete(c.id, c.title)}
              >
                delete
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}
