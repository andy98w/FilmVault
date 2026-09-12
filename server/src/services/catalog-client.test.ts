import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, RequestListener } from 'node:http';
import { CatalogClient } from './catalog-client';

async function fixture(handler: RequestListener, run: (base: string) => Promise<void>) {
  const server = createServer(handler);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
}
const opts = { capacity: 2, ttlMs: 30, staleMs: 1000, budgetMs: 300 };

test('coalesces requests, isolates query keys, and bounds LRU cache', async () => {
  let calls = 0;
  await fixture((req, res) => { calls++; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ url: req.url })); }, async base => {
    const client = new CatalogClient(base, { ...opts, ttlMs: 10_000 });
    const values = await Promise.all(Array.from({ length: 10 }, () => client.get(base + '/movie')));
    assert.equal(calls, 1);
    values[0].data.url = 'mutated';
    assert.equal((await client.get(base + '/movie')).data.url, '/movie');
    assert.equal((await client.get(base + '/movie')).source, 'cache');
    await client.get(base + '/movie', { params: { language: 'fr' } });
    await client.get(base + '/movie', { params: { language: 'es' } });
    await client.get(base + '/movie');
    assert.equal(calls, 4);
  });
});

test('retries 429 once, respects retry budget, and does not retry 401', async () => {
  let calls = 0, status = 429, retry = '0';
  await fixture((_req, res) => {
    calls++; res.statusCode = status; res.setHeader('Retry-After', retry);
    res.setHeader('Content-Type', 'application/json'); res.end('{}');
  }, async base => {
    const client = new CatalogClient(base, opts);
    await assert.rejects(client.get(base + '/movie')); assert.equal(calls, 2);
    retry = '30';
    await assert.rejects(client.get(base + '/movie')); assert.equal(calls, 3);
    status = 401;
    await assert.rejects(client.get(base + '/movie')); assert.equal(calls, 4);
  });
});

test('stale fallback is explicit and cannot conceal invalid credentials', async () => {
  let status = 200;
  await fixture((_req, res) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end('{"results":[]}'); }, async base => {
    const client = new CatalogClient(base, opts);
    await client.get(base + '/movie');
    await new Promise(resolve => setTimeout(resolve, 40));
    status = 500;
    assert.equal((await client.get(base + '/movie')).source, 'stale');
    status = 401;
    await assert.rejects(client.get(base + '/movie'));
  });
});

test('rejects malformed responses without caching them and bounds timeout', async () => {
  let calls = 0;
  await fixture((_req, res) => { calls++; res.end('not JSON'); }, async base => {
    const client = new CatalogClient(base, opts);
    await assert.rejects(client.get(base + '/movie'));
    await assert.rejects(client.get(base + '/movie'));
    assert.equal(calls, 2);
  });
  await fixture(() => {}, async base => {
    const started = Date.now();
    await assert.rejects(new CatalogClient(base, opts).get(base + '/movie'));
    assert.ok(Date.now() - started < 1500);
  });
});
