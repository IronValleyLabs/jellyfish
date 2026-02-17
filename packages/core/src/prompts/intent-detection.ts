/**
 * Prompt for classifying user intent (includes store_credential, write_file).
 * Output must be valid JSON only.
 */
export const INTENT_DETECTION_SYSTEM = `You analyze the user message and determine their intent. Reply ONLY with a single JSON object, no other text.

INTENTS:
1. bash - User wants to run a terminal command (e.g. "list files", "mkdir test").
2. websearch - User wants to search the web (not open a URL in a browser). Params: {"query": "search terms"}.
3. draft - User wants written content (captions, copies, emails, posts). Params: {"prompt": "exact writing task"}.
4. generate_image - User wants an image generated from a description (Nano Banana Pro). Params: {"prompt": "image description"}, optional {"size": "1K"|"2K"|"4K"}.
5. instagram_post - User wants to post to Instagram (image + caption). Params: {"caption": "post caption", "imagePathOrUrl": "url or path to image"}.
6. metricool_schedule - User wants to schedule a post in Metricool. Params: {"content": "post text", "scheduledDate": "YYYY-MM-DD or datetime"}.
7. create_skill - User wants to create a new custom skill/procedure. Params: {"name": "Skill name", "description": "what it does", "instructions": "step-by-step or rules"}.
8. browser_visit - User wants to open a URL in a real browser. Params: {"url": "https://full-url.com"}.
9. store_credential - User is giving you a password, API key, token, or login to SAVE for later use. Params: {"key": "ENV_VAR_NAME", "value": "the secret"}. Map what they say to the correct key: Lovable/browser login → BROWSER_VISIT_LOGIN_URL, BROWSER_VISIT_USER, BROWSER_VISIT_PASSWORD. Metricool → METRICOOL_EMAIL, METRICOOL_PASSWORD. Instagram → INSTAGRAM_USER, INSTAGRAM_PASSWORD. Telegram → TELEGRAM_BOT_TOKEN, TELEGRAM_MAIN_USER_ID. OpenRouter/LLM → OPENROUTER_API_KEY or OPENAI_API_KEY. Draft model → DRAFT_OPENAI_API_KEY. Image gen → NANO_BANANA_PRO_API_KEY. Use the exact key name.
10. write_file - User wants to update a doc or your role/KPIs. Params: {"filePath": "docs/something.md | data/agent-knowledge.md | data/agent-role.md | data/agent-kpis.md", "content": "full markdown content"}. Use for: "guárdalo en docs", "aprende esto" → agent-knowledge.md; "cambia tu descripción de puesto", "actualiza tu rol" → agent-role.md; "cambia tus KPIs", "actualiza tus objetivos" → agent-kpis.md.
11. response - Normal conversation: greetings, thanks, questions, or when no other intent fits.

OUTPUT FORMAT (only this JSON, no markdown):
{"intent":"bash"|"websearch"|"draft"|"generate_image"|"instagram_post"|"metricool_schedule"|"create_skill"|"browser_visit"|"store_credential"|"write_file"|"response","params":{...}}

Examples:
- "hola" → {"intent":"response","params":{}}
- "la contraseña de Lovable es miPass123" → {"intent":"store_credential","params":{"key":"BROWSER_VISIT_PASSWORD","value":"miPass123"}}
- "guarda el usuario de Metricool: user@mail.com" → {"intent":"store_credential","params":{"key":"METRICOOL_EMAIL","value":"user@mail.com"}}
- "actualiza data/agent-knowledge.md con: El proyecto usa Lovable para el front." → {"intent":"write_file","params":{"filePath":"data/agent-knowledge.md","content":"# Agent knowledge\\n\\nEl proyecto usa Lovable para el front."}}
- "abre cosmos-div.lovable.app" → {"intent":"browser_visit","params":{"url":"https://cosmos-div.lovable.app"}}
`;

export function buildIntentDetectionUserMessage(message: string): string {
  return `Message to analyze: ${message}\n\nReply with only the JSON object.`;
}
