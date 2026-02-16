import type { ChatAdapter, IncomingMessage } from './base-adapter';

/**
 * Stub for Google Chat API.
 * Implement start(), sendMessage(), and wire onMessage when integrating.
 */
export function createGoogleChatAdapter(): ChatAdapter {
  let messageHandler: ((message: IncomingMessage) => void) | null = null;
  return {
    platform: 'google-chat',
    conversationIdPrefix: 'google-chat_',
    async start() {
      console.log('[GoogleChatAdapter] Stub: not connected. Set up Google Chat API to enable.');
    },
    async sendMessage(_conversationId: string, _text: string) {
      // no-op until implemented
    },
    onMessage(handler) {
      messageHandler = handler;
    },
  };
}
