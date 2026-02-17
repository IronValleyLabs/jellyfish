/**
 * GET /api/signals — "What's happening in the world" for autonomous agents.
 * Returns a short paragraph of trends/news so agents can "see and attack".
 * Cached for 1 hour to avoid repeated LLM calls.
 */
import { NextRequest } from 'next/server'

function getLLMConfig(): { baseURL: string; model: string; headers: Record<string, string> } {
  const provider = (process.env.LLM_PROVIDER ?? '').toLowerCase()
  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY?.trim() ?? ''
    if (!apiKey) throw new Error('OPENAI_API_KEY required')
    return {
      baseURL: 'https://api.openai.com/v1',
      model: process.env.AI_MODEL ?? 'gpt-4o',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    }
  }
  if (provider === 'openrouter' || process.env.OPENROUTER_API_KEY?.trim()) {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim() ?? ''
    if (!apiKey) throw new Error('OPENROUTER_API_KEY required')
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      HTTP_Referer: process.env.LLM_HTTP_REFERER ?? 'https://github.com/IronValleyLabs/jellyfish',
      'X-Title': process.env.LLM_X_TITLE ?? 'Jellyfish',
    }
    return {
      baseURL: 'https://openrouter.ai/api/v1',
      model: process.env.AI_MODEL ?? 'anthropic/claude-3.5-sonnet',
      headers,
    }
  }
  if (process.env.OPENAI_API_KEY?.trim()) {
    const apiKey = process.env.OPENAI_API_KEY.trim()
    return {
      baseURL: 'https://api.openai.com/v1',
      model: process.env.AI_MODEL ?? 'gpt-4o',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    }
  }
  throw new Error('Set OPENROUTER_API_KEY or OPENAI_API_KEY in .env')
}

const CACHE_MS = 60 * 60 * 1000 // 1 hour
let cached: { text: string; at: number } | null = null

export async function GET(request: NextRequest) {
  const now = Date.now()
  if (cached && now - cached.at < CACHE_MS) {
    return Response.json({ signals: cached.text })
  }
  try {
    const { baseURL, model, headers } = getLLMConfig()
    const prompt = `In 2-4 short sentences, list 3-5 trending topics, news, or opportunities right now that an autonomous social/media or content agent could act on (e.g. create a post, react, schedule content). Be concrete and current. No preamble.`
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user' as const, content: prompt }],
        temperature: 0.5,
        max_tokens: 280,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      return Response.json({ error: `LLM failed: ${res.status}`, signals: '' }, { status: 502 })
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const text = data.choices?.[0]?.message?.content?.trim() ?? ''
    cached = { text: text || 'No trends fetched.', at: now }
    return Response.json({ signals: cached.text })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[Signals]', msg)
    if (cached) return Response.json({ signals: cached.text })
    return Response.json({ error: msg, signals: '' }, { status: 500 })
  }
}
