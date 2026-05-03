import { useEffect, useState } from 'react'
import { getMode, MODE_EVENT } from './mode'
import type { SymptomEntry } from '@/types'
import type { ChartAttachment } from './chatTools'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  pending?: boolean
  loggedSymptoms?: SymptomEntry[]
  attachments?: ChartAttachment[]
}

export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

interface Store {
  activeId: string | null
  conversations: Conversation[]
}

const CHATS_EVENT = 'argus:chats-change'

const SEED_GREETING =
  "hi, i'm argus. tell me how you're feeling and i'll log it to your patterns. you can also ask about your meds, refills, or schedule."

function storageKey(): string {
  return getMode() === 'demo' ? 'argus.demo.chats' : 'argus.real.chats'
}

function newSeededConversation(): Conversation {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: 'new chat',
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: SEED_GREETING,
        createdAt: now,
      },
    ],
  }
}

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(storageKey())
    if (!raw) {
      const fresh = newSeededConversation()
      const store: Store = { activeId: fresh.id, conversations: [fresh] }
      saveStore(store)
      return store
    }
    const parsed = JSON.parse(raw) as Store
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.conversations) ||
      parsed.conversations.length === 0
    ) {
      const fresh = newSeededConversation()
      const store: Store = { activeId: fresh.id, conversations: [fresh] }
      saveStore(store)
      return store
    }
    // Clear any pending flag in case the user navigated away mid-stream.
    parsed.conversations = parsed.conversations.map((c) => ({
      ...c,
      messages: c.messages.map((m) => ({ ...m, pending: false })),
    }))
    if (
      !parsed.activeId ||
      !parsed.conversations.some((c) => c.id === parsed.activeId)
    ) {
      parsed.activeId = parsed.conversations[0].id
    }
    return parsed
  } catch {
    const fresh = newSeededConversation()
    return { activeId: fresh.id, conversations: [fresh] }
  }
}

function saveStore(store: Store): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(store))
    window.dispatchEvent(new Event(CHATS_EVENT))
  } catch {
    // localStorage full or disabled — silently drop.
  }
}

export function getActiveConversation(): Conversation {
  const store = loadStore()
  return (
    store.conversations.find((c) => c.id === store.activeId) ??
    store.conversations[0]
  )
}

export function listConversations(): Conversation[] {
  return [...loadStore().conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function setActiveConversation(id: string): void {
  const store = loadStore()
  if (!store.conversations.some((c) => c.id === id)) return
  store.activeId = id
  saveStore(store)
}

export function startNewConversation(): Conversation {
  const store = loadStore()
  const fresh = newSeededConversation()
  store.conversations.push(fresh)
  store.activeId = fresh.id
  saveStore(store)
  return fresh
}

export function updateActiveMessages(messages: ChatMessage[]): void {
  const store = loadStore()
  const idx = store.conversations.findIndex((c) => c.id === store.activeId)
  if (idx < 0) return
  const existing = store.conversations[idx]
  const firstUser = messages.find((m) => m.role === 'user')
  const title =
    existing.title !== 'new chat' && existing.title.length > 0
      ? existing.title
      : firstUser
        ? firstUser.content.slice(0, 60).trim() ||
          firstUser.content.slice(0, 60)
        : 'new chat'
  store.conversations[idx] = {
    ...existing,
    title,
    updatedAt: new Date().toISOString(),
    messages,
  }
  saveStore(store)
}

export function deleteConversation(id: string): void {
  const store = loadStore()
  store.conversations = store.conversations.filter((c) => c.id !== id)
  if (store.conversations.length === 0) {
    const fresh = newSeededConversation()
    store.conversations.push(fresh)
    store.activeId = fresh.id
  } else if (store.activeId === id) {
    store.activeId = store.conversations[0].id
  }
  saveStore(store)
}

export function useActiveConversation(): Conversation {
  const [conv, setConv] = useState<Conversation>(() => getActiveConversation())
  useEffect(() => {
    const refresh = () => setConv(getActiveConversation())
    window.addEventListener(CHATS_EVENT, refresh)
    window.addEventListener(MODE_EVENT, refresh)
    return () => {
      window.removeEventListener(CHATS_EVENT, refresh)
      window.removeEventListener(MODE_EVENT, refresh)
    }
  }, [])
  return conv
}

export function useConversations(): Conversation[] {
  const [list, setList] = useState<Conversation[]>(() => listConversations())
  useEffect(() => {
    const refresh = () => setList(listConversations())
    window.addEventListener(CHATS_EVENT, refresh)
    window.addEventListener(MODE_EVENT, refresh)
    return () => {
      window.removeEventListener(CHATS_EVENT, refresh)
      window.removeEventListener(MODE_EVENT, refresh)
    }
  }, [])
  return list
}
