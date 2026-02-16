'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, User, Bot, RefreshCw } from 'lucide-react'

const POLL_INTERVAL_MS = 5000

interface ChatMessage {
  id: number
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  userId?: string | null
  platform?: string | null
  agentId?: string | null
}

interface TeamMember {
  id: string
  name: string
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function conversationLabel(conversationId: string): string {
  const parts = conversationId.split('_')
  if (parts.length >= 2) {
    const platform = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
    const id = parts.slice(1).join('_')
    return `${platform} ${id}`
  }
  return conversationId
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [conversations, setConversations] = useState<string[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const agentIdToName = (agentId: string | null | undefined): string => {
    if (!agentId) return 'Assistant'
    const m = team.find((t) => t.id === agentId || t.id === agentId.replace('mini-jelly-', ''))
    if (m) return m.name
    return agentId.replace('mini-jelly-', '')
  }

  const loadData = useCallback(async () => {
    const [teamData, msgs] = await Promise.all([
      fetch('/api/team').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/messages?limit=500').then((r) => (r.ok ? r.json() : [])),
    ])
    setTeam(Array.isArray(teamData) ? teamData : [])
    const list = Array.isArray(msgs) ? msgs : []
    setMessages(list)
    setConversations((prev) => {
      const convIds = [...new Set(list.map((m: ChatMessage) => m.conversationId))]
      return convIds
    })
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/team').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/messages?limit=500').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([teamData, msgs]) => {
        setTeam(Array.isArray(teamData) ? teamData : [])
        const list = Array.isArray(msgs) ? msgs : []
        setMessages(list)
        const convIds = [...new Set(list.map((m: ChatMessage) => m.conversationId))]
        setConversations(convIds)
        if (convIds.length > 0) setSelectedConversation((prev) => (prev === null ? convIds[0] : prev))
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading) {
      const id = setInterval(loadData, POLL_INTERVAL_MS)
      return () => clearInterval(id)
    }
  }, [loading, loadData])

  const displayMessages = selectedConversation
    ? messages.filter((m) => m.conversationId === selectedConversation)
    : messages

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-800 flex items-center justify-center">
        <div className="text-ocean-400">Loading chat...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-800 flex flex-col">
      <header className="border-b border-ocean-700/50 backdrop-blur-sm bg-ocean-900/50 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-ocean-700/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-ocean-300" />
            </Link>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-ocean-400" />
              <h1 className="text-xl font-bold text-ocean-100">Chat</h1>
            </div>
            <button
              type="button"
              onClick={() => loadData()}
              className="p-2 hover:bg-ocean-700/50 rounded-lg transition-colors text-ocean-400 hover:text-ocean-300"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-hidden">
        {conversations.length > 0 && (
          <aside className="w-56 shrink-0 border-r border-ocean-700/50 flex flex-col bg-ocean-900/30">
            <div className="p-2 text-xs text-ocean-500 uppercase tracking-wider">Conversations</div>
            <div className="overflow-y-auto flex-1">
              {conversations.map((cid) => (
                <button
                  key={cid}
                  type="button"
                  onClick={() => setSelectedConversation(cid)}
                  className={`w-full text-left px-3 py-2 text-sm truncate transition-colors ${
                    selectedConversation === cid
                      ? 'bg-ocean-600/50 text-ocean-100'
                      : 'text-ocean-400 hover:bg-ocean-700/30'
                  }`}
                >
                  {conversationLabel(cid)}
                </button>
              ))}
            </div>
          </aside>
        )}

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {error ? (
            <div className="p-6 text-red-400">{error}</div>
          ) : displayMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-ocean-500">
              No messages yet. Chat via Telegram or another platform to see history here.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {displayMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-start' : 'justify-start'}`}
                >
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      m.role === 'user' ? 'bg-ocean-600' : 'bg-ocean-500/50'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <User className="w-4 h-4 text-ocean-200" />
                    ) : (
                      <Bot className="w-4 h-4 text-ocean-200" />
                    )}
                  </div>
                  <div className="min-w-0 max-w-[85%] rounded-lg px-4 py-2 bg-ocean-800/60 border border-ocean-700/50">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ocean-500 mb-1">
                      {m.role === 'user' ? (
                        <>
                          <span>{m.userId || 'User'}</span>
                          {m.platform && (
                            <span className="px-1.5 py-0.5 rounded bg-ocean-700/50 capitalize">
                              {m.platform}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-ocean-400">
                          {agentIdToName(m.agentId)}
                        </span>
                      )}
                      <span>{formatTime(m.timestamp)}</span>
                    </div>
                    <div className="text-ocean-100 whitespace-pre-wrap break-words">{m.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
