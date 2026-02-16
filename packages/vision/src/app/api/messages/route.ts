import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs'

const ROOT = path.resolve(process.cwd(), '..', '..')

function getDbPath(): string {
  try {
    const envPath = path.join(ROOT, '.env')
    const content = fs.readFileSync(envPath, 'utf-8')
    const match = content.match(/DATABASE_URL=(.+)/m)
    const value = match?.[1]?.replace(/^["']|["']$/g, '').trim()
    if (value && !path.isAbsolute(value)) return path.join(ROOT, value)
    if (value) return value
  } catch {
    // ignore
  }
  return path.join(ROOT, 'sqlite.db')
}

export const dynamic = 'force-dynamic'

export interface ChatMessage {
  id: number
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  userId?: string | null
  platform?: string | null
  agentId?: string | null
}

export async function GET(request: NextRequest) {
  try {
    const dbPath = getDbPath()
    if (!fs.existsSync(dbPath)) return Response.json([])
    const Database = require('better-sqlite3')
    const db = new Database(dbPath, { readonly: true })
    const tableExists = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='messages'").get()
    if (!tableExists) {
      db.close()
      return Response.json([])
    }
    const conversationId = request.nextUrl.searchParams.get('conversationId')
    const limit = Math.min(500, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '200', 10)))

    const hasExtraCols = (() => {
      try {
        db.prepare('SELECT user_id FROM messages LIMIT 0').run()
        return true
      } catch {
        return false
      }
    })()

    const cols = hasExtraCols
      ? 'id, conversation_id as conversationId, role, content, timestamp, user_id as userId, platform, agent_id as agentId'
      : 'id, conversation_id as conversationId, role, content, timestamp'

    let rows: ChatMessage[]
    if (conversationId) {
      const stmt = db.prepare(
        `SELECT ${cols} FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC LIMIT ?`
      )
      rows = stmt.all(conversationId, limit) as ChatMessage[]
    } else {
      const stmt = db.prepare(
        `SELECT ${cols} FROM messages ORDER BY timestamp DESC LIMIT ?`
      )
      rows = stmt.all(limit) as ChatMessage[]
      rows.reverse()
    }
    db.close()

    return Response.json(rows)
  } catch (err) {
    console.error('[GET /api/messages]', err)
    return Response.json({ error: 'Failed to read messages' }, { status: 500 })
  }
}
