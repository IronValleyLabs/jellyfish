import OpenAI from 'openai';
import {
  INTENT_DETECTION_SYSTEM,
  buildIntentDetectionUserMessage,
} from './prompts/intent-detection';

const DEFAULT_SYSTEM_PROMPT =
  'You are a helpful, friendly assistant. Reply in a concise and clear way.';

export interface DetectedIntent {
  intent: 'bash' | 'websearch' | 'response';
  params: { command?: string; query?: string; text?: string };
}

export class AIProcessor {
  private client: OpenAI;
  private model: string;
  private systemPrompt: string;

  constructor(systemPrompt?: string) {
    this.client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/IronValleyLabs/jellyfish',
        'X-Title': 'Jellyfish AI Agent',
      },
    });
    this.model = process.env.AI_MODEL || 'anthropic/claude-3.5-sonnet';
    this.systemPrompt = (systemPrompt && systemPrompt.trim()) || DEFAULT_SYSTEM_PROMPT;
    console.log(`[AIProcessor] Model: ${this.model}`);
  }

  async detectIntent(
    message: string,
    _history: Array<{ role: string; content: string }>
  ): Promise<DetectedIntent> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: INTENT_DETECTION_SYSTEM },
        { role: 'user', content: buildIntentDetectionUserMessage(message) },
      ],
      temperature: 0.2,
      max_tokens: 200,
    });
    const raw = completion.choices[0].message.content?.trim() ?? '{}';
    const jsonStr = raw.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    try {
      const parsed = JSON.parse(jsonStr) as {
        intent?: string;
        params?: Record<string, string>;
      };
      const intent = parsed.intent === 'bash' || parsed.intent === 'websearch'
        ? parsed.intent
        : 'response';
      const params = parsed.params ?? {};
      return {
        intent,
        params: {
          command: params.command,
          query: params.query,
          text: params.text,
        },
      };
    } catch {
      return { intent: 'response', params: {} };
    }
  }

  async generateResponse(
    currentMessage: string,
    history: Array<{ role: string; content: string }>
  ): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number } }> {
    const messages = [
      {
        role: 'system' as const,
        content: this.systemPrompt,
      },
      ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: currentMessage },
    ];
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });
    const content = completion.choices[0].message.content || 'Lo siento, no pude generar una respuesta.';
    const usage = completion.usage
      ? {
          prompt_tokens: completion.usage.prompt_tokens ?? 0,
          completion_tokens: completion.usage.completion_tokens ?? 0,
        }
      : undefined;
    return { content, usage };
  }

  getModel(): string {
    return this.model;
  }
}
