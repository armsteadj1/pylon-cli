import { Command } from 'commander';
import chalk from 'chalk';
import { PylonClient } from '../lib/client.js';
import { OPS } from '../lib/operations.js';
import { printTable, printKeyValue, printJSON, safe } from '../lib/output.js';
import type { OutputOptions } from '../types/index.js';

interface IssueNode {
  id: string;
  ticketNumber?: number;
  title?: string;
  state?: string;
  createdAt?: string;
  updatedAt?: string;
  priority?: string;
  assignee?: { id: string; displayName?: string; name?: string };
  account?: { id: string; name?: string };
}

function outputFlags(cmd: Command): Command {
  return cmd
    .option('--json', 'Output as JSON')
    .option('--csv', 'Output as CSV');
}

export function buildIssuesCommand(): Command {
  const issues = new Command('issues').description('Issue management');

  outputFlags(
    issues
      .command('list')
      .description('List issues')
      .option('--status <status>', 'Filter by status (open|closed)', 'open')
      .option('--view <viewId>', 'Filter by view ID')
      .option('--limit <n>', 'Max results', '50')
  ).action(async (opts: { status: string; view?: string; limit: string } & OutputOptions) => {
    const client = new PylonClient();
    const limit = parseInt(opts.limit, 10);

    const filtersV2: Record<string, unknown> = {
      allOf: [
        {
          attribute: 'state',
          operator: 'includes_any_of',
          values: [opts.status],
          objectType: 'issue',
          type: 'default_field',
        },
      ],
      anyOf: [],
    };

    const options: Record<string, unknown> = {
      onlyIssuesWithDrafts: false,
      onlyIssuesWithScheduledMessages: false,
      onlyUnreadIssues: false,
      filterTimeWithLatestMessageActivity: true,
      filtersV2,
      sortInfo: {
        column: 'issue_latest_message_activity_at',
        order: 'desc',
        type: 'default_field',
      },
    };

    const data = await client.query<{
      paginatedIssues?: { edges?: Array<{ node: IssueNode }> };
    }>(
      'getPaginatedIssues',
      OPS.getPaginatedIssues,
      {
        orgID: client.orgID,
        previewHTMLType: 'FIRST_MESSAGE',
        onlyIssuesWithDrafts: false,
        onlyIssuesWithScheduledMessages: false,
        accountCustomFieldDefinitionIDs: [],
        includeAccountCustomFields: false,
        includeAccountTags: false,
        options,
        first: limit,
      }
    );

    const nodes =
      data.paginatedIssues?.edges?.map((e) => e.node) ?? [];

    if (opts.json) {
      printJSON(nodes);
      return;
    }

    printTable(
      ['#', 'ID', 'Title', 'State', 'Priority', 'Account', 'Assignee'],
      nodes.map((n) => [
        safe(n.ticketNumber),
        n.id.slice(0, 8),
        (n.title ?? '').slice(0, 60),
        safe(n.state),
        safe(n.priority),
        safe(n.account?.name),
        safe(n.assignee?.displayName ?? n.assignee?.name),
      ]),
      opts
    );
    console.log(chalk.grey(`\n${nodes.length} issue(s)`));
  });

  outputFlags(
    issues
      .command('get <id>')
      .description('Get issue details by ID or ticket number')
  ).action(async (id: string, opts: OutputOptions) => {
    const client = new PylonClient();

    // Check if id is a number (ticket number)
    const isTicketNum = /^\d+$/.test(id);
    let issueID = id;

    if (isTicketNum) {
      const resolved = await client.query<{
        resolveIssueByTicketNumber?: { id: string };
      }>('resolveIssueByTicketNumber', OPS.resolveIssueByTicketNumber, {
        orgID: client.orgID,
        ticketNumber: parseInt(id, 10),
      });
      issueID = resolved.resolveIssueByTicketNumber?.id ?? id;
    }

    const data = await client.query<{
      issue?: IssueNode & {
        description?: string;
        tags?: Array<{ name: string }>;
        team?: { id: string; name?: string };
        slaStatus?: string;
      };
    }>('getSidebarIssue', OPS.getSidebarIssue, {
      orgID: client.orgID,
      issueID,
    });

    const issue = data.issue;
    if (!issue) {
      console.error(chalk.red('Issue not found'));
      process.exit(1);
    }

    if (opts.json) {
      printJSON(issue);
      return;
    }

    printKeyValue(
      {
        id: issue.id,
        'ticket #': safe(issue.ticketNumber),
        title: safe(issue.title),
        state: safe(issue.state),
        priority: safe(issue.priority),
        account: safe(issue.account?.name),
        assignee: safe(issue.assignee?.displayName ?? issue.assignee?.name),
        created: safe(issue.createdAt),
        updated: safe(issue.updatedAt),
      },
      opts
    );
  });

  outputFlags(
    issues
      .command('views')
      .description('List saved issue views')
  ).action(async (opts: OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      views?: Array<{ id: string; name?: string; objectType?: string; isDefault?: boolean }>;
    }>('getViews', OPS.getViews, {
      orgID: client.orgID,
      userID: '',
      hasProjectManagement: true,
      canViewAccounts: true,
      canViewAnalytics: true,
      canViewFeatureRequests: true,
    });

    const views = (data.views ?? []).filter((v) => v.objectType === 'issue' || !v.objectType);

    if (opts.json) {
      printJSON(views);
      return;
    }

    printTable(
      ['ID', 'Name', 'Default'],
      views.map((v) => [v.id, safe(v.name), safe(v.isDefault)]),
      opts
    );
  });

  outputFlags(
    issues
      .command('view <viewId>')
      .description('Get issues in a specific view')
      .option('--limit <n>', 'Max results', '50')
  ).action(async (viewId: string, opts: { limit: string } & OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      issueView?: {
        issues?: Array<IssueNode>;
        paginatedIssues?: { edges?: Array<{ node: IssueNode }> };
      };
    }>('getIssueView', OPS.getIssueView, {
      orgID: client.orgID,
      viewID: viewId,
    });

    const view = data.issueView;
    const nodes =
      view?.issues ??
      view?.paginatedIssues?.edges?.map((e) => e.node) ??
      [];

    if (opts.json) {
      printJSON(nodes);
      return;
    }

    printTable(
      ['#', 'ID', 'Title', 'State', 'Account'],
      nodes.slice(0, parseInt(opts.limit, 10)).map((n) => [
        safe(n.ticketNumber),
        n.id.slice(0, 8),
        (n.title ?? '').slice(0, 60),
        safe(n.state),
        safe(n.account?.name),
      ]),
      opts
    );
  });

  outputFlags(
    issues
      .command('sla')
      .description('Show SLA violation issues')
      .option('--start <date>', 'Start date (ISO)', () => {
        const d = new Date();
        d.setDate(d.getDate() - 90);
        return d.toISOString();
      })
  ).action(async (opts: { start: string } & OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      slaIssues?: Array<IssueNode & { slaBreached?: boolean; slaStatus?: string }>;
    }>('getSLAIssues', OPS.getSLAIssues, {
      orgID: client.orgID,
      startTimestamp: opts.start,
      issueFilters: { anyOf: [], allOf: [] },
    });

    const items = data.slaIssues ?? [];

    if (opts.json) {
      printJSON(items);
      return;
    }

    printTable(
      ['#', 'ID', 'Title', 'State', 'SLA Status', 'Account'],
      items.map((n) => [
        safe(n.ticketNumber),
        n.id.slice(0, 8),
        (n.title ?? '').slice(0, 50),
        safe(n.state),
        safe(n.slaStatus),
        safe(n.account?.name),
      ]),
      opts
    );
    console.log(chalk.grey(`\n${items.length} SLA issue(s)`));
  });

  outputFlags(
    issues
      .command('digest <id>')
      .description('AI-generated digest for an issue')
  ).action(async (id: string, opts: OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      generateIssueDigest?: { digest?: string; summary?: string; text?: string };
    }>('generateIssueDigest', OPS.generateIssueDigest, {
      input: {
        organizationID: client.orgID,
        issueID: id,
      },
    });

    const result = data.generateIssueDigest;
    if (opts.json) {
      printJSON(result);
      return;
    }

    const text =
      result?.digest ?? result?.summary ?? result?.text ?? JSON.stringify(result, null, 2);
    console.log(text);
  });

  outputFlags(
    issues
      .command('count')
      .description('Count issues')
      .option('--status <status>', 'Filter by status', 'open')
  ).action(async (opts: { status: string } & OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{ issuesCount?: number | { count?: number } }>(
      'getIssuesCount',
      OPS.getIssuesCount,
      {
        orgID: client.orgID,
        options: {
          onlyIssuesWithDrafts: false,
          onlyIssuesWithScheduledMessages: false,
          onlyUnreadIssues: false,
          filterTimeWithLatestMessageActivity: true,
          filtersV2: {
            allOf: [
              {
                attribute: 'state',
                operator: 'includes_any_of',
                values: [opts.status],
                objectType: 'issue',
                type: 'default_field',
              },
            ],
            anyOf: [],
          },
        },
      }
    );

    const count =
      typeof data.issuesCount === 'number'
        ? data.issuesCount
        : data.issuesCount?.count ?? 0;

    if (opts.json) {
      printJSON({ count, status: opts.status });
      return;
    }
    console.log(`${chalk.cyan(String(count))} ${opts.status} issue(s)`);
  });

  return issues;
}
