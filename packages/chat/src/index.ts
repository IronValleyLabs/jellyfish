import path from 'path';
import { EventBus, detectMention, ConversationRouter } from '@jellyfish/shared';
import { loadTeam } from './load-team';
import { createTelegramAdapter } from './adapters/telegram-adapter';
import type { ChatAdapter, IncomingMessage } from './adapters/base-adapter';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const RESET_REGEX = /^\/reset\s*$/i;

function createMessageHandler(
  eventBus: EventBus,
  router: ConversationRouter
): (msg: IncomingMessage) => void {
  return async (msg: IncomingMessage) => {
    const { conversationId, userId, text, platform } = msg;

    if (RESET_REGEX.test(text.trim())) {
      await router.unassignConversation(conversationId);
      return;
    }

    const team = await loadTeam();
    const mentioned = detectMention(text, team);
    let targetAgentId: string | null = null;

    if (mentioned) {
      await router.assignConversation(conversationId, mentioned.id);
      await router.renewConversation(conversationId);
      targetAgentId = `mini-jelly-${mentioned.id}`;
      console.log(`[ChatAgent] Mention: ${mentioned.displayName} -> ${targetAgentId}`);
    } else {
      const assigned = await router.getAssignedAgent(conversationId);
      if (assigned) {
        await router.renewConversation(conversationId);
        targetAgentId = `mini-jelly-${assigned}`;
      }
    }

    console.log(`[ChatAgent] ${platform} ${userId}: "${text.slice(0, 50)}..." target=${targetAgentId ?? 'default'}`);
    await eventBus.publish('message.received', {
      platform,
      userId,
      conversationId,
      text,
      targetAgentId: targetAgentId ?? undefined,
    });
  };
}

async function main() {
  const eventBus = new EventBus('chat-agent-1');
  const router = new ConversationRouter();
  const handler = createMessageHandler(eventBus, router);

  const adapters: ChatAdapter[] = [createTelegramAdapter()];
  for (const adapter of adapters) {
    adapter.onMessage(async (msg) => {
      if (RESET_REGEX.test(msg.text.trim())) {
        await router.unassignConversation(msg.conversationId);
        await eventBus.publish('conversation.unassigned', { conversationId: msg.conversationId });
        await eventBus.publish('action.completed', {
          conversationId: msg.conversationId,
          result: {
            output: 'Conversation unassigned. Next message will go to the default agent, or mention an agent (e.g. @Name).',
          },
        });
        return;
      }
      await handler(msg);
    });
    await adapter.start();
  }

  eventBus.subscribe('action.completed', async (event) => {
    const payload = event.payload as { conversationId?: string; result?: { output?: string } };
    if (!payload.conversationId || !payload.result?.output) return;
    const adapter = adapters.find((a) => payload.conversationId!.startsWith(a.conversationIdPrefix));
    if (adapter) {
      try {
        await adapter.sendMessage(payload.conversationId, payload.result.output);
      } catch (err) {
        console.error('[ChatAgent] Error sending message:', err);
      }
    }
  });

  console.log('[ChatAgent] Running with adapters:', adapters.map((a) => a.platform).join(', '));

  const shutdown = async () => {
    for (const adapter of adapters) {
      if (adapter.stop) await adapter.stop();
    }
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[ChatAgent] Fatal:', err);
  process.exit(1);
});
