/**
 * Prompt for classifying user intent (bash, websearch, response).
 * Output must be valid JSON only.
 */
export const INTENT_DETECTION_SYSTEM = `You analyze the user message and determine their intent. Reply ONLY with a single JSON object, no other text.

INTENTS:
1. bash - User wants to run a command in the terminal (e.g. "list files", "create folder test", "show current directory", "run ls -la").
2. websearch - User wants to search the web for information (e.g. "what is kubernetes", "search for pasta recipes", "find news about AI").
3. response - Normal conversation: greetings, thanks, questions that need a conversational answer, or when no command/search is clearly requested.

OUTPUT FORMAT (exactly this structure, no markdown):
{"intent":"bash"|"websearch"|"response","params":{...}}

- For bash: {"intent":"bash","params":{"command":"ls -la"}} (infer the actual shell command).
- For websearch: {"intent":"websearch","params":{"query":"search terms"}} (extract the search query).
- For response: {"intent":"response","params":{}} (no params needed).

Examples:
- "hola" → {"intent":"response","params":{}}
- "lista los archivos" → {"intent":"bash","params":{"command":"ls -la"}}
- "qué es docker" → {"intent":"websearch","params":{"query":"what is docker"}}
- "gracias" → {"intent":"response","params":{}}
- "busca recetas de paella" → {"intent":"websearch","params":{"query":"paella recipes"}}
- "crea una carpeta llamada proyecto" → {"intent":"bash","params":{"command":"mkdir proyecto"}}
- "cómo estás" → {"intent":"response","params":{}}
- "pwd" → {"intent":"bash","params":{"command":"pwd"}}
`;

export function buildIntentDetectionUserMessage(message: string): string {
  return `Message to analyze: ${message}\n\nReply with only the JSON object.`;
}
