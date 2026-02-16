/**
 * Minimal team member shape needed for mention detection.
 * Full TeamMember is defined in vision (api/team).
 */
export interface TeamMemberForRouting {
  id: string;
  displayName: string;
  aliases?: string[];
}

const ACCENT_MAP: Record<string, string> = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n',
  à: 'a', è: 'e', ì: 'i', ò: 'o', ù: 'u',
  â: 'a', ê: 'e', î: 'i', ô: 'o', û: 'u',
  ä: 'a', ë: 'e', ï: 'i', ö: 'o', ü: 'u',
};

function normalizeForMatch(s: string): string {
  let t = s.toLowerCase().trim();
  t = t.replace(/[\u0300-\u036f]/g, '');
  for (const [accent, plain] of Object.entries(ACCENT_MAP)) {
    t = t.replace(new RegExp(accent, 'g'), plain);
  }
  return t;
}

/**
 * Detects if the message mentions a Mini Jelly by display name or alias.
 * Patterns: @Name, "Name:", "Hola Name,", "/talk Name"
 * Returns the first matching team member or null.
 */
export function detectMention(
  message: string,
  team: TeamMemberForRouting[]
): TeamMemberForRouting | null {
  if (!message || typeof message !== 'string') return null;
  const text = message.trim();
  const normalizedText = normalizeForMatch(text);

  const activeTeam = team.filter(
    (m) => m.displayName && typeof m.displayName === 'string'
  );
  if (activeTeam.length === 0) return null;

  for (const member of activeTeam) {
    const names = [
      normalizeForMatch(member.displayName),
      ...(member.aliases || []).map((a) => normalizeForMatch(String(a))),
    ].filter(Boolean);

    for (const name of names) {
      if (!name) continue;
      // @Name at start or after space
      if (normalizedText.startsWith('@' + name) || normalizedText.includes(' @' + name)) {
        return member;
      }
      // "Name:" or "Name,"
      if (normalizedText.startsWith(name + ':') || normalizedText.startsWith(name + ',')) {
        return member;
      }
      // "Hola Name" / "Hi Name" / "Hello Name"
      const greetings = ['hola', 'hi', 'hello', 'hey', 'ola', 'buenas'];
      for (const g of greetings) {
        const afterGreeting = normalizedText.slice(g.length).trim();
        if (
          (normalizedText.startsWith(g + ' ') || normalizedText.startsWith(g + ',')) &&
          (afterGreeting.startsWith(name + ' ') ||
            afterGreeting.startsWith(name + ',') ||
            afterGreeting.startsWith(name + ':'))
        ) {
          return member;
        }
      }
      // /talk Name
      if (normalizedText.startsWith('/talk ') && normalizedText.includes(name)) {
        const afterTalk = normalizedText.slice(5).trim();
        if (afterTalk.startsWith(name) || afterTalk === name) return member;
      }
    }
  }
  return null;
}
