'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, DollarSign, Activity } from 'lucide-react'

interface AnalyticsData {
  actionsByDay: Record<string, Record<string, number>>
  costByAgent: Record<string, number>
  dates: string[]
  agentIds: string[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load'))))
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-800 flex items-center justify-center">
        <div className="text-ocean-400">Loading analytics...</div>
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-800 flex items-center justify-center">
        <div className="text-red-400">{error ?? 'No data'}</div>
      </div>
    )
  }

  const { actionsByDay, costByAgent, dates, agentIds } = data
  const maxActionsPerDay = Math.max(
    1,
    ...dates.map((d) => Object.values(actionsByDay[d] ?? {}).reduce((a, b) => a + b, 0))
  )
  const maxCost = Math.max(0.01, ...Object.values(costByAgent))

  const totalActionsByDay = dates.map((d) =>
    Object.values(actionsByDay[d] ?? {}).reduce((a, b) => a + b, 0)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-800">
      <header className="border-b border-ocean-700/50 backdrop-blur-sm bg-ocean-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-ocean-700/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-ocean-300" />
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-ocean-400" />
              <h1 className="text-xl font-bold text-ocean-100">Analytics</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        <section>
          <h2 className="text-lg font-semibold text-ocean-200 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Actions per day (last 7 days)
          </h2>
          <div className="bg-ocean-900/50 backdrop-blur-sm border border-ocean-700/50 rounded-xl p-6">
            <div className="flex items-end gap-2 h-48">
              {dates.map((date, i) => {
                const total = totalActionsByDay[i] ?? 0
                const pct = (total / maxActionsPerDay) * 100
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-ocean-500 rounded-t transition-all min-h-[4px]"
                      style={{ height: `${Math.max(2, pct)}%` }}
                      title={`${date}: ${total} actions`}
                    />
                    <span className="text-xs text-ocean-500">
                      {date.slice(5)}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 text-sm text-ocean-400">
              Total actions: {totalActionsByDay.reduce((a, b) => a + b, 0)}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ocean-200 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Cost by agent (last 7 days)
          </h2>
          <div className="bg-ocean-900/50 backdrop-blur-sm border border-ocean-700/50 rounded-xl p-6">
            {agentIds.length === 0 ? (
              <p className="text-ocean-500 text-sm">No cost data yet.</p>
            ) : (
              <div className="space-y-3">
                {agentIds.map((agentId) => {
                  const cost = costByAgent[agentId] ?? 0
                  const pct = (cost / maxCost) * 100
                  const label = agentId.replace(/^mini-jelly-/, '')
                  return (
                    <div key={agentId} className="flex items-center gap-3">
                      <span className="text-ocean-300 text-sm w-32 truncate" title={agentId}>
                        {label}
                      </span>
                      <div className="flex-1 h-6 bg-ocean-800 rounded overflow-hidden">
                        <div
                          className="h-full bg-ocean-500 rounded transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-ocean-200 text-sm w-16 text-right">
                        ${cost.toFixed(2)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
