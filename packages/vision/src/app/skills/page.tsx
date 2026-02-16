'use client'

import Link from 'next/link'
import { ArrowLeft, Download, Check } from 'lucide-react'

const AVAILABLE_SKILLS = [
  {
    id: 'web-search',
    name: 'Web Search',
    icon: '🔍',
    description: 'Search the web using DuckDuckGo',
    installed: true,
    category: 'Research',
  },
  {
    id: 'bash-execution',
    name: 'Bash Execution',
    icon: '💻',
    description: 'Execute terminal commands safely',
    installed: true,
    category: 'System',
  },
  {
    id: 'email-sender',
    name: 'Email Sender',
    icon: '📧',
    description: 'Send emails via SMTP',
    installed: false,
    category: 'Communication',
  },
  {
    id: 'calendar-manager',
    name: 'Calendar Manager',
    icon: '📅',
    description: 'Manage Google Calendar events',
    installed: false,
    category: 'Productivity',
  },
  {
    id: 'image-generator',
    name: 'Image Generator',
    icon: '🎨',
    description: 'Generate images with DALL-E',
    installed: false,
    category: 'Creative',
  },
  {
    id: 'pdf-creator',
    name: 'PDF Creator',
    icon: '📄',
    description: 'Create PDF documents',
    installed: false,
    category: 'Documents',
  },
]

export default function Skills() {
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
                Skills Marketplace
              </h1>
              <p className="text-sm text-ocean-400">
                Extend your agents&apos; capabilities
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_SKILLS.map((skill) => (
            <div
              key={skill.id}
              className="bg-ocean-900/50 backdrop-blur-sm border border-ocean-700/50 rounded-xl p-6 hover:border-ocean-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{skill.icon}</div>
                {skill.installed ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                    <Check className="w-3 h-3" />
                    Installed
                  </span>
                ) : (
                  <button className="flex items-center gap-1 px-3 py-1 bg-ocean-500 hover:bg-ocean-600 text-white rounded-lg text-xs transition-colors">
                    <Download className="w-3 h-3" />
                    Install
                  </button>
                )}
              </div>

              <h3 className="font-semibold text-ocean-100 mb-2">{skill.name}</h3>
              <p className="text-sm text-ocean-400 mb-3">{skill.description}</p>
              <span className="inline-block px-2 py-1 bg-ocean-800/50 text-ocean-300 rounded text-xs">
                {skill.category}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
