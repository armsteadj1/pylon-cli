import { Command } from 'commander';
import chalk from 'chalk';
import { PylonClient } from '../lib/client.js';
import { OPS } from '../lib/operations.js';
import { printTable, printKeyValue, printJSON, safe } from '../lib/output.js';
import type { OutputOptions } from '../types/index.js';

function outputFlags(cmd: Command): Command {
  return cmd.option('--json', 'Output as JSON').option('--csv', 'Output as CSV');
}

export function buildAccountsCommand(): Command {
  const accounts = new Command('accounts').description('Account management');

  outputFlags(
    accounts
      .command('list')
      .description('List accounts')
      .option('--limit <n>', 'Max results', '100')
  ).action(async (opts: { limit: string } & OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      organization?: {
        id?: string;
        accountsPaginatedV2?: {
          edges?: Array<{
            node: {
              id: string;
              name?: string;
              primaryDomain?: string;
              tier?: string;
              mrr?: number;
              createdAt?: string;
            };
          }>;
        };
      };
    }>('GetAccountsPaginated', OPS.GetAccountsPaginated, {
      orgID: client.orgID,
      first: parseInt(opts.limit, 10),
      input: {
        includeAnonymous: true,
        includeInternal: true,
        onlyInternal: false,
        onlyCommunity: false,
        onlyPartner: false,
        filters: { anyOf: [], allOf: [] },
        searchText: '',
        onlyDuplicates: false,
      },
      includeProjects: false,
      customFieldDefinitionIDs: [],
      includeCustomFields: false,
    });

    const nodes = data.organization?.accountsPaginatedV2?.edges?.map((e) => e.node) ?? [];

    if (opts.json) {
      printJSON(nodes);
      return;
    }

    printTable(
      ['ID', 'Name', 'Domain', 'Tier', 'MRR', 'Created'],
      nodes.map((n) => [
        n.id.slice(0, 8),
        safe(n.name),
        safe(n.primaryDomain),
        safe(n.tier),
        safe(n.mrr),
        safe(n.createdAt)?.slice(0, 10),
      ]),
      opts
    );
    console.log(chalk.grey(`\n${nodes.length} account(s)`));
  });

  outputFlags(
    accounts.command('get <id>').description('Get account details')
  ).action(async (id: string, opts: OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      account?: {
        id: string;
        name?: string;
        primaryDomain?: string;
        tier?: string;
        mrr?: number;
        arr?: number;
        createdAt?: string;
        updatedAt?: string;
        description?: string;
        website?: string;
        industry?: string;
        employeeCount?: number;
      };
    }>('getAccount', OPS.getAccount, {
      orgID: client.orgID,
      accountId: id,
    });

    const account = data.account;
    if (!account) {
      console.error(chalk.red('Account not found'));
      process.exit(1);
    }

    if (opts.json) {
      printJSON(account);
      return;
    }

    printKeyValue(
      {
        id: account.id,
        name: safe(account.name),
        domain: safe(account.primaryDomain),
        website: safe(account.website),
        tier: safe(account.tier),
        mrr: safe(account.mrr),
        arr: safe(account.arr),
        industry: safe(account.industry),
        employees: safe(account.employeeCount),
        created: safe(account.createdAt)?.slice(0, 10),
        updated: safe(account.updatedAt)?.slice(0, 10),
      },
      opts
    );
  });

  outputFlags(
    accounts.command('contacts <id>').description('List contacts for an account')
  ).action(async (id: string, opts: OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      accountContacts?: Array<{
        id: string;
        name?: string;
        email?: string;
        role?: string;
        createdAt?: string;
      }>;
    }>('getAccountContacts', OPS.getAccountContacts, {
      orgID: client.orgID,
      accountID: id,
    });

    const contacts = data.accountContacts ?? [];

    if (opts.json) {
      printJSON(contacts);
      return;
    }

    printTable(
      ['ID', 'Name', 'Email', 'Role', 'Created'],
      contacts.map((c) => [
        c.id.slice(0, 8),
        safe(c.name),
        safe(c.email),
        safe(c.role),
        safe(c.createdAt)?.slice(0, 10),
      ]),
      opts
    );
  });

  outputFlags(
    accounts
      .command('issues <id>')
      .description('List issues for an account')
      .option('--limit <n>', 'Max results', '50')
  ).action(async (id: string, opts: { limit: string } & OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      paginatedIssues?: {
        edges?: Array<{
          node: {
            id: string;
            ticketNumber?: number;
            title?: string;
            state?: string;
            priority?: string;
            createdAt?: string;
          };
        }>;
      };
    }>('getPaginatedIssues', OPS.getPaginatedIssues, {
      orgID: client.orgID,
      previewHTMLType: 'FIRST_MESSAGE',
      onlyIssuesWithDrafts: false,
      onlyIssuesWithScheduledMessages: false,
      accountCustomFieldDefinitionIDs: [],
      includeAccountCustomFields: false,
      includeAccountTags: false,
      options: {
        onlyIssuesWithDrafts: false,
        onlyIssuesWithScheduledMessages: false,
        onlyUnreadIssues: false,
        filterTimeWithLatestMessageActivity: false,
        filtersV2: {
          allOf: [
            {
              attribute: 'account_id',
              operator: 'includes_any_of',
              values: [id],
              objectType: 'issue',
              type: 'default_field',
            },
          ],
          anyOf: [],
        },
        sortInfo: { column: 'created_at', order: 'desc', type: 'default_field' },
      },
      first: parseInt(opts.limit, 10),
    });

    const nodes = data.paginatedIssues?.edges?.map((e) => e.node) ?? [];

    if (opts.json) {
      printJSON(nodes);
      return;
    }

    printTable(
      ['#', 'ID', 'Title', 'State', 'Priority'],
      nodes.map((n) => [
        safe(n.ticketNumber),
        n.id.slice(0, 8),
        (n.title ?? '').slice(0, 60),
        safe(n.state),
        safe(n.priority),
      ]),
      opts
    );
  });

  outputFlags(
    accounts.command('projects <id>').description('List projects for an account')
  ).action(async (id: string, opts: OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      accountProjects?: Array<{
        id: string;
        name?: string;
        status?: string;
        dueDate?: string;
        createdAt?: string;
      }>;
    }>('getAccountProjects', OPS.getAccountProjects, {
      orgID: client.orgID,
      accountID: id,
    });

    const projects = data.accountProjects ?? [];

    if (opts.json) {
      printJSON(projects);
      return;
    }

    printTable(
      ['ID', 'Name', 'Status', 'Due Date'],
      projects.map((p) => [
        p.id.slice(0, 8),
        safe(p.name),
        safe(p.status),
        safe(p.dueDate)?.slice(0, 10),
      ]),
      opts
    );
  });

  outputFlags(
    accounts.command('highlights <id>').description('Show highlights for an account')
  ).action(async (id: string, opts: OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      accountHighlights?: Array<{
        id: string;
        title?: string;
        content?: string;
        type?: string;
        createdAt?: string;
      }>;
    }>('GetAccountHighlights', OPS.GetAccountHighlights, {
      orgID: client.orgID,
      accountID: id,
    });

    const highlights = data.accountHighlights ?? [];

    if (opts.json) {
      printJSON(highlights);
      return;
    }

    printTable(
      ['ID', 'Title', 'Type', 'Created'],
      highlights.map((h) => [
        h.id.slice(0, 8),
        (h.title ?? '').slice(0, 60),
        safe(h.type),
        safe(h.createdAt)?.slice(0, 10),
      ]),
      opts
    );
  });

  outputFlags(
    accounts
      .command('activity <id>')
      .description('Show activity log for an account')
      .option('--start <date>', 'Start date (ISO)')
      .option('--end <date>', 'End date (ISO)')
      .option('--limit <n>', 'Max results', '100')
  ).action(
    async (
      id: string,
      opts: { start?: string; end?: string; limit: string } & OutputOptions
    ) => {
      const client = new PylonClient();

      const now = new Date();
      const start =
        opts.start ??
        new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = opts.end ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

      const data = await client.query<{
        accountActivityLogsPaginated?: {
          edges?: Array<{
            node: {
              id: string;
              activityType?: string;
              description?: string;
              createdAt?: string;
            };
          }>;
        };
      }>('getAccountActivityLogsPaginated', OPS.getAccountActivityLogsPaginated, {
        orgID: client.orgID,
        accountID: id,
        first: parseInt(opts.limit, 10),
        input: {
          startTimestamp: start,
          endTimestamp: end,
          filters: { anyOf: [], allOf: [] },
        },
      });

      const nodes =
        data.accountActivityLogsPaginated?.edges?.map((e) => e.node) ?? [];

      if (opts.json) {
        printJSON(nodes);
        return;
      }

      printTable(
        ['ID', 'Type', 'Description', 'Date'],
        nodes.map((n) => [
          n.id.slice(0, 8),
          safe(n.activityType),
          (n.description ?? '').slice(0, 60),
          safe(n.createdAt)?.slice(0, 10),
        ]),
        opts
      );
    }
  );

  return accounts;
}
