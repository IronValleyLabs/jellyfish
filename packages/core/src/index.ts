import 'dotenv/config';
import { EventBus, Event, MessageReceivedPayload } from '@starfish/shared';
import { processWithOpenRouter } from './ai-processor';

const AGENT_ID = 'core-agent';
const bus = new EventBus(AGENT_ID);

async function handleMessageReceived(event: Event): Promise<void> {
  const payload = event.payload as MessageReceivedPayload;
  const correlationId = event.correlationId;

  try {
    const output = await processWithOpenRouter(payload);
    await bus.publish(
      'action.completed',
      {
        conversationId: payload.conversationId,
        result: { output },
      },
      correlationId
    );
  } catch (err) {
    console.error('[CoreAgent] Error processing message:', err);
    await bus.publish(
      'action.failed',
      {
        conversationId: payload.conversationId,
        error: err instanceof Error ? err.message : String(err),
      },
      correlationId
    );
  }
}

bus.subscribe('message.received', (event) => {
  handleMessageReceived(event).catch((err) =>
    console.error('[CoreAgent] Unhandled error in handler:', err)
  );
});

console.log(`[CoreAgent] ${AGENT_ID} running, listening for message.received`);
