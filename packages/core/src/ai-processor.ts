import OpenAI from 'openai';
import { MessageReceivedPayload } from '@starfish/shared';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

const DEFAULT_MODEL = 'openai/gpt-3.5-turbo';

/**
 * Sends the user message to OpenRouter and returns the assistant reply.
 */
export async function processWithOpenRouter(payload: MessageReceivedPayload): Promise<string> {
  const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant. Reply concisely and in the same language as the user.',
      },
      { role: 'user', content: payload.text },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (content == null) {
    throw new Error('OpenRouter returned empty response');
  }
  return content;
}
