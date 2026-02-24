#!/usr/bin/env node

import { Command } from 'commander';
import { createRequire } from 'module';
import { buildAuthCommand } from './commands/auth.js';
import { buildIssuesCommand } from './commands/issues.js';
import { buildAccountsCommand } from './commands/accounts.js';
import { buildContactsCommand } from './commands/contacts.js';
import { buildFeaturesCommand } from './commands/features.js';
import { buildTasksCommand } from './commands/tasks.js';
import { buildAnalyticsCommand } from './commands/analytics.js';
import { buildKBCommand } from './commands/kb.js';
import { buildNotificationsCommand } from './commands/notifications.js';
import { buildAnnouncementsCommand } from './commands/announcements.js';
import { buildOrgCommand, buildMeCommand, buildUsersCommand } from './commands/org.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { name: string; version: string };

// Update notifier (async, non-blocking)
async function checkForUpdates(): Promise<void> {
  try {
    const res = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(pkg.name)}/latest`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return;
    const data = (await res.json()) as { version?: string };
    const latest = data.version;
    if (!latest || latest === pkg.version) return;
    const [maj, min] = pkg.version.split('.').map(Number);
    const [lmaj, lmin] = latest.split('.').map(Number);
    if (lmaj > maj || (lmaj === maj && lmin > min)) {
      console.error(
        `\n  Update available: ${pkg.version} → ${latest}\n  Run: npm i -g ${pkg.name}\n`
      );
    }
  } catch {
    // ignore update check failures
  }
}

const program = new Command();

program
  .name('pylon')
  .description('Read-only CLI for Pylon (usepylon.com)')
  .version(pkg.version, '-v, --version', 'Show version');

program.addCommand(buildAuthCommand());
program.addCommand(buildIssuesCommand());
program.addCommand(buildAccountsCommand());
program.addCommand(buildContactsCommand());
program.addCommand(buildFeaturesCommand());
program.addCommand(buildTasksCommand());
program.addCommand(buildAnalyticsCommand());
program.addCommand(buildKBCommand());
program.addCommand(buildNotificationsCommand());
program.addCommand(buildAnnouncementsCommand());
program.addCommand(buildOrgCommand());
program.addCommand(buildMeCommand());
program.addCommand(buildUsersCommand());

// Run: await both the command and the update check so the notice
// always has a chance to print before the process exits.
async function main(): Promise<void> {
  const updateCheck = checkForUpdates();
  await program.parseAsync(process.argv);
  await updateCheck;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
