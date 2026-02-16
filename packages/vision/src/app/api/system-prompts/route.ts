import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const SYSTEM_PROMPTS_FILE = path.join(DATA_DIR, 'system-prompts.json')

const VALID_AGENTS = ['core', 'memory', 'action'] as const
type AgentKey = (typeof VALID_AGENTS)[number]

function isAgentKey(s: string): s is AgentKey {
  return VALID_AGENTS.includes(s as AgentKey)
}

export type SystemPromptsStore = Record<AgentKey, string>

async function readSystemPrompts(): Promise<Partial<SystemPromptsStore>> {
  try {
    const raw = await fs.readFile(SYSTEM_PROMPTS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function writeSystemPrompts(store: Partial<SystemPromptsStore>): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(SYSTEM_PROMPTS_FILE, JSON.stringify(store, null, 2), 'utf-8')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const agent = searchParams.get('agent')
  if (!agent || !isAgentKey(agent)) {
    return Response.json(
      { error: 'agent query param required: core | memory | action' },
      { status: 400 }
    )
  }
  try {
    const store = await readSystemPrompts()
    const prompt = store[agent] ?? null
    return Response.json({ prompt })
  } catch (err) {
    console.error('[GET /api/system-prompts]', err)
    return Response.json({ error: 'Failed to read system prompts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let body: { agent: string; prompt: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { agent, prompt } = body
  if (!agent || !isAgentKey(agent)) {
    return Response.json(
      { error: 'agent is required: core | memory | action' },
      { status: 400 }
    )
  }
  if (typeof prompt !== 'string') {
    return Response.json({ error: 'prompt must be a string' }, { status: 400 })
  }
  try {
    const store = await readSystemPrompts()
    store[agent] = prompt
    await writeSystemPrompts(store)
    return Response.json({ ok: true, agent })
  } catch (err) {
    console.error('[POST /api/system-prompts]', err)
    return Response.json({ error: 'Failed to save system prompt' }, { status: 500 })
  }
}
