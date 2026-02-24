import { v4 as uuidv4 } from 'uuid';
import { ConfigManager, type PylonConfig } from './config.js';

const GRAPHQL_ENDPOINT = 'https://graph.usepylon.com/graphql';

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export class PylonClient {
  private config: PylonConfig;

  constructor(config?: PylonConfig) {
    this.config = config ?? ConfigManager.require();
  }

  async query<T = unknown>(
    operationName: string,
    hash: string,
    variables: Record<string, unknown> = {}
  ): Promise<T> {
    const url = `${GRAPHQL_ENDPOINT}?q=${operationName}`;
    const body = JSON.stringify({
      variables,
      operationName,
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: hash,
        },
      },
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': this.config.csrfToken,
        'x-pylon-request-id': uuidv4(),
        'origin': 'https://app.usepylon.com',
        'referer': 'https://app.usepylon.com/',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    const json = (await response.json()) as GraphQLResponse<T>;

    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors.map((e) => e.message).join('; '));
    }

    if (json.data === undefined) {
      throw new Error('No data in response');
    }

    return json.data;
  }

  get orgID(): string {
    return this.config.orgID;
  }
}

export async function discoverOrgID(csrfToken: string): Promise<{ userID: string; orgID: string }> {
  const tempConfig = { csrfToken, orgID: '' };
  const client = new PylonClient(tempConfig);

  const data = await client.query<{
    currentUser?: {
      id: string;
      organizationID?: string;
      organization?: { id: string };
    };
  }>('getCurrentUser', '35aecbe8df33806477f2153c0edeac91c7fe1c97b844810ba0fe81a272fc4a2b', {});

  const user = data.currentUser;
  if (!user) throw new Error('Could not retrieve current user');

  const orgID = user.organizationID ?? user.organization?.id;
  if (!orgID) throw new Error('Could not discover orgID from getCurrentUser response');

  return { userID: user.id, orgID };
}
