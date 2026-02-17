import OpenAI from 'openai';
import {
  INTENT_DETECTION_SYSTEM,
  buildIntentDetectionUserMessage,
} from './prompts/intent-detection';
import { getLLMClientConfig } from './llm-provider';

const DEFAULT_SYSTEM_PROMPT =
  'You are a full autonomous agent, not a minimal bot. Be warm and human: friendly, a bit of humor when it fits. After actions, say what you did in a natural way and suggest next steps if relevant. Never give one dry line when a fuller, helpful reply is better.';

export interface DetectedIntent {
  intent: 'bash' | 'websearch' | 'draft' | 'response' | 'generate_image' | 'instagram_post' | 'metricool_schedule' | 'create_skill' | 'browser_visit' | 'store_credential' | 'write_file';
  params: {
    command?: string;
    query?: string;
    url?: string;
    key?: string;
    value?: string;
    filePath?: string;
    text?: string;
    prompt?: string;
    size?: string;
    caption?: string;
    imagePathOrUrl?: string;
    content?: string;
    scheduledDate?: string;
    name?: string;
    description?: string;
    instructions?: string;
  };
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export class AIProcessor {
  private client: OpenAI;
  private model: string;
  private systemPrompt: string;

  constructor(systemPrompt?: string) {
    const config = getLLMClientConfig();
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      defaultHeaders: config.defaultHeaders,
    });
    this.model =
      process.env.AI_MODEL ||
      (config.provider === 'openrouter' ? 'anthropic/claude-3.5-sonnet' : 'gpt-4o');
    this.systemPrompt = (systemPrompt && systemPrompt.trim()) || DEFAULT_SYSTEM_PROMPT;
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
    const usage = completion.usage
      ? {
          prompt_tokens: completion.usage.prompt_tokens ?? 0,
          completion_tokens: completion.usage.completion_tokens ?? 0,
        }
      : undefined;
    try {
      const parsed = JSON.parse(jsonStr) as {
        intent?: string;
        params?: Record<string, string>;
      };
      const allowed =
        ['bash', 'websearch', 'draft', 'generate_image', 'instagram_post', 'metricool_schedule', 'create_skill', 'browser_visit', 'store_credential', 'write_file'] as const;
      const intent = allowed.includes(parsed.intent as any) ? (parsed.intent as DetectedIntent['intent']) : 'response';
      const params = parsed.params ?? {};
      return {
        intent,
        params: {
          command: params.command,
          query: params.query,
          url: params.url,
          key: params.key,
          value: params.value,
          filePath: params.filePath,
          text: params.text,
          prompt: params.prompt,
          size: params.size,
          caption: params.caption,
          imagePathOrUrl: params.imagePathOrUrl,
          content: params.content,
          scheduledDate: params.scheduledDate,
          name: params.name,
          description: params.description,
          instructions: params.instructions,
        },
        usage,
      };
    } catch {
      return { intent: 'response', params: {}, usage };
    }
  }

  async generateResponse(
    currentMessage: string,
    history: Array<{ role: string; content: string }>,
    extraSystemContext?: string
  ): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number } }> {
    const systemContent = extraSystemContext
      ? this.systemPrompt + extraSystemContext
      : this.systemPrompt;
    const messages = [
      {
        role: 'system' as const,
        content: systemContent,
      },
      ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: currentMessage },
    ];
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.7,
      max_tokens: 720,
    });
    const content = completion.choices[0].message.content || 'Sorry, I could not generate a response.';
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
