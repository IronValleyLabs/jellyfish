import path from 'path';
import { EventBus, MetricsCollector } from '@jellyfish/shared';
import { BashExecutor } from './bash-executor';
import { WebSearcher, looksLikeUrl } from './web-searcher';
import { DraftExecutor } from './draft-executor';
import { ImageExecutor } from './image-executor';
import { BrowserRunner } from './browser-runner';
import { CreateSkillExecutor } from './create-skill-executor';
import { WriteFileExecutor } from './write-file-executor';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const VISION_URL = (process.env.VISION_CHAT_URL ?? 'http://localhost:3000').replace(/\/$/, '');

interface IntentPayload {
  intent?: string;
  params?: {
    command?: string;
    query?: string;
    url?: string;
    filePath?: string;
    key?: string;
    value?: string;
    text?: string;
    prompt?: string;
    size?: string;
    caption?: string;
    imagePathOrUrl?: string;
    content?: string;
    scheduledDate?: string;
    name?: string;
    description?: string;
    instructions?: string;
  };
  conversationId?: string;
  agentId?: string;
}

class ActionAgent {
  private eventBus: EventBus;
  private bashExecutor: BashExecutor;
  private webSearcher: WebSearcher;
  private draftExecutor: DraftExecutor;
  private imageExecutor: ImageExecutor;
  private browserRunner: BrowserRunner;
  private createSkillExecutor: CreateSkillExecutor;
  private writeFileExecutor: WriteFileExecutor;
  private metrics: MetricsCollector;

  constructor() {
    console.log('[ActionAgent] Starting...');
    this.eventBus = new EventBus('action-agent-1');
    this.bashExecutor = new BashExecutor();
    this.webSearcher = new WebSearcher();
    this.draftExecutor = new DraftExecutor();
    this.imageExecutor = new ImageExecutor();
    this.browserRunner = new BrowserRunner();
    this.createSkillExecutor = new CreateSkillExecutor();
    this.writeFileExecutor = new WriteFileExecutor();
    this.metrics = new MetricsCollector();
    if (this.draftExecutor.isEnabled()) console.log('[ActionAgent] Draft LLM enabled');
    if (this.imageExecutor.isEnabled()) console.log('[ActionAgent] Image generation (Nano Banana Pro) enabled');
    if (this.browserRunner.isAvailable()) console.log('[ActionAgent] Browser (Puppeteer) available');
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    this.eventBus.subscribe('intent.detected', async (event) => {
      const payload = event.payload as IntentPayload;
      const agentId = payload.agentId ?? 'core-agent-1';
      let result: { output: string; error?: string } = { output: '' };
      try {
        switch (payload.intent) {
          case 'bash':
            result = await this.bashExecutor.execute(
              payload.params?.command || ''
            );
            break;
          case 'websearch': {
            const query = payload.params?.query || '';
            const output = looksLikeUrl(query)
              ? await this.webSearcher.fetchUrl(query)
              : await this.webSearcher.search(query);
            result = { output };
            break;
          }
          case 'draft':
            result = await this.draftExecutor.execute(
              payload.params?.prompt || ''
            );
            break;
          case 'generate_image':
            result = await this.imageExecutor.execute(
              payload.params?.prompt || '',
              payload.params?.size
            );
            break;
          case 'instagram_post':
            result = await this.browserRunner.run('instagram_post', {
              caption: payload.params?.caption || '',
              imagePathOrUrl: payload.params?.imagePathOrUrl || payload.params?.prompt || '',
            });
            break;
          case 'metricool_schedule':
            result = await this.browserRunner.run('metricool_schedule', {
              content: payload.params?.content || payload.params?.prompt || '',
              scheduledDate: payload.params?.scheduledDate,
            });
            break;
          case 'create_skill':
            result = await this.createSkillExecutor.execute(
              payload.agentId ?? 'core-agent-1',
              payload.params?.name ?? '',
              payload.params?.description ?? '',
              payload.params?.instructions ?? ''
            );
            break;
          case 'browser_visit': {
            const url = payload.params?.url?.trim();
            if (!url) {
              result = { output: '', error: 'browser_visit requires a URL in params.url' };
            } else {
              result = this.browserRunner.isAvailable()
                ? await this.browserRunner.run('browser_visit', { url })
                : { output: '', error: 'Puppeteer not installed. Run: pnpm add puppeteer (in packages/action or root).' };
            }
            break;
          }
          case 'store_credential': {
            const key = payload.params?.key?.trim();
            const value = payload.params?.value ?? '';
            if (!key) {
              result = { output: '', error: 'store_credential requires params.key (e.g. BROWSER_VISIT_PASSWORD).' };
            } else {
              try {
                const res = await fetch(`${VISION_URL}/api/settings/env`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ key, value: String(value) }),
                });
                const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string };
                if (res.ok && data.ok) {
                  result = { output: data.message ?? `Saved ${key}. Restart agents to apply.` };
                } else {
                  result = { output: '', error: data.error ?? `Failed to save (${res.status})` };
                }
              } catch (err) {
                result = { output: '', error: err instanceof Error ? err.message : 'Failed to call Vision API.' };
              }
            }
            break;
          }
          case 'write_file': {
            const filePath = payload.params?.filePath?.trim();
            const content = payload.params?.content ?? '';
            if (!filePath) {
              result = { output: '', error: 'write_file requires params.filePath (e.g. docs/vision.md or data/agent-knowledge.md).' };
            } else {
              result = await this.writeFileExecutor.execute(filePath, content);
            }
            break;
          }
          case 'response':
            result = { output: payload.params?.text || 'No response' };
            break;
          default:
            result = { output: 'Intent not recognized' };
        }
        if (result.error) {
          await this.eventBus.publish(
            'action.failed',
            {
              conversationId: payload.conversationId,
              error: result.error,
            },
            event.correlationId
          );
        } else {
          await this.metrics.incrementActions(agentId);
          await this.metrics.incrementNanoCount(agentId);
          await this.metrics.recordAction(agentId, `action_${payload.intent ?? 'unknown'}`);
          await this.eventBus.publish(
            'action.completed',
            {
              conversationId: payload.conversationId,
              result: { output: result.output },
              agentId,
            },
            event.correlationId
          );
        }
      } catch (error: unknown) {
        console.error('[ActionAgent] Error running action:', error);
        await this.eventBus.publish(
          'action.failed',
          {
            conversationId: payload.conversationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          event.correlationId
        );
      }
    });
  }
}
new ActionAgent();
