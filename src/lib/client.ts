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

    const cookieStr = `pylon_session=${this.config.session}; pylon_csrf=${this.config.pylonCsrf}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cookie': cookieStr,
        'x-csrf-token': ConfigManager.csrfHeader(this.config),
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

export async function discoverOrgID(session: string, pylonCsrf: string): Promise<{ userID: string; orgID: string }> {
  const csrfHeader = pylonCsrf.split('.')[0] ?? pylonCsrf;
  const cookieStr = `pylon_session=${session}; pylon_csrf=${pylonCsrf}`;

  const response = await fetch('https://graph.usepylon.com/auth', {
    method: 'POST',
    headers: {
      'content-length': '0',
      'cookie': cookieStr,
      'x-csrf-token': csrfHeader,
      'x-pylon-request-id': crypto.randomUUID(),
      'origin': 'https://app.usepylon.com',
      'referer': 'https://app.usepylon.com/',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json() as { user_id?: string; organization_id?: string };

  if (!data.organization_id) throw new Error('Could not retrieve current user');
  if (!data.user_id) throw new Error('Could not retrieve current user');

  return { userID: data.user_id, orgID: data.organization_id };
}
