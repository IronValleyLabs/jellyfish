import path from 'path';
import { promises as fs } from 'fs';

const ROOT = path.resolve(process.cwd());
const SKILLS_FILE = path.join(ROOT, 'data', 'agent-created-skills.json');

export interface AgentCreatedSkill {
  id: string;
  agentId: string;
  name: string;
  description: string;
  instructions: string;
  createdAt: number;
}

async function readSkills(): Promise<AgentCreatedSkill[]> {
  try {
    await fs.mkdir(path.dirname(SKILLS_FILE), { recursive: true });
    const raw = await fs.readFile(SKILLS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeSkills(skills: AgentCreatedSkill[]): Promise<void> {
  await fs.mkdir(path.dirname(SKILLS_FILE), { recursive: true });
  await fs.writeFile(SKILLS_FILE, JSON.stringify(skills, null, 2), 'utf-8');
}

function generateId(): string {
  return `skill-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class CreateSkillExecutor {
  async execute(
    agentId: string,
    name: string,
    description: string,
    instructions: string
  ): Promise<{ output: string; error?: string }> {
    const n = (name || '').trim();
    const d = (description || '').trim();
    const i = (instructions || '').trim();
    if (!n) {
      return { output: '', error: 'Skill name is required.' };
    }
    try {
      const skills = await readSkills();
      const skill: AgentCreatedSkill = {
        id: generateId(),
        agentId: agentId || 'core-agent-1',
        name: n,
        description: d,
        instructions: i,
        createdAt: Date.now(),
      };
      skills.push(skill);
      await writeSkills(skills);
      return {
        output: `Skill "${skill.name}" created. You can use it when the human asks or when relevant. It will be included in your context from now on.`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { output: '', error: message };
    }
  }
}

