import axios, { AxiosRequestConfig } from 'axios';
import { createHash } from 'crypto';

type Result = { data: any; source: 'upstream' | 'cache' | 'stale' };
type Entry = { data: any; at: number };

/** Public catalog GETs only. User ratings and collections never enter this cache. */
export class CatalogClient {
  private cache = new Map<string, Entry>();
  private pending = new Map<string, Promise<Result>>();
  constructor(private base = 'https://api.themoviedb.org/3',
    private options = { capacity: 200, ttlMs: 60_000, staleMs: 300_000, budgetMs: 5000 }) {}

  async get(url: string, config: AxiosRequestConfig = {}): Promise<Result> {
    if (!url.startsWith(this.base + '/')) throw new Error('Unexpected catalog origin');
    // Hash credentials too: rotating a credential must not reuse an old auth context.
    const params = Object.entries(config.params || {}).sort(([a], [b]) => a.localeCompare(b));
    const key = createHash('sha256').update(JSON.stringify([url, params, config.headers || {}])).digest('hex');
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < this.options.ttlMs) {
      this.cache.delete(key); this.cache.set(key, cached);
      return { data: structuredClone(cached.data), source: 'cache' };
    }
    const existing = this.pending.get(key);
    if (existing) return structuredClone(await existing);
    // Bound in-flight unique queries as well as stored responses.
    if (this.pending.size >= this.options.capacity) throw new Error('Catalog request capacity reached');
    const request = this.fetch(url, config).then(data => {
      this.cache.delete(key);
      this.cache.set(key, { data, at: Date.now() });
      while (this.cache.size > this.options.capacity) this.cache.delete(this.cache.keys().next().value!);
      return { data, source: 'upstream' as const };
    }).catch(error => {
      const status = error?.response?.status;
      // Never conceal credential failures or invalid client requests with stale data.
      if (cached && (!status || status === 429 || status >= 500) &&
          Date.now() - cached.at < this.options.ttlMs + this.options.staleMs) {
        return { data: cached.data, source: 'stale' as const };
      }
      throw error;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, request);
    return structuredClone(await request);
  }

  private async fetch(url: string, config: AxiosRequestConfig) {
    const deadline = Date.now() + this.options.budgetMs;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await axios.get(url, { ...config, maxRedirects: 0,
          maxContentLength: 2_000_000, timeout: Math.max(1, deadline - Date.now()),
          validateStatus: status => status >= 200 && status < 300 });
        if (!response.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
          throw new Error('Invalid catalog response');
        }
        return response.data;
      } catch (error: any) {
        const status = error?.response?.status;
        if (attempt || (status !== 429 && status !== 503)) throw error;
        const header = error.response.headers['retry-after'];
        const seconds = Number(header);
        const delay = header == null ? 100 : Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : Math.max(0, Date.parse(header) - Date.now());
        if (!Number.isFinite(delay) || Date.now() + delay + 50 >= deadline) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Catalog unavailable');
  }
}

export const catalogClient = new CatalogClient();
