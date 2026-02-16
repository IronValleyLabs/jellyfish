'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { getDefaultPromptForTemplate } from '@/lib/default-prompts'

const AGENT_PROMPTS: Record<
  string,
  { title: string; description: string; defaultPrompt: string }
> = {
  core: {
    title: 'Core Agent',
    description: 'Detects user intent and decides which action to take',
    defaultPrompt: `You are the Core Agent of Jellyfish AI.

Your job is to analyze user messages and detect their intent.

Classify each message into one of these intents:
- "response": User wants a conversational response
- "bash": User wants to execute a command
- "websearch": User wants information from the web

Respond in JSON format:
{
  "intent": "response" | "bash" | "websearch",
  "params": {
    "query": "search query" (for websearch),
    "command": "bash command" (for bash)
  }
}

Examples:
- "Hello" → {"intent": "response", "params": {}}
- "List files" → {"intent": "bash", "params": {"command": "ls -la"}}
- "Search for AI news" → {"intent": "websearch", "params": {"query": "AI news"}}`,
  },
  memory: {
    title: 'Memory Agent',
    description: 'Manages conversation history and context',
    defaultPrompt: `You are the Memory Agent of Jellyfish AI.

Your job is to:
1. Store all messages in the database
2. Load conversation history when needed
3. Provide context to other agents

You work silently in the background.`,
  },
  action: {
    title: 'Action Agent',
    description: 'Executes commands and searches the web',
    defaultPrompt: `You are the Action Agent of Jellyfish AI.

Your job is to:
1. Execute bash commands safely (block dangerous commands)
2. Search the web using DuckDuckGo
3. Return results to the user

Blocked commands:
- rm -rf
- sudo
- mkfs
- dd
- Any command with >/dev/sd*

Always return results in a clear, readable format.`,
  },
}

interface TeamMember {
  id: string
  name: string
  role: string
  templateId: string
  jobDescription?: string
}

function buildMiniJellyDefaultPrompt(member: TeamMember): string {
  const base = getDefaultPromptForTemplate(member.templateId)
  const parts = [`You are ${member.name}, a ${member.role}.`, base]
  if (member.jobDescription?.trim()) {
    parts.push(`Your specific role: ${member.jobDescription.trim()}`)
  }
  return parts.join('\n\n')
}

export default function PromptEditor() {
  const params = useParams()
  const router = useRouter()
  const agent = params.agent as string
  const isMiniJelly = agent.startsWith('mj-')
  const agentConfig = AGENT_PROMPTS[agent]

  const [prompt, setPrompt] = useState('')
  const [miniJellyMember, setMiniJellyMember] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (agentConfig) {
      fetch(`/api/system-prompts?agent=${encodeURIComponent(agent)}`)
        .then((r) => r.json())
        .then((data: { prompt?: string | null }) => {
          setPrompt(data.prompt ?? agentConfig.defaultPrompt)
        })
        .catch(() => setPrompt(agentConfig.defaultPrompt))
        .finally(() => setLoading(false))
      return
    }
    if (isMiniJelly) {
      Promise.all([
        fetch('/api/team').then((r) => r.json()),
        fetch(`/api/prompts?miniJellyId=${encodeURIComponent(agent)}`).then((r) => r.json()),
      ])
        .then(([team, promptData]: [TeamMember[], { systemPrompt?: string | null }]) => {
          const member = Array.isArray(team) ? team.find((m) => m.id === agent) : null
          setMiniJellyMember(member ?? null)
          if (promptData.systemPrompt) {
            setPrompt(promptData.systemPrompt)
          } else if (member) {
            setPrompt(buildMiniJellyDefaultPrompt(member))
          }
        })
        .catch(() => setMessage({ type: 'error', text: 'Failed to load' }))
        .finally(() => setLoading(false))
      return
    }
    setLoading(false)
  }, [agent, isMiniJelly, agentConfig])

  const handleSave = async () => {
    if (agentConfig) {
      setMessage(null)
      setSaving(true)
      try {
        const res = await fetch('/api/system-prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent, prompt }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          setMessage({
            type: 'success',
            text: 'Prompt saved. Restart agents to apply changes.',
          })
        } else {
          setMessage({ type: 'error', text: data.error ?? 'Failed to save' })
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to save' })
      } finally {
        setSaving(false)
      }
      return
    }
    if (isMiniJelly && miniJellyMember) {
      setMessage(null)
      setSaving(true)
      try {
        const res = await fetch('/api/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ miniJellyId: agent, systemPrompt: prompt }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          setMessage({
            type: 'success',
            text: 'Prompt saved. Restart this Mini Jelly (pause then activate) to apply.',
          })
        } else {
          setMessage({ type: 'error', text: data.error ?? 'Failed to save' })
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to save' })
      } finally {
        setSaving(false)
      }
      return
    }
    setMessage({
      type: 'success',
      text: 'Prompt saved! Restart agents to apply changes.',
    })
  }

  const defaultPromptForMiniJelly = miniJellyMember
    ? buildMiniJellyDefaultPrompt(miniJellyMember)
    : ''

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-800 flex items-center justify-center">
        <div className="text-ocean-400">Loading...</div>
      </div>
    )
  }

  if (isMiniJelly && !miniJellyMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-800 flex items-center justify-center">
        <div className="text-center text-ocean-300">
          <p className="mb-4">Mini Jelly not found</p>
          <Link href="/" className="text-ocean-400 hover:text-ocean-300 underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const title = isMiniJelly && miniJellyMember
    ? `${miniJellyMember.name} – System prompt`
    : agentConfig?.title ?? 'Prompt'
  const description = isMiniJelly
    ? 'Customize how this Mini Jelly thinks and responds. Restart the agent to apply.'
    : agentConfig?.description ?? ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-800">
      <header className="border-b border-ocean-700/50 backdrop-blur-sm bg-ocean-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={isMiniJelly ? '/' : '/settings'}
              className="p-2 hover:bg-ocean-700/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-ocean-300" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-ocean-300 to-ocean-500 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-sm text-ocean-400">{description}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-ocean-900/50 backdrop-blur-sm border border-ocean-700/50 rounded-xl p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-ocean-300 mb-2">
              System Prompt
            </label>
            <p className="text-xs text-ocean-500 mb-4">
              This prompt defines how the agent thinks and behaves. Changes
              require agent restart.
            </p>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-96 px-4 py-3 bg-ocean-800/50 border border-ocean-700 rounded-lg text-ocean-100 font-mono text-sm focus:outline-none focus:border-ocean-500 resize-none"
            placeholder="Enter system prompt..."
          />

          {message && (
            <p
              className={`mt-4 text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
            >
              {message.text}
            </p>
          )}

          <div className="flex items-center justify-between mt-6">
            {isMiniJelly && defaultPromptForMiniJelly ? (
              <button
                type="button"
                onClick={() => setPrompt(defaultPromptForMiniJelly)}
                className="px-4 py-2 bg-ocean-700/50 hover:bg-ocean-700 text-ocean-300 rounded-lg transition-colors text-sm"
              >
                Reset to default
              </button>
            ) : agentConfig ? (
              <button
                type="button"
                onClick={() => setPrompt(agentConfig.defaultPrompt)}
                className="px-4 py-2 bg-ocean-700/50 hover:bg-ocean-700 text-ocean-300 rounded-lg transition-colors text-sm"
              >
                Reset to default
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-ocean-500 hover:bg-ocean-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
