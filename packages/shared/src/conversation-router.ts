import Redis from 'ioredis';

const KEY_PREFIX = 'conversation:';
const TTL_SECONDS = 24 * 60 * 60; // 24 hours

export class ConversationRouter {
  private client: Redis;

  constructor(redisUrl?: string) {
    const host = process.env.REDIS_HOST || 'localhost';
    this.client = redisUrl ? new Redis(redisUrl) : new Redis({ host });
  }

  private key(conversationId: string): string {
    return KEY_PREFIX + conversationId;
  }

  async assignConversation(conversationId: string, miniJellyId: string): Promise<void> {
    const k = this.key(conversationId);
    await this.client.setex(k, TTL_SECONDS, miniJellyId);
  }

  async getAssignedAgent(conversationId: string): Promise<string | null> {
    const k = this.key(conversationId);
    const value = await this.client.get(k);
    return value;
  }

  async unassignConversation(conversationId: string): Promise<void> {
    const k = this.key(conversationId);
    await this.client.del(k);
  }

  /** Renew TTL for this conversation (call on each message to keep assignment alive). */
  async renewConversation(conversationId: string): Promise<void> {
    const k = this.key(conversationId);
    await this.client.expire(k, TTL_SECONDS);
  }

  disconnect(): void {
    this.client.disconnect();
  }
}
