import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PylonClient } from '../lib/client.js';

const TEST_CONFIG = {
  session: 'test-pylon-session',
  pylonCsrf: 'test-csrf-header.test-csrf-hash',
  orgID: 'test-org-id',
};

function makeResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    text: () => Promise.resolve(typeof body === 'string' ? body : ''),
    json: () => Promise.resolve(body),
  };
}

describe('PylonClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('constructor', () => {
    it('accepts an injected config without reading from disk', () => {
      const client = new PylonClient(TEST_CONFIG);
      expect(client.orgID).toBe('test-org-id');
    });
  });

  describe('query()', () => {
    it('builds correct request (method, URL, headers, body shape)', async () => {
      fetchMock.mockResolvedValue(makeResponse({ data: { hello: 'world' } }));

      const client = new PylonClient(TEST_CONFIG);
      const result = await client.query<{ hello: string }>('TestOperation', 'abc123hash', { myVar: 42 });

      expect(result).toEqual({ hello: 'world' });
      expect(fetchMock).toHaveBeenCalledOnce();

      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://graph.usepylon.com/graphql?q=TestOperation');
      expect(options.method).toBe('POST');

      const headers = options.headers as Record<string, string>;
      expect(headers['content-type']).toBe('application/json');
      // x-csrf-token should be the part BEFORE the "." in pylonCsrf
      expect(headers['x-csrf-token']).toBe('test-csrf-header');
      expect(headers['cookie']).toContain('pylon_session=test-pylon-session');
      expect(headers['cookie']).toContain('pylon_csrf=test-csrf-header.test-csrf-hash');
      expect(headers['origin']).toBe('https://app.usepylon.com');
      expect(headers['x-pylon-request-id']).toBeTruthy();

      const body = JSON.parse(options.body as string);
      expect(body.operationName).toBe('TestOperation');
      expect(body.variables).toEqual({ myVar: 42 });
      expect(body.extensions.persistedQuery.sha256Hash).toBe('abc123hash');
      expect(body.extensions.persistedQuery.version).toBe(1);
    });

    it('throws on HTTP error status', async () => {
      fetchMock.mockResolvedValue(makeResponse('Unauthorized', false, 401));
      const client = new PylonClient(TEST_CONFIG);
      await expect(client.query('Op', 'hash', {})).rejects.toThrow('HTTP 401');
    });

    it('throws on GraphQL errors array', async () => {
      fetchMock.mockResolvedValue(
        makeResponse({ data: null, errors: [{ message: 'Not found' }, { message: 'Forbidden' }] })
      );
      const client = new PylonClient(TEST_CONFIG);
      await expect(client.query('Op', 'hash', {})).rejects.toThrow('Not found; Forbidden');
    });

    it('throws when data is undefined', async () => {
      fetchMock.mockResolvedValue(makeResponse({ errors: undefined }));
      const client = new PylonClient(TEST_CONFIG);
      await expect(client.query('Op', 'hash', {})).rejects.toThrow('No data in response');
    });
  });
});
