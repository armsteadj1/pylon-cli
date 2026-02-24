import { Command } from 'commander';
import chalk from 'chalk';
import { PylonClient } from '../lib/client.js';
import { OPS } from '../lib/operations.js';
import { printTable, printJSON, safe } from '../lib/output.js';
import type { OutputOptions } from '../types/index.js';

function outputFlags(cmd: Command): Command {
  return cmd.option('--json', 'Output as JSON').option('--csv', 'Output as CSV');
}

export function buildTasksCommand(): Command {
  const tasks = new Command('tasks').description('Task management');

  outputFlags(
    tasks
      .command('list')
      .description('List tasks')
      .option('--limit <n>', 'Max results', '100')
  ).action(async (opts: { limit: string } & OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      tasksPaginated?: {
        edges?: Array<{
          node: {
            id: string;
            title?: string;
            status?: string;
            dueDate?: string;
            assignee?: { id: string; displayName?: string; name?: string };
            account?: { id: string; name?: string };
            createdAt?: string;
          };
        }>;
      };
    }>('getTasksPaginated', OPS.getTasksPaginated, {
      orgID: client.orgID,
      first: parseInt(opts.limit, 10),
      options: {
        filters: { allOf: [], anyOf: [] },
        sortInfo: { type: 'default_field', column: 'task_due_date', order: 'asc' },
      },
    });

    const nodes = data.tasksPaginated?.edges?.map((e) => e.node) ?? [];

    if (opts.json) {
      printJSON(nodes);
      return;
    }

    printTable(
      ['ID', 'Title', 'Status', 'Due Date', 'Assignee', 'Account'],
      nodes.map((n) => [
        n.id.slice(0, 8),
        (n.title ?? '').slice(0, 50),
        safe(n.status),
        safe(n.dueDate)?.slice(0, 10),
        safe(n.assignee?.displayName ?? n.assignee?.name),
        safe(n.account?.name),
      ]),
      opts
    );
    console.log(chalk.grey(`\n${nodes.length} task(s)`));
  });

  outputFlags(
    tasks.command('count').description('Count open tasks')
  ).action(async (opts: OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      orgOpenTasksCount?: number | { count?: number };
    }>('GetOrgOpenTasksCount', OPS.GetOrgOpenTasksCount, {
      orgID: client.orgID,
    });

    const count =
      typeof data.orgOpenTasksCount === 'number'
        ? data.orgOpenTasksCount
        : data.orgOpenTasksCount?.count ?? 0;

    if (opts.json) {
      printJSON({ count });
      return;
    }
    console.log(`${chalk.cyan(String(count))} open task(s)`);
  });

  return tasks;
}
