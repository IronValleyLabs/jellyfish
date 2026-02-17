import { Telegraf } from 'telegraf';
import type { ChatAdapter, IncomingMessage } from './base-adapter';

const PREFIX = 'telegram_';
const MAX_SEEN_UPDATE_IDS = 2000;

/** Returns Telegram adapter if TELEGRAM_BOT_TOKEN is set, otherwise null. */
export function createTelegramAdapter(): ChatAdapter | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return null;
  const bot = new Telegraf(token);
  let messageHandler: ((message: IncomingMessage) => void) | null = null;
  const seenUpdateIds = new Set<number>();

  return {
    platform: 'telegram',
    conversationIdPrefix: PREFIX,
    async start() {
      try {
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      } catch (e) {
        console.warn('[TelegramAdapter] deleteWebhook failed (optional):', (e as Error).message);
      }
      bot.on('text', (ctx) => {
        const updateId = ctx.update.update_id;
        if (seenUpdateIds.has(updateId)) {
          console.log('[TelegramAdapter] Skipping duplicate update_id', updateId);
          return;
        }
        seenUpdateIds.add(updateId);
        if (seenUpdateIds.size > MAX_SEEN_UPDATE_IDS) {
          const first = seenUpdateIds.values().next().value;
          if (first !== undefined) seenUpdateIds.delete(first);
        }
        const userId = ctx.from!.id.toString();
        const conversationId = PREFIX + userId;
        const text = ctx.message.text ?? '';
        const userName = [ctx.from!.first_name, ctx.from!.last_name].filter(Boolean).join(' ') || undefined;
        console.log('[TelegramAdapter] Message from', conversationId, ':', text.slice(0, 50) + (text.length > 50 ? '…' : ''));
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
      console.log('[TelegramAdapter] Started (long polling). If the bot does not reply, check: Redis, LLM keys in .env, and that no webhook is set on this bot.');
    },
    async stop() {
      bot.stop('SIGTERM');
    },
    async sendMessage(conversationId: string, text: string) {
      if (!conversationId.startsWith(PREFIX)) return;
      const userId = conversationId.slice(PREFIX.length);
      const chatId = /^\d+$/.test(userId) ? Number(userId) : userId;
      try {
        await bot.telegram.sendMessage(chatId, text);
        console.log('[TelegramAdapter] Sent to', conversationId);
      } catch (err) {
        console.error('[TelegramAdapter] sendMessage failed for', conversationId, err);
        throw err;
      }
    },
    onMessage(handler) {
      messageHandler = handler;
    },
  };
}

export function isTelegramConversation(conversationId: string): boolean {
  return conversationId.startsWith(PREFIX);
}
