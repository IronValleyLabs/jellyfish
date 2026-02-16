import { Telegraf } from 'telegraf';
import type { ChatAdapter, IncomingMessage } from './base-adapter';

const PREFIX = 'telegram_';

export function createTelegramAdapter(): ChatAdapter {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set in .env');
  }
  const bot = new Telegraf(token);
  let messageHandler: ((message: IncomingMessage) => void) | null = null;

  return {
    platform: 'telegram',
    conversationIdPrefix: PREFIX,
    async start() {
      bot.on('text', (ctx) => {
        const userId = ctx.from!.id.toString();
        const conversationId = PREFIX + userId;
        const text = ctx.message.text ?? '';
        const userName = [ctx.from!.first_name, ctx.from!.last_name].filter(Boolean).join(' ') || undefined;
        if (messageHandler) {
          messageHandler({
            conversationId,
            userId,
            userName,
            text,
            platform: 'telegram',
          });
        }
      });
      await bot.launch();
      console.log('[TelegramAdapter] Started');
    },
    async stop() {
      bot.stop('SIGTERM');
    },
    async sendMessage(conversationId: string, text: string) {
      if (!conversationId.startsWith(PREFIX)) return;
      const userId = conversationId.slice(PREFIX.length);
      await bot.telegram.sendMessage(userId, text);
    },
    onMessage(handler) {
      messageHandler = handler;
    },
  };
}

export function isTelegramConversation(conversationId: string): boolean {
  return conversationId.startsWith(PREFIX);
}
