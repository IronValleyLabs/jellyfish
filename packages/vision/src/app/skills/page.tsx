'use client'

import Link from 'next/link'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'
import { ALL_SKILLS } from '@/lib/agent-skills'

export default function Skills() {
  const implemented = ALL_SKILLS.filter((s) => s.implemented)
  const comingSoon = ALL_SKILLS.filter((s) => !s.implemented)

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
                Skills
              </h1>
              <p className="text-sm text-ocean-400">
                Available tools for your agents. Assign them when adding or editing a Mini Jelly (Gallery or agent config).
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-ocean-100 mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-400" />
            Available now ({implemented.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {implemented.map((skill) => (
              <div
                key={skill.id}
                className="bg-ocean-900/50 backdrop-blur-sm border border-ocean-700/50 rounded-xl p-6 hover:border-ocean-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{skill.icon}</div>
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                    <Check className="w-3 h-3" />
                    Installed
                  </span>
                </div>
                <h3 className="font-semibold text-ocean-100 mb-2">{skill.label}</h3>
                <p className="text-sm text-ocean-400 mb-3">{skill.description}</p>
                <span className="inline-block px-2 py-1 bg-ocean-800/50 text-ocean-300 rounded text-xs mr-2">
                  {skill.category}
                </span>
                <p className="text-xs text-ocean-500 mt-3">
                  Assign in <Link href="/gallery" className="text-ocean-400 hover:underline">Gallery</Link> or in the agent&apos;s config.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ocean-100 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Coming soon ({comingSoon.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comingSoon.map((skill) => (
              <div
                key={skill.id}
                className="bg-ocean-900/30 backdrop-blur-sm border border-ocean-700/30 rounded-xl p-6 opacity-80"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{skill.icon}</div>
                  <span className="px-2 py-1 bg-ocean-700/50 text-ocean-400 rounded-full text-xs">
                    Coming soon
                  </span>
                </div>
                <h3 className="font-semibold text-ocean-200 mb-2">{skill.label}</h3>
                <p className="text-sm text-ocean-500 mb-3">{skill.description}</p>
                <span className="inline-block px-2 py-1 bg-ocean-800/50 text-ocean-400 rounded text-xs">
                  {skill.category}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
