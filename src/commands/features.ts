import { Command } from 'commander';
import chalk from 'chalk';
import { PylonClient } from '../lib/client.js';
import { OPS } from '../lib/operations.js';
import { printTable, printJSON, safe } from '../lib/output.js';
import type { OutputOptions } from '../types/index.js';

function outputFlags(cmd: Command): Command {
  return cmd.option('--json', 'Output as JSON').option('--csv', 'Output as CSV');
}

export function buildFeaturesCommand(): Command {
  const features = new Command('features').description('Feature request management');

  outputFlags(
    features.command('list').description('List feature requests')
  ).action(async (opts: OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      featureRequests?: Array<{
        id: string;
        title?: string;
        status?: string;
        accountCount?: number;
        revenue?: number;
        createdAt?: string;
      }>;
    }>('GetFeatureRequests', OPS.GetFeatureRequests, {
      orgID: client.orgID,
      filters: { anyOf: [], allOf: [] },
    });

    const items = data.featureRequests ?? [];

    if (opts.json) {
      printJSON(items);
      return;
    }

    printTable(
      ['ID', 'Title', 'Status', 'Accounts', 'Revenue', 'Created'],
      items.map((f) => [
        f.id.slice(0, 8),
        (f.title ?? '').slice(0, 60),
        safe(f.status),
        safe(f.accountCount),
        safe(f.revenue),
        safe(f.createdAt)?.slice(0, 10),
      ]),
      opts
    );
    console.log(chalk.grey(`\n${items.length} feature request(s)`));
  });

  outputFlags(
    features.command('revenue').description('Feature requests with revenue data')
  ).action(async (opts: OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      featureRequestsRevenue?: Array<{
        id: string;
        title?: string;
        status?: string;
        revenue?: number;
        accountCount?: number;
      }>;
    }>('GetFeatureRequestsRevenue', OPS.GetFeatureRequestsRevenue, {
      orgID: client.orgID,
      filters: { anyOf: [], allOf: [] },
    });

    const items = data.featureRequestsRevenue ?? [];

    if (opts.json) {
      printJSON(items);
      return;
    }

    const sorted = [...items].sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0));

    printTable(
      ['ID', 'Title', 'Status', 'Revenue ($)', 'Accounts'],
      sorted.map((f) => [
        f.id.slice(0, 8),
        (f.title ?? '').slice(0, 60),
        safe(f.status),
        safe(f.revenue),
        safe(f.accountCount),
      ]),
      opts
    );
  });

  return features;
}
