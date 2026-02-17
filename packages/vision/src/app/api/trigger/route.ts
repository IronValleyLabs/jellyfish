/**
 * POST /api/trigger — Wake agent(s) by event. No cron: you call this when something happens
 * (new trend, webhook, RSS, metric threshold, Zapier/n8n, etc.).
 * Body: { agentId?: string, all?: boolean, signals?: string }
 * - agentId: wake this Mini Jelly (e.g. "mini-jelly-xyz" or "xyz")
 * - all: wake all active Mini Jellys (optional signals applied to each)
 * - signals: optional context (trends, news) to inject; if omitted we fetch from /api/signals
 */
import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { EventBus } from '@jellyfish/shared'

const TEAM_FILE = path.join(process.cwd(), 'data', 'team.json')

interface TeamMemberStub {
  id: string
  status: string
  wakeOnSignals?: boolean
}

async function readTeam(): Promise<TeamMemberStub[]> {
  try {
    const raw = await fs.readFile(TEAM_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function shouldWake(m: TeamMemberStub): boolean {
  return m.status === 'active' && m.wakeOnSignals !== false
}

let eventBus: EventBus | null = null
function getEventBus(): EventBus {
  if (!eventBus) eventBus = new EventBus('vision-trigger')
  return eventBus
}

export async function POST(request: NextRequest) {
  let body: { agentId?: string; all?: boolean; signals?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { agentId: rawId, all: triggerAll, signals: providedSignals } = body || {}
  let signals = typeof providedSignals === 'string' ? providedSignals.trim() : undefined

  if (!rawId && !triggerAll) {
    return Response.json({ error: 'Provide agentId or all: true' }, { status: 400 })
  }

  const bus = getEventBus()
  const toTrigger: { agentId: string }[] = []

  if (triggerAll) {
    const team = await readTeam()
    const active = team.filter(shouldWake)
    for (const m of active) {
      toTrigger.push({ agentId: m.id.startsWith('mini-jelly-') ? m.id : `mini-jelly-${m.id}` })
    }
    if (!signals) {
      try {
        const base = process.env.VISION_CHAT_URL ?? 'http://localhost:3000'
        const res = await fetch(`${base.replace(/\/$/, '')}/api/signals`)
        if (res.ok) {
          const data = (await res.json()) as { signals?: string }
          signals = data.signals?.trim()
        }
      } catch {
        // ignore
      }
    }
  } else if (rawId) {
    const agentId = rawId.startsWith('mini-jelly-') ? rawId : `mini-jelly-${rawId}`
    toTrigger.push({ agentId })
    if (!signals) {
      try {
        const base = process.env.VISION_CHAT_URL ?? 'http://localhost:3000'
        const res = await fetch(`${base.replace(/\/$/, '')}/api/signals`)
        if (res.ok) {
          const data = (await res.json()) as { signals?: string }
          signals = data.signals?.trim()
        }
      } catch {
        // ignore
      }
    }
  }

  for (const { agentId } of toTrigger) {
    await bus.publish('agent.tick', { agentId, signals: signals || undefined })
  }

  return Response.json({
    ok: true,
    triggered: toTrigger.length,
    message: `Triggered ${toTrigger.length} agent(s). They will run autonomously with${signals ? ' signals' : 'out signals'}.`,
  })
}
