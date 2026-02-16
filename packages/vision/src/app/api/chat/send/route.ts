import path from 'path'
import fs from 'fs'
import { NextRequest } from 'next/server'
import { EventBus } from '@jellyfish/shared'
import dotenv from 'dotenv'

// Use same .env as start.sh so Redis and env match Memory/Core/Chat
const rootEnv = [path.join(process.cwd(), '.env'), path.join(process.cwd(), '..', '..', '.env')].find((p) => fs.existsSync(p))
if (rootEnv) dotenv.config({ path: rootEnv })

const WEB_PREFIX = 'web_'
const POLL_MS = 200
const MAX_WAIT_MS = 55_000

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  let body: { text?: string; conversationId?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  const conversationId =
    typeof body.conversationId === 'string' && body.conversationId.startsWith(WEB_PREFIX)
      ? body.conversationId
      : WEB_PREFIX + 'dashboard'

  if (!text) {
    return Response.json({ error: 'text is required' }, { status: 400 })
  }

  const eventBus = new EventBus('vision-web-chat')
  const result = { output: null as string | null, error: null as string | null }

  const onCompleted = (event: { payload?: { conversationId?: string; result?: { output?: string } } }) => {
    const p = event.payload
    if (p?.conversationId === conversationId && p?.result?.output) {
      result.output = p.result.output
      console.log('[Chat/send] Received action.completed for', conversationId)
    }
  }
  const onFailed = (event: { payload?: { conversationId?: string; error?: string } }) => {
    const p = event.payload
    if (p?.conversationId === conversationId && p?.error) {
      result.error = p.error
      console.log('[Chat/send] Received action.failed for', conversationId, p.error)
    }
  }

  try {
    await Promise.all([
      eventBus.subscribeAndWait('action.completed', onCompleted),
      eventBus.subscribeAndWait('action.failed', onFailed),
    ])
  } catch (err) {
    console.error('[Chat/send] Redis subscribe failed:', err)
    return Response.json(
      { error: 'Could not connect to Redis. Is it running? Set REDIS_HOST in .env and run ./start.sh.' },
      { status: 503 }
    )
  }

  console.log('[Chat/send] Publishing message.received', conversationId, 'text length:', text.length)
  await eventBus.publish('message.received', {
    platform: 'web',
    userId: 'web-user',
    conversationId,
    text,
    targetAgentId: undefined,
  })

  const deadline = Date.now() + MAX_WAIT_MS
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_MS))
    if (result.error) {
      return Response.json({ error: result.error }, { status: 200 })
    }
    if (result.output) {
      return Response.json({ output: result.output })
    }
  }

  console.warn('[Chat/send] Timeout for', conversationId, '- no action.completed/action.failed received. Check Memory, Core and Chat processes and Redis.')
  return Response.json(
    {
      error:
        'Timeout waiting for response. Check that Memory, Core and Chat are running (./start.sh), Redis is up, and OPENROUTER_API_KEY or OPENAI_API_KEY is set in .env.',
    },
    { status: 504 }
  )
}
