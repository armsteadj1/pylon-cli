import { Command } from 'commander';
import { PylonClient } from '../lib/client.js';
import { OPS } from '../lib/operations.js';
import { printTable, printJSON, safe } from '../lib/output.js';
import type { OutputOptions } from '../types/index.js';

function outputFlags(cmd: Command): Command {
  return cmd.option('--json', 'Output as JSON').option('--csv', 'Output as CSV');
}

function defaultStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString();
}

export function buildAnalyticsCommand(): Command {
  const analytics = new Command('analytics').description('Analytics and reporting');

  outputFlags(
    analytics
      .command('query <query>')
      .description('Run an analytics query (JSON string)')
  ).action(async (queryStr: string, opts: OutputOptions) => {
    const client = new PylonClient();

    let query: unknown;
    try {
      query = JSON.parse(queryStr);
    } catch {
      console.error('Error: query must be a valid JSON string');
      process.exit(1);
    }

    const data = await client.query<{
      analytics?: unknown;
    }>('getAnalytics', OPS.getAnalytics, {
      orgID: client.orgID,
      query,
    });

    if (opts.json) {
      printJSON(data.analytics ?? data);
      return;
    }

    console.log(JSON.stringify(data.analytics ?? data, null, 2));
  });

  outputFlags(
    analytics.command('dashboards').description('List analytics dashboards')
  ).action(async (opts: OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      analyticsDashboards?: Array<{
        id: string;
        name?: string;
        createdAt?: string;
        isDefault?: boolean;
      }>;
    }>('getAnalyticsDashboards', OPS.getAnalyticsDashboards, {
      orgID: client.orgID,
    });

    const dashboards = data.analyticsDashboards ?? [];

    if (opts.json) {
      printJSON(dashboards);
      return;
    }

    printTable(
      ['ID', 'Name', 'Default', 'Created'],
      dashboards.map((d) => [
        d.id.slice(0, 8),
        safe(d.name),
        safe(d.isDefault),
        safe(d.createdAt)?.slice(0, 10),
      ]),
      opts
    );
  });

  outputFlags(
    analytics
      .command('accounts')
      .description('Analytics for accounts')
      .option('--start <date>', 'Start date (ISO)', defaultStart)
      .option('--type <type>', 'Type filter (success|at_risk|etc.)', 'success')
  ).action(async (opts: { start: string; type: string } & OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      analyticsAccounts?: Array<{
        id: string;
        name?: string;
        domain?: string;
        mrr?: number;
        status?: string;
      }>;
    }>('getAnalyticsAccounts', OPS.getAnalyticsAccounts, {
      orgID: client.orgID,
      startTimestamp: opts.start,
      type: opts.type,
      accountFilters: { anyOf: [], allOf: [] },
    });

    const items = data.analyticsAccounts ?? [];

    if (opts.json) {
      printJSON(items);
      return;
    }

    printTable(
      ['ID', 'Name', 'Domain', 'MRR', 'Status'],
      items.map((a) => [
        a.id.slice(0, 8),
        safe(a.name),
        safe(a.domain),
        safe(a.mrr),
        safe(a.status),
      ]),
      opts
    );
  });

  outputFlags(
    analytics
      .command('users')
      .description('Analytics for users')
      .option('--start <date>', 'Start date (ISO)', defaultStart)
      .option('--type <type>', 'Type filter', 'success')
  ).action(async (opts: { start: string; type: string } & OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      analyticsUsers?: Array<{
        id: string;
        name?: string;
        email?: string;
        account?: { id: string; name?: string };
        status?: string;
      }>;
    }>('getAnalyticsUsers', OPS.getAnalyticsUsers, {
      orgID: client.orgID,
      startTimestamp: opts.start,
      accountIDs: [],
      type: opts.type,
    });

    const items = data.analyticsUsers ?? [];

    if (opts.json) {
      printJSON(items);
      return;
    }

    printTable(
      ['ID', 'Name', 'Email', 'Account', 'Status'],
      items.map((u) => [
        u.id.slice(0, 8),
        safe(u.name),
        safe(u.email),
        safe(u.account?.name),
        safe(u.status),
      ]),
      opts
    );
  });

  return analytics;
}
