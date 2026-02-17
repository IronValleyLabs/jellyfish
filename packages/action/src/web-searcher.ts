import axios from 'axios';
import * as cheerio from 'cheerio';

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Returns true if the string looks like a URL (domain or full URL). */
export function looksLikeUrl(s: string): boolean {
  const t = s.trim();
  if (!t || t.length > 500) return false;
  if (/^https?:\/\//i.test(t)) return true;
  if (/\s/.test(t)) return false; // no spaces in URLs
  return /\.(app|com|io|dev|net|org)(\/|$)/i.test(t) || t.includes('lovable.app');
}

/** Normalize to a full URL (add https:// if missing). */
function normalizeUrl(input: string): string {
  const t = input.trim().replace(/^\s+|\s+$/g, '');
  if (/^https?:\/\//i.test(t)) return t;
  return 'https://' + t;
}

export class WebSearcher {
  /** Fetch a URL and return main text content for analysis. */
  async fetchUrl(urlInput: string): Promise<string> {
    const url = normalizeUrl(urlInput);
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': BROWSER_USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
      });
      const $ = cheerio.load(response.data);
      $('script, style, nav, footer, iframe').remove();
      const title = $('title').text().trim() || '';
      const body = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 15000);
      return [
        title ? `Title: ${title}` : '',
        body || '(No text content)',
      ]
        .filter(Boolean)
        .join('\n\n');
    } catch (error: unknown) {
      const msg = error && typeof (error as any).response?.status === 'number'
        ? `HTTP ${(error as any).response.status}`
        : error instanceof Error ? error.message : String(error);
      console.error('[WebSearcher] fetchUrl failed', url, msg);
      return `The URL could not be fetched: ${msg}. The site may be down, block automated requests, or the URL may be wrong.`;
    }
  }

  async search(query: string): Promise<string> {
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl, {
        headers: { 'User-Agent': BROWSER_USER_AGENT },
        timeout: 10000,
      });
      const $ = cheerio.load(response.data);
      const results: string[] = [];
      $('.result__body')
        .slice(0, 3)
        .each((i, elem) => {
          const title = $(elem).find('.result__title').text().trim();
          const snippet = $(elem).find('.result__snippet').text().trim();
          if (title && snippet) {
            results.push(`${i + 1}. ${title}\n   ${snippet}`);
          }
        });
      return results.length > 0
        ? `Search results for "${query}":\n\n${results.join('\n\n')}`
        : 'No results found.';
    } catch (error: unknown) {
      console.error('[WebSearcher] Error:', error);
      return 'Error performing web search.';
    }
  }
}
