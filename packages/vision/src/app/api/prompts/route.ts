import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const PROMPTS_FILE = path.join(DATA_DIR, 'prompts.json')

export interface PromptEntry {
  miniJellyId: string
  systemPrompt: string
  updatedAt: number
}

export type PromptsStore = Record<string, Omit<PromptEntry, 'miniJellyId'>>

async function readPrompts(): Promise<PromptsStore> {
  try {
    const raw = await fs.readFile(PROMPTS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function writePrompts(store: PromptsStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(PROMPTS_FILE, JSON.stringify(store, null, 2), 'utf-8')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const miniJellyId = searchParams.get('miniJellyId')
  if (!miniJellyId) {
    return Response.json({ error: 'miniJellyId query param required' }, { status: 400 })
  }
  try {
    const store = await readPrompts()
    const entry = store[miniJellyId]
    if (!entry) {
      return Response.json({ systemPrompt: null, updatedAt: null }, { status: 200 })
    }
    return Response.json({
      systemPrompt: entry.systemPrompt,
      updatedAt: entry.updatedAt,
    })
  } catch (err) {
    console.error('[GET /api/prompts]', err)
    return Response.json({ error: 'Failed to read prompts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let body: { miniJellyId: string; systemPrompt: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { miniJellyId, systemPrompt } = body
  if (!miniJellyId || typeof miniJellyId !== 'string') {
    return Response.json({ error: 'miniJellyId is required' }, { status: 400 })
  }
  if (typeof systemPrompt !== 'string') {
    return Response.json({ error: 'systemPrompt must be a string' }, { status: 400 })
  }
  try {
    const store = await readPrompts()
    const updatedAt = Date.now()
    store[miniJellyId] = { systemPrompt, updatedAt }
    await writePrompts(store)
    return Response.json({ ok: true, miniJellyId, updatedAt })
  } catch (err) {
    console.error('[POST /api/prompts]', err)
    return Response.json({ error: 'Failed to save prompt' }, { status: 500 })
  }
}
