import type { ChatAdapter, IncomingMessage } from './base-adapter';

/**
 * Stub for Line Messaging API.
 * Implement start(), sendMessage(), and wire onMessage when integrating.
 */
export function createLineAdapter(): ChatAdapter {
  let messageHandler: ((message: IncomingMessage) => void) | null = null;
  return {
    platform: 'line',
    conversationIdPrefix: 'line_',
    async start() {
      console.log('[LineAdapter] Stub: not connected. Set up Line Messaging API to enable.');
    },
    async sendMessage(_conversationId: string, _text: string) {
      // no-op until implemented
    },
    onMessage(handler) {
      messageHandler = handler;
    },
  };
}
