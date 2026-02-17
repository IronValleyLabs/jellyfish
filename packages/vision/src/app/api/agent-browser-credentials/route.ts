import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const TEAM_FILE = path.join(process.cwd(), 'data', 'team.json')

function getEnvPath(): string {
  const configDir = process.env.JELLYFISH_CONFIG_DIR
  if (configDir) return path.join(configDir, '.env')
  return path.resolve(process.cwd(), '..', '..', '.env')
}

function parseEnvLines(content: string): { key: string; value: string }[] {
  return content.split(/\r?\n/).map((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (match) {
      const [, key, value] = match
      return { key, value: value.replace(/^["']|["']$/g, '').trim() }
    }
    return { key: '', value: '' }
  })
}

function getByKey(lines: { key: string; value: string }[], key: string): string {
  const found = lines.find((l) => l.key === key)
  return found ? found.value : ''
}

async function readTeam(): Promise<{ id: string; browserVisitLoginUrl?: string; browserVisitUser?: string; browserVisitPassword?: string }[]> {
  try {
    await fs.mkdir(path.dirname(TEAM_FILE), { recursive: true })
    const raw = await fs.readFile(TEAM_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * GET ?agentId=xxx — Returns browser login credentials for that agent (per-agent or global fallback).
 * Used by Action when running browser_visit so each Mini Jelly can have its own dashboard login.
 */
export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get('agentId')?.trim()
  const team = await readTeam()
  const member = agentId ? team.find((m) => m.id === agentId) : undefined

  let loginUrl = member?.browserVisitLoginUrl?.trim()
  let user = member?.browserVisitUser?.trim()
  let password = member?.browserVisitPassword

  if (!loginUrl || !user || !password) {
    try {
      const content = await fs.readFile(getEnvPath(), 'utf-8')
      const lines = parseEnvLines(content)
      loginUrl = loginUrl ?? getByKey(lines, 'BROWSER_VISIT_LOGIN_URL')
      user = user ?? getByKey(lines, 'BROWSER_VISIT_USER')
      password = password ?? getByKey(lines, 'BROWSER_VISIT_PASSWORD')
    } catch {
      // no .env or missing keys
    }
  }

  return Response.json({
    loginUrl: loginUrl ?? '',
    user: user ?? '',
    password: password ?? '',
  })
}
