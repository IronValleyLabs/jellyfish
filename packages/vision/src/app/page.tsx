'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Activity, Pause, Settings, TrendingUp } from 'lucide-react'

interface MiniStarfish {
  id: string
  name: string
  role: string
  icon: string
  status: 'active' | 'paused'
  lastAction: string
  nanoCount: number
  actionsToday: number
  costToday: number
}

export default function Dashboard() {
  const [miniStarfish] = useState<MiniStarfish[]>([
    {
      id: '1',
      name: 'Sarah',
      role: 'Social Media Manager',
      icon: '🎨',
      status: 'active',
      lastAction: '2 min ago',
      nanoCount: 4,
      actionsToday: 12,
      costToday: 0.87,
    },
    {
      id: '2',
      name: 'Marcus',
      role: 'Paid Media Manager',
      icon: '📊',
      status: 'active',
      lastAction: '5 min ago',
      nanoCount: 3,
      actionsToday: 8,
      costToday: 0.68,
    },
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-800">
      {/* Header */}
      <header className="border-b border-ocean-700/50 backdrop-blur-sm bg-ocean-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🐙</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-ocean-300 to-ocean-500 bg-clip-text text-transparent">
                  Starfish Platform
                </h1>
                <p className="text-sm text-ocean-400">Your AI Team Management</p>
              </div>
            </div>
            <Link
              href="/gallery"
              className="flex items-center gap-2 px-4 py-2 bg-ocean-500 hover:bg-ocean-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Mini-Starfish
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-ocean-900/50 backdrop-blur-sm border border-ocean-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-ocean-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-ocean-300" />
              </div>
              <div>
                <p className="text-sm text-ocean-400">Active Mini-Starfish</p>
                <p className="text-2xl font-bold text-ocean-100">
                  {miniStarfish.filter((m) => m.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-ocean-900/50 backdrop-blur-sm border border-ocean-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-300" />
              </div>
              <div>
                <p className="text-sm text-ocean-400">Actions Today</p>
                <p className="text-2xl font-bold text-ocean-100">
                  {miniStarfish.reduce((sum, m) => sum + m.actionsToday, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-ocean-900/50 backdrop-blur-sm border border-ocean-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <span className="text-lg">🦑</span>
              </div>
              <div>
                <p className="text-sm text-ocean-400">Total Nano-Starfish</p>
                <p className="text-2xl font-bold text-ocean-100">
                  {miniStarfish.reduce((sum, m) => sum + m.nanoCount, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-ocean-900/50 backdrop-blur-sm border border-ocean-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <span className="text-lg">💰</span>
              </div>
              <div>
                <p className="text-sm text-ocean-400">AI Cost Today</p>
                <p className="text-2xl font-bold text-ocean-100">
                  $
                  {miniStarfish
                    .reduce((sum, m) => sum + m.costToday, 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mini-Starfish List */}
        <div>
          <h2 className="text-xl font-semibold text-ocean-100 mb-4">
            Your Team ({miniStarfish.length}/20)
          </h2>

          {miniStarfish.length === 0 ? (
            <div className="text-center py-16 bg-ocean-900/30 backdrop-blur-sm border border-ocean-700/50 rounded-xl">
              <div className="text-6xl mb-4">🐙</div>
              <h3 className="text-xl font-semibold text-ocean-200 mb-2">
                No Mini-Starfish yet
              </h3>
              <p className="text-ocean-400 mb-6">
                Add your first AI employee to get started
              </p>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 px-6 py-3 bg-ocean-500 hover:bg-ocean-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Browse Gallery
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {miniStarfish.map((mini) => (
                <div
                  key={mini.id}
                  className="bg-ocean-900/50 backdrop-blur-sm border border-ocean-700/50 rounded-xl p-6 hover:border-ocean-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{mini.icon}</div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-ocean-100">
                            {mini.name} - {mini.role}
                          </h3>
                          <span
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              mini.status === 'active'
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-gray-500/20 text-gray-300'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {mini.status === 'active' ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <p className="text-sm text-ocean-400 mb-3">
                          Last action: {mini.lastAction}
                        </p>

                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-ocean-400">Managing </span>
                            <span className="font-semibold text-ocean-200">
                              {mini.nanoCount} Nano-Starfish
                            </span>
                          </div>
                          <div>
                            <span className="text-ocean-400">
                              Actions today:{' '}
                            </span>
                            <span className="font-semibold text-ocean-200">
                              {mini.actionsToday}
                            </span>
                          </div>
                          <div>
                            <span className="text-ocean-400">AI cost: </span>
                            <span className="font-semibold text-ocean-200">
                              ${mini.costToday.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/mini/${mini.id}`}
                        className="p-2 hover:bg-ocean-700/50 rounded-lg transition-colors"
                      >
                        <Activity className="w-5 h-5 text-ocean-300" />
                      </Link>
                      <button className="p-2 hover:bg-ocean-700/50 rounded-lg transition-colors">
                        {mini.status === 'active' ? (
                          <Pause className="w-5 h-5 text-ocean-300" />
                        ) : (
                          <Activity className="w-5 h-5 text-ocean-300" />
                        )}
                      </button>
                      <button className="p-2 hover:bg-ocean-700/50 rounded-lg transition-colors">
                        <Settings className="w-5 h-5 text-ocean-300" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
