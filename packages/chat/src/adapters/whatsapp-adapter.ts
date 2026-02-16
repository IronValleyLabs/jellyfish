import type { ChatAdapter, IncomingMessage } from './base-adapter';

/**
 * Stub for WhatsApp (Twilio or WhatsApp Business API).
 * Implement start(), sendMessage(), and wire onMessage when integrating.
 */
export function createWhatsAppAdapter(): ChatAdapter {
  let messageHandler: ((message: IncomingMessage) => void) | null = null;
  return {
    platform: 'whatsapp',
    conversationIdPrefix: 'whatsapp_',
    async start() {
      console.log('[WhatsAppAdapter] Stub: not connected. Set up Twilio/WhatsApp Business API to enable.');
    },
    async sendMessage(_conversationId: string, _text: string) {
      // no-op until implemented
    },
    onMessage(handler) {
      messageHandler = handler;
    },
  };
}
