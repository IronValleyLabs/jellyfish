/**
 * Runs predefined flows (Instagram, Metricool, browser_visit).
 * For browser_visit: tries to connect to visible Chrome (port 9222) so you see it navigate; else headless.
 * Start Chrome with: --remote-debugging-port=9222
 */
import { instagramPost, metricoolSchedule, visitUrlWithBrowser } from './browser-flows';

const BROWSER_DEBUGGING_PORT = parseInt(process.env.BROWSER_DEBUGGING_PORT ?? '9222', 10);

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
  browser_visit?: { url: string; credentials?: { loginUrl: string; user: string; password: string } };
}

export class BrowserRunner {
  isAvailable(): boolean {
    return puppeteer !== null;
  }

  private async getBrowser(): Promise<{ browser: import('puppeteer').Browser; closeWhenDone: boolean }> {
    if (!puppeteer) throw new Error('Puppeteer not available');
    const browserURL = `http://127.0.0.1:${BROWSER_DEBUGGING_PORT}`;
    try {
      const browser = await puppeteer.connect({ browserURL, defaultViewport: null });
      return { browser, closeWhenDone: false };
    } catch {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      return { browser, closeWhenDone: true };
    }
  }

  async run(flow: FlowName, params: FlowParams[FlowName]): Promise<{ output: string; error?: string }> {
    if (!puppeteer) {
      return {
        output: '',
        error:
          'Puppeteer not installed. Run: pnpm add puppeteer (in packages/action or root). Then set INSTAGRAM_* or METRICOOL_* in .env.',
      };
    }
    const { browser, closeWhenDone } = await this.getBrowser();
    try {
      if (flow === 'instagram_post' && params && 'caption' in params && 'imagePathOrUrl' in params) {
        return await instagramPost(browser, params.caption, params.imagePathOrUrl);
      }
      if (flow === 'metricool_schedule' && params && 'content' in params) {
        return await metricoolSchedule(browser, params.content, params.scheduledDate);
      }
      if (flow === 'browser_visit' && params && 'url' in params && params.url) {
        const creds = params.credentials;
        return await visitUrlWithBrowser(browser, params.url, creds);
      }
      return { output: '', error: `Unknown flow or missing params: ${flow}` };
    } finally {
      if (closeWhenDone) await browser.close().catch(() => {});
    }
  }
}
