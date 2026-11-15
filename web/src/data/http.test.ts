// The HTTP client can't meet an engine in step 1: these check the requests it builds and how it maps failures.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { API, httpEngine } from './http';
import type { SearchRequest } from './types.gen';
import cachedReq from '../../contracts/examples/api/search_named_cached.request.json';
import warmingUp from '../../contracts/examples/api/error_warming_up.json';

const reply = (status: number, body: string) => vi.fn(async (..._: unknown[]) => new Response(body, { status, headers: { 'Content-Type': 'application/json' } }));
const url = (f: ReturnType<typeof reply>) => f.mock.calls[0][0];
afterEach(() => { vi.unstubAllGlobals(); });

describe('http client', () => {
  it('posts searches as JSON', async () => {
    const f = reply(200, '{"results":[]}'); vi.stubGlobal('fetch', f);
    await httpEngine.search(cachedReq as SearchRequest);
    expect(url(f)).toBe(`${API}/search`);
    expect(f.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify(cachedReq), headers: { 'Content-Type': 'application/json' } });
  });
  it('builds the GET paths of the spec', async () => {
    const calls: [() => Promise<unknown>, string][] = [
      [() => httpEngine.target('moon', 'Rima Hadley'), '/targets/moon/Rima%20Hadley'],
      [() => httpEngine.targets({ body: 'mars', q: 'jez', limit: 5 }), '/targets?body=mars&q=jez&limit=5'],
      [() => httpEngine.elevation({ body: 'mars', lat: 18.38, lon: 77.58 }), '/elevation/point/mars?lat=18.38&lon=77.58'],
      [() => httpEngine.elevation({ body: 'moon', name: 'Rima Hadley' }), '/elevation/target/moon/Rima%20Hadley'],
      [() => httpEngine.elevation({ cell: 477151 }), '/elevation/site/477151'],
      [() => httpEngine.health(), '/health'],
    ];
    for (const [call, path] of calls) { const f = reply(200, '{}'); vi.stubGlobal('fetch', f); await call(); expect(url(f)).toBe(API + path); }
  });
  it('maps failures to EngineError', async () => {
    const cases: [ReturnType<typeof reply>, number, string][] = [
      [reply(503, JSON.stringify(warmingUp)), 503, 'warming_up'],
      [reply(422, '{"detail":[{"loc":["body","k"],"msg":"too big"}]}'), 422, 'invalid_request'],
      [reply(500, 'Internal Server Error'), 500, 'bad_response'],
      [reply(200, 'not json'), 200, 'bad_response'],
      [vi.fn(async () => { throw new TypeError('Failed to fetch'); }) as never, 0, 'network'],
    ];
    for (const [f, status, code] of cases) {
      vi.stubGlobal('fetch', f);
      await expect(httpEngine.health()).rejects.toMatchObject({ status, code });
    }
  });
});

describe('http client, a search called off', () => {
  it('rejects as aborted, not as a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn((_: string, init: RequestInit) => new Promise((_ok, no) => init.signal!.addEventListener('abort', () => no(new DOMException('aborted', 'AbortError'))))));
    const stop = new AbortController(), p = httpEngine.search(cachedReq as SearchRequest, stop.signal);
    stop.abort();
    await expect(p).rejects.toMatchObject({ status: 0, code: 'aborted' });
  });
});

describe('http client, answers off the contract', () => {
  it('a search answer without its results list is a bad_response', async () => {
    vi.stubGlobal('fetch', reply(200, '{"query":{}}'));
    await expect(httpEngine.search(cachedReq as SearchRequest)).rejects.toMatchObject({ status: 200, code: 'bad_response' });
  });
});
