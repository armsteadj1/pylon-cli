import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { discoverOrgID } from '../lib/client.js';

function makeJsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    text: () => Promise.resolve(''),
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

  it('returns userID and orgID from mock response (via organizationID)', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse({
        data: {
          currentUser: {
            id: 'user-abc',
            organizationID: 'org-xyz',
          },
        },
      })
    );

    const result = await discoverOrgID('my-csrf-token');
    expect(result.userID).toBe('user-abc');
    expect(result.orgID).toBe('org-xyz');
  });

  it('returns orgID from nested organization.id when organizationID is absent', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse({
        data: {
          currentUser: {
            id: 'user-def',
            organization: { id: 'org-nested' },
          },
        },
      })
    );

    const result = await discoverOrgID('my-csrf-token');
    expect(result.userID).toBe('user-def');
    expect(result.orgID).toBe('org-nested');
  });

  it('throws when currentUser is null', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse({
        data: { currentUser: null },
      })
    );

    await expect(discoverOrgID('bad-token')).rejects.toThrow(
      'Could not retrieve current user'
    );
  });

  it('throws when orgID cannot be found', async () => {
    fetchMock.mockResolvedValue(
      makeJsonResponse({
        data: {
          currentUser: {
            id: 'user-ghi',
            // no organizationID or organization
          },
        },
      })
    );

    await expect(discoverOrgID('bad-token')).rejects.toThrow(
      'Could not discover orgID'
    );
  });
});
