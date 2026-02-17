import path from 'path';
import { promises as fs } from 'fs';

/** Repo root: from packages/action (when run via pnpm filter) go up two levels. */
const REPO_ROOT = path.resolve(process.cwd(), '..', '..');

/**
 * Allowed paths for agent to write (relative to repo root). Supports:
 * - docs/*.md
 * - data/agent-knowledge.md, data/agent-role.md, data/agent-kpis.md
 */
const ALLOWED_PATTERNS = [
  /^docs\/[a-zA-Z0-9_.-]+\.md$/,
  /^data\/agent-knowledge\.md$/,
  /^data\/agent-role\.md$/,
  /^data\/agent-kpis\.md$/,
];

function isPathAllowed(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return ALLOWED_PATTERNS.some((re) => re.test(normalized));
}

function resolvePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const resolved = path.resolve(REPO_ROOT, normalized);
  const rel = path.relative(REPO_ROOT, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Path outside allowed directory');
  }
  return resolved;
}

export class WriteFileExecutor {
  async execute(
    relativePath: string,
    content: string
  ): Promise<{ output: string; error?: string }> {
    const pathTrimmed = relativePath.trim();
    if (!pathTrimmed) {
      return { output: '', error: 'File path is required.' };
    }
    if (!isPathAllowed(pathTrimmed)) {
      return {
        output: '',
        error: `Path not allowed. You can only write to: docs/*.md, data/agent-knowledge.md, data/agent-role.md, data/agent-kpis.md`,
      };
    }
    try {
      const fullPath = resolvePath(pathTrimmed);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
      return { output: `Updated ${pathTrimmed}. The file is saved and will be used as context.` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { output: '', error: `Failed to write file: ${msg}` };
    }
  }
}
