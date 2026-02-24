import { Command } from 'commander';
import { PylonClient } from '../lib/client.js';
import { OPS } from '../lib/operations.js';
import { printTable, printJSON, safe } from '../lib/output.js';
import type { OutputOptions } from '../types/index.js';

function outputFlags(cmd: Command): Command {
  return cmd.option('--json', 'Output as JSON').option('--csv', 'Output as CSV');
}

export function buildAnnouncementsCommand(): Command {
  const announcements = new Command('announcements').description('Announcement management');

  outputFlags(
    announcements
      .command('list')
      .description('List announcements')
      .option('--unread', 'Only show unread announcements')
  ).action(async (opts: { unread?: boolean } & OutputOptions) => {
    const client = new PylonClient();

    const opName = opts.unread ? 'GetUnreadAnnouncements' : 'GetActiveAnnouncements';
    const hash = opts.unread ? OPS.GetUnreadAnnouncements : OPS.GetActiveAnnouncements;

    const data = await client.query<{
      announcements?: Array<{
        id: string;
        title?: string;
        body?: string;
        createdAt?: string;
        read?: boolean;
        status?: string;
      }>;
      unreadAnnouncements?: Array<{
        id: string;
        title?: string;
        body?: string;
        createdAt?: string;
        read?: boolean;
        status?: string;
      }>;
      activeAnnouncements?: Array<{
        id: string;
        title?: string;
        body?: string;
        createdAt?: string;
        read?: boolean;
        status?: string;
      }>;
    }>(opName, hash, {
      orgID: client.orgID,
    });

    const items =
      data.announcements ??
      data.unreadAnnouncements ??
      data.activeAnnouncements ??
      [];

    if (opts.json) {
      printJSON(items);
      return;
    }

    printTable(
      ['ID', 'Title', 'Status', 'Read', 'Created'],
      items.map((a) => [
        a.id.slice(0, 8),
        (a.title ?? '').slice(0, 60),
        safe(a.status),
        safe(a.read),
        safe(a.createdAt)?.slice(0, 10),
      ]),
      opts
    );
  });

  return announcements;
}
