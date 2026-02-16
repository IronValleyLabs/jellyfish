import path from 'path';
import { promises as fs } from 'fs';

const AGENT_KEY = 'core' as const;

/**
 * Resolves the path to system-prompts.json.
 * - SYSTEM_PROMPTS_FILE (env): use as-is if set (absolute or relative to cwd).
 * - Else: repo root + packages/vision/data/system-prompts.json (from packages/core/dist).
 */
function getSystemPromptsPath(): string {
  const envPath = process.env.SYSTEM_PROMPTS_FILE;
  if (envPath && envPath.trim()) {
    return path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath.trim());
  }
  const repoRoot = path.resolve(__dirname, '../../..');
  return path.join(repoRoot, 'packages', 'vision', 'data', 'system-prompts.json');
}

/**
 * Loads the system prompt for the Core agent from the shared JSON file.
 * Used by the main Core agent (not Mini Jellys).
 * Returns null on any error or missing/invalid data; caller should use a default.
 */
export async function loadSystemPrompt(): Promise<string | null> {
  const filePath = getSystemPromptsPath();
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[CoreAgent] Could not read system prompts file (${filePath}): ${msg}`);
    return null;
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.warn('[CoreAgent] system-prompts.json is not valid JSON');
    return null;
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }
  const value = (data as Record<string, unknown>)[AGENT_KEY];
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
