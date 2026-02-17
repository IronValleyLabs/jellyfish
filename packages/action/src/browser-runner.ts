/**
 * Launches Puppeteer and runs predefined flows (Instagram post, Metricool schedule, browser_visit).
 * Set INSTAGRAM_* or METRICOOL_* in .env. For browser_visit, optional BROWSER_VISIT_LOGIN_* to log in first.
 */
import { instagramPost, metricoolSchedule, visitUrlWithBrowser } from './browser-flows';

let puppeteer: typeof import('puppeteer') | null = null;
try {
  puppeteer = require('puppeteer');
} catch {
  // optional dependency
}

export type FlowName = 'instagram_post' | 'metricool_schedule' | 'browser_visit';

export interface FlowParams {
  instagram_post?: { caption: string; imagePathOrUrl: string };
  metricool_schedule?: { content: string; scheduledDate?: string };
  browser_visit?: { url: string };
}

export class BrowserRunner {
  isAvailable(): boolean {
    return puppeteer !== null;
  }

  async run(flow: FlowName, params: FlowParams[FlowName]): Promise<{ output: string; error?: string }> {
    if (!puppeteer) {
      return {
        output: '',
        error:
          'Puppeteer not installed. Run: pnpm add puppeteer (in packages/action or root). Then set INSTAGRAM_* or METRICOOL_* in .env.',
      };
    }
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      if (flow === 'instagram_post' && params && 'caption' in params && 'imagePathOrUrl' in params) {
        return await instagramPost(browser, params.caption, params.imagePathOrUrl);
      }
      if (flow === 'metricool_schedule' && params && 'content' in params) {
        return await metricoolSchedule(browser, params.content, params.scheduledDate);
      }
      if (flow === 'browser_visit' && params && 'url' in params && params.url) {
        return await visitUrlWithBrowser(browser, params.url);
      }
      return { output: '', error: `Unknown flow or missing params: ${flow}` };
    } finally {
      await browser.close().catch(() => {});
    }
  }
}
