import { Command } from 'commander';
import { PylonClient } from '../lib/client.js';
import { OPS } from '../lib/operations.js';
import { printTable, printJSON, safe } from '../lib/output.js';
import type { OutputOptions } from '../types/index.js';

function outputFlags(cmd: Command): Command {
  return cmd.option('--json', 'Output as JSON').option('--csv', 'Output as CSV');
}

export function buildNotificationsCommand(): Command {
  const notifications = new Command('notifications').description('Notification management');

  outputFlags(
    notifications.command('list').description('List notifications')
  ).action(async (opts: OutputOptions) => {
    const client = new PylonClient();

    // Get unread count (basic notification info available)
    const data = await client.query<{
      numUnreadUserNotifications?: number | { count?: number };
    }>('getNumUnreadUserNotifications', OPS.getNumUnreadUserNotifications, {
      orgID: client.orgID,
      userID: '',
    });

    const unread =
      typeof data.numUnreadUserNotifications === 'number'
        ? data.numUnreadUserNotifications
        : data.numUnreadUserNotifications?.count ?? 0;

    if (opts.json) {
      printJSON({ unreadCount: unread });
      return;
    }

    console.log(`Unread notifications: ${unread}`);
    console.log(
      '\nTip: For full notification details, use the Pylon web app or pass --json to see the raw response.'
    );
  });

  return notifications;
}
