/**
 * Scheduler: periodically emits agent.tick for each active Mini Jelly.
 * Memory turns each tick into a synthetic context.loaded so the agent
 * "wakes up", runs its goals/KPIs (e.g. post 3x/week, report), and acts autonomously.
 */
import { EventBus } from '@jellyfish/shared';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const VISION_URL = (process.env.VISION_CHAT_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const ENABLED = process.env.SCHEDULER_ENABLED === 'true';
const WATCHER_ENABLED = process.env.SIGNAL_WATCHER_ENABLED === 'true';
const INTERVAL_MS = parseInt(process.env.SCHEDULER_INTERVAL_MS ?? String(24 * 60 * 60 * 1000), 10);
const INITIAL_DELAY_MS = parseInt(process.env.SCHEDULER_INITIAL_DELAY_MS ?? '60000', 10);
const WATCHER_INTERVAL_MS = parseInt(process.env.SIGNAL_WATCHER_INTERVAL_MS ?? String(30 * 60 * 1000), 10); // 30 min

interface TeamMember {
  id: string;
  status: string;
  wakeOnSignals?: boolean;
}

async function fetchTeam(): Promise<TeamMember[]> {
  const res = await fetch(`${VISION_URL}/api/team`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchSignals(): Promise<string> {
  try {
    const res = await fetch(`${VISION_URL}/api/signals`);
    if (!res.ok) return '';
    const data = (await res.json()) as { signals?: string; error?: string };
    return typeof data.signals === 'string' ? data.signals.trim() : '';
  } catch (err) {
    console.error('[Scheduler] Fetch signals failed:', (err as Error).message);
    return '';
  }
}

function shouldWake(m: TeamMember): boolean {
  return m.status === 'active' && m.wakeOnSignals !== false;
}

function runTick(eventBus: EventBus): void {
  Promise.all([fetchTeam(), fetchSignals()])
    .then(([team, signals]) => {
      const active = team.filter(shouldWake);
      console.log(`[Scheduler] Tick: ${active.length} active agent(s), signals: ${signals ? 'yes' : 'no'}`);
      for (const member of active) {
        const agentId = member.id.startsWith('mini-jelly-') ? member.id : `mini-jelly-${member.id}`;
        eventBus.publish('agent.tick', { agentId, signals: signals || undefined }).catch((err) => {
          console.error('[Scheduler] Publish agent.tick failed:', err);
        });
      }
    })
    .catch((err) => {
      console.error('[Scheduler] Tick failed:', err);
    });
}

function runSignalWatcher(eventBus: EventBus): void {
  let lastSignals = '';
  const check = (): void => {
    fetchSignals().then((signals) => {
      if (signals && signals !== lastSignals) {
        lastSignals = signals;
        console.log('[Scheduler] Signal watcher: world changed → waking agents');
        fetchTeam().then((team) => {
          const active = team.filter(shouldWake);
          for (const member of active) {
            const agentId = member.id.startsWith('mini-jelly-') ? member.id : `mini-jelly-${member.id}`;
            eventBus.publish('agent.tick', { agentId, signals }).catch((err) => {
              console.error('[Scheduler] agent.tick failed:', err);
            });
          }
        });
      }
    });
  };
  setTimeout(check, 10000);
  setInterval(check, WATCHER_INTERVAL_MS);
}

function main(): void {
  console.log('[Scheduler] Starting...');
  console.log('[Scheduler] Vision URL:', VISION_URL);

  const eventBus = new EventBus('scheduler-1');

  if (ENABLED) {
    console.log('[Scheduler] Timer enabled. Interval:', INTERVAL_MS / 1000 / 60, 'minutes');
    setTimeout(() => {
      runTick(eventBus);
      setInterval(() => runTick(eventBus), INTERVAL_MS);
    }, INITIAL_DELAY_MS);
  }

  if (WATCHER_ENABLED) {
    console.log('[Scheduler] Signal watcher enabled. Check every', WATCHER_INTERVAL_MS / 60000, 'min. When trends change → wake agents.');
    runSignalWatcher(eventBus);
  }

  if (!ENABLED && !WATCHER_ENABLED) {
    console.log('[Scheduler] No timer, no watcher. Use POST /api/trigger to wake agents.');
  }
}

main();
