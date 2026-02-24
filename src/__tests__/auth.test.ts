import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { discoverOrgID } from '../lib/client.js';

const TEST_SESSION = 'my-pylon-session';
const TEST_CSRF = 'my-csrf-header.my-csrf-hash';

function makeResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    text: () => Promise.resolve(typeof body === 'string' ? body : ''),
    json: () => Promise.resolve(body),
  };
}

describe('discoverOrgID()', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls /auth endpoint and returns userID + orgID', async () => {
    fetchMock.mockResolvedValue(
      makeResponse({ user_id: 'user-abc', organization_id: 'org-xyz' })
    );

    const result = await discoverOrgID(TEST_SESSION, TEST_CSRF);
    expect(result.userID).toBe('user-abc');
    expect(result.orgID).toBe('org-xyz');

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('https://graph.usepylon.com/auth');
  });

  it('sends correct cookies and csrf header', async () => {
    fetchMock.mockResolvedValue(
      makeResponse({ user_id: 'u1', organization_id: 'o1' })
    );

    await discoverOrgID(TEST_SESSION, TEST_CSRF);

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers['cookie']).toContain(`pylon_session=${TEST_SESSION}`);
    expect(headers['cookie']).toContain(`pylon_csrf=${TEST_CSRF}`);
    // csrf header is the part before the "."
    expect(headers['x-csrf-token']).toBe('my-csrf-header');
  });

  it('throws when organization_id is missing', async () => {
    fetchMock.mockResolvedValue(makeResponse({ user_id: 'u1' }));
    await expect(discoverOrgID(TEST_SESSION, TEST_CSRF)).rejects.toThrow('Could not retrieve current user');
  });

  it('throws on HTTP error', async () => {
    fetchMock.mockResolvedValue(makeResponse('Forbidden', false, 403));
    await expect(discoverOrgID(TEST_SESSION, TEST_CSRF)).rejects.toThrow('HTTP 403');
  });
});
