import path from 'path';
import { promises as fs } from 'fs';
import type { TeamMemberForRouting } from '@jellyfish/shared';

const TEAM_JSON_ENV = 'TEAM_JSON_PATH';

function getTeamJsonPath(): string {
  const envPath = process.env[TEAM_JSON_ENV];
  if (envPath && envPath.trim()) {
    return path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath.trim());
  }
  const repoRoot = path.resolve(__dirname, '../../..');
  return path.join(repoRoot, 'packages', 'vision', 'data', 'team.json');
}

export async function loadTeam(): Promise<TeamMemberForRouting[]> {
  const filePath = getTeamJsonPath();
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m: unknown) => m && typeof m === 'object' && typeof (m as { id: unknown }).id === 'string')
      .map((m: { id: string; name?: string; displayName?: string; aliases?: string[] }) => ({
        id: m.id,
        displayName: typeof m.displayName === 'string' ? m.displayName : (m.name || m.id),
        aliases: Array.isArray(m.aliases) ? m.aliases.filter((a): a is string => typeof a === 'string') : [],
      }));
  } catch {
    return [];
  }
}
