import { Command } from 'commander';
import { PylonClient } from '../lib/client.js';
import { OPS } from '../lib/operations.js';
import { printTable, printKeyValue, printJSON, safe } from '../lib/output.js';
import type { OutputOptions } from '../types/index.js';

function outputFlags(cmd: Command): Command {
  return cmd.option('--json', 'Output as JSON').option('--csv', 'Output as CSV');
}

export function buildOrgCommand(): Command {
  const org = new Command('org').description('Organization management');

  outputFlags(
    org.command('config').description('Show org configuration')
  ).action(async (opts: OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      orgConfig?: Record<string, unknown>;
    }>('getOrgConfig', OPS.getOrgConfig, {
      orgID: client.orgID,
    });

    if (opts.json) {
      printJSON(data.orgConfig ?? data);
      return;
    }

    const config = data.orgConfig ?? {};
    printKeyValue(config as Record<string, unknown>, opts);
  });

  return org;
}

export function buildMeCommand(): Command {
  const me = new Command('me').description('Show current user info');

  me.option('--json', 'Output as JSON').action(async (opts: OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      currentUser?: {
        id: string;
        name?: string;
        displayName?: string;
        email?: string;
        role?: string;
        organizationID?: string;
        organization?: { id: string; name?: string };
      };
    }>('getCurrentUser', OPS.getCurrentUser, {});

    const user = data.currentUser;
    if (!user) {
      console.error('Could not retrieve current user');
      process.exit(1);
    }

    if (opts.json) {
      printJSON(user);
      return;
    }

    printKeyValue(
      {
        id: user.id,
        name: safe(user.displayName ?? user.name),
        email: safe(user.email),
        role: safe(user.role),
        orgID: safe(user.organizationID ?? user.organization?.id),
        org: safe(user.organization?.name ?? user.organizationID),
      },
      opts
    );
  });

  return me;
}

export function buildUsersCommand(): Command {
  const users = new Command('users').description('List organization users');

  outputFlags(users).action(async (opts: OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      organizationUsers?: Array<{
        id: string;
        name?: string;
        displayName?: string;
        email?: string;
        role?: string;
      }>;
    }>('getOrganizationUsers', OPS.getOrganizationUsers, {
      orgID: client.orgID,
    });

    const users = data.organizationUsers ?? [];

    if (opts.json) {
      printJSON(users);
      return;
    }

    printTable(
      ['ID', 'Name', 'Email', 'Role'],
      users.map((u) => [
        u.id.slice(0, 8),
        safe(u.displayName ?? u.name),
        safe(u.email),
        safe(u.role),
      ]),
      opts
    );
  });

  return users;
}
