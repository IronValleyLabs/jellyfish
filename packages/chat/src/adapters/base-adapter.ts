export type ChatPlatform = 'telegram' | 'whatsapp' | 'line' | 'google-chat' | 'slack' | 'discord';

export interface IncomingMessage {
  conversationId: string;
  userId: string;
  userName?: string;
  text: string;
  platform: ChatPlatform;
}

export interface ChatAdapter {
  platform: ChatPlatform;
  /** conversationId prefix for this platform (e.g. "telegram_") */
  conversationIdPrefix: string;
  start(): Promise<void>;
  stop?(): Promise<void>;
  sendMessage(conversationId: string, text: string): Promise<void>;
  onMessage(handler: (message: IncomingMessage) => void): void;
}
