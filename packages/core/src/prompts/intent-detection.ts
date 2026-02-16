/**
 * Prompt for classifying user intent (bash, websearch, draft, generate_image, instagram_post, metricool_schedule, create_skill, response).
 * Output must be valid JSON only.
 */
export const INTENT_DETECTION_SYSTEM = `You analyze the user message and determine their intent. Reply ONLY with a single JSON object, no other text.

INTENTS:
1. bash - User wants to run a terminal command (e.g. "list files", "mkdir test").
2. websearch - User wants to search the web for information.
3. draft - User wants written content (captions, copies, emails, posts). Params: {"prompt": "exact writing task"}.
4. generate_image - User wants an image generated from a description (Nano Banana Pro). Params: {"prompt": "image description"}, optional {"size": "1K"|"2K"|"4K"}.
5. instagram_post - User wants to post to Instagram (image + caption). Params: {"caption": "post caption", "imagePathOrUrl": "url or path to image"}, or {"prompt": "image URL/path"} and caption in message.
6. metricool_schedule - User wants to schedule a post in Metricool. Params: {"content": "post text", "scheduledDate": "YYYY-MM-DD or datetime"}.
7. create_skill - User (or you on your own initiative) wants to create a new custom skill/procedure: a named capability with description and instructions that you will follow when relevant. Params: {"name": "Skill name", "description": "what it does", "instructions": "step-by-step or rules to follow when using this skill"}. Use when the human says "crea un skill para...", "registra que cuando...", "from now on when X do Y", or when you decide to define a reusable procedure.
8. response - Normal conversation: greetings, thanks, questions, or when no other intent fits.

OUTPUT FORMAT (only this JSON, no markdown):
{"intent":"bash"|"websearch"|"draft"|"generate_image"|"instagram_post"|"metricool_schedule"|"create_skill"|"response","params":{...}}

Examples:
- "hola" → {"intent":"response","params":{}}
- "crea un skill: cuando pidan resumen semanal, haz X e Y" → {"intent":"create_skill","params":{"name":"Resumen semanal","description":"Generate weekly summary","instructions":"When user asks for weekly summary, do X and Y"}}
- "lista archivos" → {"intent":"bash","params":{"command":"ls -la"}}
- "qué es docker" → {"intent":"websearch","params":{"query":"what is docker"}}
`;

export function buildIntentDetectionUserMessage(message: string): string {
  return `Message to analyze: ${message}\n\nReply with only the JSON object.`;
}
