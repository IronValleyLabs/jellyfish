import { NextRequest } from 'next/server'
import { EventBus } from '@jellyfish/shared'

const WEB_PREFIX = 'web_'
const POLL_MS = 200
const MAX_WAIT_MS = 55_000
/** Give Redis time to register our subscriptions before we trigger the pipeline */
const SUBSCRIBE_SETTLE_MS = 400

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
    }
  }
  const onFailed = (event: { payload?: { conversationId?: string; error?: string } }) => {
    const p = event.payload
    if (p?.conversationId === conversationId && p?.error) {
      result.error = p.error
    }
  }

  eventBus.subscribe('action.completed', onCompleted)
  eventBus.subscribe('action.failed', onFailed)
  await new Promise((r) => setTimeout(r, SUBSCRIBE_SETTLE_MS))

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

  return Response.json(
    {
      error:
        'Timeout waiting for response. Check that Memory, Core and Chat are running (./start.sh), Redis is up, and OPENROUTER_API_KEY or OPENAI_API_KEY is set in .env.',
    },
    { status: 504 }
  )
}
