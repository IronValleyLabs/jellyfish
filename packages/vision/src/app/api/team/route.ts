import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { MINI_JELLY_TEMPLATES } from '@/lib/mini-jelly-templates'
import { parseSkills } from '@/lib/agent-skills'
import { spawnMiniJelly, killMiniJelly } from '@/lib/agent-spawner'

const TEAM_FILE = path.join(process.cwd(), 'data', 'team.json')
const MAX_TEAM_SIZE = 20

export interface TeamMember {
  id: string
  templateId: string
  name: string
  role: string
  icon: string
  jobDescription?: string
  /** Custom goals/targets (e.g. "Post 3 times per day", one per line). Editable when adding from template. */
  goals?: string
  /** Human-readable description of what access this agent has (e.g. "Login: x@y.com", "API keys in .env", "No bank API"). Do not store real passwords. */
  accessNotes?: string
  /** KPIs this agent is measured on (e.g. ROAS > 2, response time < 1h). Agent works to achieve them and reports findings to human. */
  kpis?: string
  /** Agent spec in Markdown (instructions, tone, constraints). */
  specMarkdown?: string
  /** Skill IDs this agent can use. Empty = all implemented skills. */
  skills?: string[]
  status: 'active' | 'paused'
  addedAt: number
  nanoCount: number
  actionsToday: number
  costToday: number
  lastAction: string
  /** Display name for mentions (e.g. "MiniGrowth"). Defaults to name. */
  displayName: string
  /** Optional aliases for natural routing (e.g. ["Growth", "Crecimiento"]). */
  aliases?: string[]
  /** Conversation IDs currently assigned to this agent (e.g. ["telegram:123", "whatsapp:456"]). */
  assignedChats?: string[]
  /** When true (default), this agent is woken by signal watcher / "trigger all". When false, only direct messages or direct trigger wake it. */
  wakeOnSignals?: boolean
  /** Per-agent dashboard login (overrides global Settings). Used for browser_visit / Metricool. */
  browserVisitLoginUrl?: string
  browserVisitUser?: string
  browserVisitPassword?: string
}

function normalizeMember(m: Record<string, unknown>): TeamMember {
  const base = m as unknown as TeamMember
  return {
    ...base,
    displayName: typeof base.displayName === 'string' ? base.displayName : base.name,
    aliases: Array.isArray(base.aliases) ? base.aliases.filter((a): a is string => typeof a === 'string') : [],
    assignedChats: Array.isArray(base.assignedChats) ? base.assignedChats.filter((c): c is string => typeof c === 'string') : [],
    skills: parseSkills(base.skills),
    wakeOnSignals: base.wakeOnSignals === false ? false : true,
  }
}

async function readTeam(): Promise<TeamMember[]> {
  try {
    await fs.mkdir(path.dirname(TEAM_FILE), { recursive: true })
    const raw = await fs.readFile(TEAM_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map((m: Record<string, unknown>) => normalizeMember(m)) : []
  } catch {
    return []
  }
}

async function writeTeam(team: TeamMember[]): Promise<void> {
  await fs.mkdir(path.dirname(TEAM_FILE), { recursive: true })
  await fs.writeFile(TEAM_FILE, JSON.stringify(team, null, 2), 'utf-8')
}

function generateId(): string {
  return `mj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function GET() {
  const team = await readTeam()
  // Do not send password to client; UI uses empty + "leave blank to keep"
  const safe = team.map((m) => {
    const { browserVisitPassword: _, ...rest } = m
    return rest
  })
  return Response.json(safe)
}

export async function POST(request: NextRequest) {
  const team = await readTeam()
  if (team.length >= MAX_TEAM_SIZE) {
    return Response.json(
      { error: `Maximum ${MAX_TEAM_SIZE} Mini Jellys allowed` },
      { status: 400 }
    )
  }
  let body: {
    templateId?: string
    custom?: boolean
    name?: string
    role?: string
    icon?: string
    jobDescription?: string
    goals?: string
    accessNotes?: string
    kpis?: string
    specMarkdown?: string
    skills?: string[]
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { templateId, custom, name, role, icon, jobDescription, goals, accessNotes, kpis, specMarkdown, skills } = body

  let member: TeamMember
  let descriptionForSpawn: string

  if (custom && name && typeof name === 'string' && name.trim()) {
    const customName = name.trim()
    const customRole = (typeof role === 'string' ? role.trim() : '') || customName
    const customIcon = (typeof icon === 'string' ? icon.trim() : '') || '🪼'
    member = {
      id: generateId(),
      templateId: 'custom',
      name: customName,
      role: customRole,
      icon: customIcon.slice(0, 4),
      jobDescription: typeof jobDescription === 'string' ? jobDescription : undefined,
      goals: typeof goals === 'string' ? goals : undefined,
      accessNotes: typeof accessNotes === 'string' ? accessNotes : undefined,
      kpis: typeof kpis === 'string' ? kpis : undefined,
      specMarkdown: typeof specMarkdown === 'string' ? specMarkdown : undefined,
      skills: parseSkills(skills),
      status: 'active',
      addedAt: Date.now(),
      nanoCount: 0,
      actionsToday: 0,
      costToday: 0,
      lastAction: 'Never',
      displayName: customName,
      aliases: [],
      assignedChats: [],
      wakeOnSignals: true,
    }
    descriptionForSpawn = jobDescription && typeof jobDescription === 'string' ? jobDescription : customRole
  } else {
    if (!templateId || typeof templateId !== 'string') {
      return Response.json({ error: 'templateId is required, or use custom: true with name' }, { status: 400 })
    }
    const template = MINI_JELLY_TEMPLATES.find((t) => t.id === templateId)
    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 })
    }
    member = {
      id: generateId(),
      templateId: template.id,
      name: template.name,
      role: template.name,
      icon: template.icon,
      jobDescription: typeof jobDescription === 'string' ? jobDescription : undefined,
      goals: typeof goals === 'string' ? goals : undefined,
      accessNotes: typeof accessNotes === 'string' ? accessNotes : undefined,
      kpis: typeof kpis === 'string' ? kpis : undefined,
      specMarkdown: typeof specMarkdown === 'string' ? specMarkdown : undefined,
      skills: parseSkills(skills),
      status: 'active',
      addedAt: Date.now(),
      nanoCount: 0,
      actionsToday: 0,
      costToday: 0,
      lastAction: 'Never',
      displayName: template.name,
      aliases: [],
      assignedChats: [],
      wakeOnSignals: true,
    }
    descriptionForSpawn = template.description
  }

  team.push(member)
  await writeTeam(team)
  try {
    await spawnMiniJelly(member, descriptionForSpawn)
  } catch (err) {
    console.error('[POST /api/team] spawn failed:', err)
    team.pop()
    await writeTeam(team)
    const message = err instanceof Error ? err.message : 'Failed to start agent process'
    return Response.json({ error: message }, { status: 500 })
  }
  return Response.json(member, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return Response.json({ error: 'id query param required' }, { status: 400 })
  }
  let body: { jobDescription?: string; goals?: string; accessNotes?: string; kpis?: string; specMarkdown?: string; skills?: string[]; status?: 'active' | 'paused'; displayName?: string; aliases?: string[]; wakeOnSignals?: boolean; browserVisitLoginUrl?: string; browserVisitUser?: string; browserVisitPassword?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const team = await readTeam()
  const index = team.findIndex((m) => m.id === id)
  if (index === -1) {
    return Response.json({ error: 'Member not found' }, { status: 404 })
  }
  if (body.jobDescription !== undefined) team[index].jobDescription = body.jobDescription
  if (body.goals !== undefined) team[index].goals = typeof body.goals === 'string' ? body.goals : undefined
  if (body.accessNotes !== undefined) team[index].accessNotes = typeof body.accessNotes === 'string' ? body.accessNotes : undefined
  if (body.kpis !== undefined) team[index].kpis = typeof body.kpis === 'string' ? body.kpis : undefined
  if (body.specMarkdown !== undefined) team[index].specMarkdown = typeof body.specMarkdown === 'string' ? body.specMarkdown : undefined
  if (body.skills !== undefined) team[index].skills = parseSkills(body.skills)
  if (body.displayName !== undefined && typeof body.displayName === 'string') team[index].displayName = body.displayName
  if (body.aliases !== undefined && Array.isArray(body.aliases)) team[index].aliases = body.aliases.filter((a): a is string => typeof a === 'string')
  if (body.wakeOnSignals !== undefined) team[index].wakeOnSignals = body.wakeOnSignals
  if (body.browserVisitLoginUrl !== undefined) team[index].browserVisitLoginUrl = typeof body.browserVisitLoginUrl === 'string' ? body.browserVisitLoginUrl : undefined
  if (body.browserVisitUser !== undefined) team[index].browserVisitUser = typeof body.browserVisitUser === 'string' ? body.browserVisitUser : undefined
  if (body.browserVisitPassword !== undefined) team[index].browserVisitPassword = typeof body.browserVisitPassword === 'string' ? body.browserVisitPassword : undefined
  if (body.status !== undefined) {
    const prevStatus = team[index].status
    team[index].status = body.status
    if (prevStatus === 'active' && body.status === 'paused') {
      await killMiniJelly(id)
    } else if (prevStatus === 'paused' && body.status === 'active') {
      const template = MINI_JELLY_TEMPLATES.find((t) => t.id === team[index].templateId)
      if (template) {
        try {
          await spawnMiniJelly(team[index], template.description)
        } catch (err) {
          console.error('[PATCH /api/team] spawn failed:', err)
          team[index].status = 'paused'
          await writeTeam(team)
          return Response.json({ error: 'Failed to start agent process' }, { status: 500 })
        }
      }
    }
  }
  await writeTeam(team)
  return Response.json(team[index])
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return Response.json({ error: 'id query param required' }, { status: 400 })
  }
  const team = await readTeam()
  if (!team.some((m) => m.id === id)) {
    return Response.json({ error: 'Member not found' }, { status: 404 })
  }
  await killMiniJelly(id)
  const filtered = team.filter((m) => m.id !== id)
  await writeTeam(filtered)
  return Response.json({ ok: true })
}
