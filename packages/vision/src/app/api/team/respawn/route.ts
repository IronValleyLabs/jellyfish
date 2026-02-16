import { promises as fs } from 'fs'
import path from 'path'
import { MINI_JELLY_TEMPLATES } from '@/lib/mini-jelly-templates'
import { spawnMiniJelly, killMiniJelly, getProcesses } from '@/lib/agent-spawner'
import type { TeamMember } from '../route'

const TEAM_FILE = path.join(process.cwd(), 'data', 'team.json')

async function readTeam(): Promise<TeamMember[]> {
  try {
    const raw = await fs.readFile(TEAM_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function POST() {
  const team = await readTeam()
  const processes = await getProcesses()
  for (const member of team) {
    if (member.status !== 'active') continue
    try {
      await killMiniJelly(member.id)
    } catch {
      // ignore
    }
    const template = MINI_JELLY_TEMPLATES.find((t) => t.id === member.templateId)
    if (!template) continue
    try {
      await spawnMiniJelly(member, template.description)
    } catch (err) {
      console.error(`[respawn] Failed to spawn ${member.id}:`, err)
    }
  }
  return Response.json({ ok: true, spawned: team.filter((m) => m.status === 'active').length })
}
