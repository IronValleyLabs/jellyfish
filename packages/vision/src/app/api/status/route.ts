import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const PROCESSES_FILE = path.join(DATA_DIR, 'processes.json')

interface ProcessEntry {
  pid: number
  spawnedAt: number
}

type ProcessesMap = Record<string, ProcessEntry>

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const raw = await fs.readFile(PROCESSES_FILE, 'utf-8').catch(() => '{}')
    const processes: ProcessesMap = JSON.parse(raw)
    const result: Record<string, { online: boolean; pid: number; uptime: number }> = {}
    for (const [miniJellyId, entry] of Object.entries(processes)) {
      const online = isProcessAlive(entry.pid)
      result[miniJellyId] = {
        online,
        pid: entry.pid,
        uptime: online ? Math.max(0, Math.floor((Date.now() - entry.spawnedAt) / 1000)) : 0,
      }
    }
    return Response.json(result)
  } catch (err) {
    console.error('[GET /api/status]', err)
    return Response.json({ error: 'Failed to read status' }, { status: 500 })
  }
}
