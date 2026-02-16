'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

const DEFAULT_PROMPT = `The Memory agent stores and retrieves conversation history. It does not use a text prompt for LLM; it saves user and assistant messages to SQLite and loads the last N messages when context is requested.
Configuration (e.g. history length, what to include) can be adjusted in the agent code or via environment variables.`

export default function MemoryPromptPage() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)

  const handleSave = () => {
    // TODO: Persist via API
    alert('Memory agent notes saved! Restart the Memory agent to apply any config changes.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-800">
      <header className="border-b border-ocean-700/50 backdrop-blur-sm bg-ocean-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="p-2 hover:bg-ocean-700/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-ocean-300" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-ocean-300 to-ocean-500 bg-clip-text text-transparent">
                Memory Agent
              </h1>
              <p className="text-sm text-ocean-400">
                Conversation history and context
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-ocean-900/50 backdrop-blur-sm border border-ocean-700/50 rounded-xl p-6">
          <p className="text-sm text-ocean-400 mb-4">
            The Memory agent uses a database to store messages; it does not have
            a traditional LLM system prompt. Use this area for notes or future
            configuration (e.g. context window size, summarization rules).
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 bg-ocean-800/50 border border-ocean-700 rounded-lg text-ocean-100 focus:outline-none focus:border-ocean-500 font-mono text-sm resize-y"
            placeholder="Notes or configuration..."
          />
          <button
            onClick={handleSave}
            className="mt-4 flex items-center gap-2 px-6 py-2 bg-ocean-500 hover:bg-ocean-600 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </main>
    </div>
  )
}
