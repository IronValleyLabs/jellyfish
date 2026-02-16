/**
 * All skills: implemented (agent can use) and coming soon (shown in marketplace).
 * Per-agent skills are chosen from IMPLEMENTED_SKILLS; empty = all allowed.
 */
export interface AgentSkillDef {
  id: string
  label: string
  description: string
  category: string
  icon: string
  implemented: boolean
}

export const IMPLEMENTED_SKILLS: AgentSkillDef[] = [
  { id: 'bash', label: 'Bash', description: 'Run terminal commands in workspace (mkdir, ls, cat)', category: 'System', icon: '💻', implemented: true },
  { id: 'websearch', label: 'Web Search', description: 'Search the web with DuckDuckGo', category: 'Research', icon: '🔍', implemented: true },
  { id: 'draft', label: 'Draft', description: 'Write copies, captions, emails (LLM)', category: 'Content', icon: '✍️', implemented: true },
  { id: 'generate_image', label: 'Generate Image', description: 'Create images (Nano Banana Pro)', category: 'Creative', icon: '🎨', implemented: true },
  { id: 'instagram_post', label: 'Instagram Post', description: 'Post image + caption to Instagram', category: 'Social', icon: '📸', implemented: true },
  { id: 'metricool_schedule', label: 'Metricool', description: 'Schedule posts in Metricool', category: 'Social', icon: '📅', implemented: true },
]

export const COMING_SOON_SKILLS: AgentSkillDef[] = [
  { id: 'write_file', label: 'Write File', description: 'Create files and folders in workspace', category: 'System', icon: '📄', implemented: false },
  { id: 'read_file', label: 'Read File', description: 'Read files from workspace', category: 'System', icon: '📖', implemented: false },
  { id: 'email', label: 'Email', description: 'Send emails via SMTP', category: 'Communication', icon: '📧', implemented: false },
  { id: 'calendar', label: 'Calendar', description: 'Manage Google Calendar events', category: 'Productivity', icon: '📅', implemented: false },
  { id: 'pdf', label: 'PDF Creator', description: 'Generate PDF documents', category: 'Documents', icon: '📑', implemented: false },
  { id: 'slack', label: 'Slack', description: 'Post and read Slack messages', category: 'Communication', icon: '💬', implemented: false },
  { id: 'twitter', label: 'Twitter/X', description: 'Post and schedule tweets', category: 'Social', icon: '🐦', implemented: false },
  { id: 'notion', label: 'Notion', description: 'Read and update Notion pages', category: 'Productivity', icon: '📝', implemented: false },
  { id: 'sheets', label: 'Google Sheets', description: 'Read and write spreadsheets', category: 'Data', icon: '📊', implemented: false },
  { id: 'browser', label: 'Browser', description: 'Navigate and scrape web pages', category: 'Research', icon: '🌐', implemented: false },
]

export const ALL_SKILLS: AgentSkillDef[] = [...IMPLEMENTED_SKILLS, ...COMING_SOON_SKILLS]
export const IMPLEMENTED_IDS = IMPLEMENTED_SKILLS.map((s) => s.id)

export function parseSkills(skills: unknown): string[] {
  if (!Array.isArray(skills)) return []
  return skills.filter((s): s is string => typeof s === 'string' && IMPLEMENTED_IDS.includes(s))
}

export function getSkillById(id: string): AgentSkillDef | undefined {
  return ALL_SKILLS.find((s) => s.id === id)
}
