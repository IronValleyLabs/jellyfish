'use client'

import { getMiniJellysByCategory } from '@/lib/mini-jelly-templates'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

export default function Gallery() {
  const categories = getMiniJellysByCategory()

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-800">
      {/* Header */}
      <header className="border-b border-ocean-700/50 backdrop-blur-sm bg-ocean-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-ocean-700/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-ocean-300" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-ocean-300 to-ocean-500 bg-clip-text text-transparent">
                Mini Jelly Gallery
              </h1>
              <p className="text-sm text-ocean-400">
                Choose an AI employee for your team
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Gallery */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {Object.entries(categories).map(([category, templates]) => (
          <div key={category} className="mb-12">
            <h2 className="text-xl font-semibold text-ocean-100 mb-4">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-ocean-900/50 backdrop-blur-sm border border-ocean-700/50 rounded-xl p-6 hover:border-ocean-500/50 transition-all hover:scale-[1.02] cursor-pointer group"
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3">{template.icon}</div>
                    <h3 className="font-semibold text-ocean-100 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm text-ocean-400 mb-4 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="text-xs text-ocean-500 mb-4">
                      {template.estimatedCost}
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-ocean-500/20 group-hover:bg-ocean-500 text-ocean-300 group-hover:text-white rounded-lg transition-colors">
                      <Plus className="w-4 h-4" />
                      Add to Team
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
