import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const ROOT = path.resolve(process.cwd(), '..', '..')
const ASSIGNMENTS_FILE = path.join(ROOT, 'data', 'conversation-assignments.json')

async function readAssignments(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(ASSIGNMENTS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function writeAssignments(assignments: Record<string, string>): Promise<void> {
  await fs.mkdir(path.dirname(ASSIGNMENTS_FILE), { recursive: true })
  await fs.writeFile(ASSIGNMENTS_FILE, JSON.stringify(assignments, null, 2), 'utf-8')
}

export async function GET() {
  try {
    const assignments = await readAssignments()
    return Response.json(assignments)
  } catch (err) {
    console.error('[GET /api/assignments]', err)
    return Response.json({ error: 'Failed to read assignments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let body: { conversationId: string; assignedAgentId?: string | null }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { conversationId, assignedAgentId } = body
  if (!conversationId || typeof conversationId !== 'string') {
    return Response.json({ error: 'conversationId is required' }, { status: 400 })
  }
  const assignments = await readAssignments()
  const value =
    assignedAgentId != null && assignedAgentId !== ''
      ? assignedAgentId.startsWith('mini-jelly-')
        ? assignedAgentId
        : `mini-jelly-${assignedAgentId}`
      : null
  if (value) {
    assignments[conversationId] = value
  } else {
    delete assignments[conversationId]
  }
  await writeAssignments(assignments)
  return Response.json({ ok: true, conversationId, assignedAgentId: value ?? null })
}
