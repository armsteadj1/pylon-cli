import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../lib/config.js';
import { discoverOrgID } from '../lib/client.js';

export function buildAuthCommand(): Command {
  const auth = new Command('auth').description('Authentication management');

  auth
    .command('login')
    .alias('set')
    .description('Save CSRF token and auto-discover orgID')
    .requiredOption('--csrf-token <token>', 'x-csrf-token from browser DevTools')
    .option('--org-id <orgID>', 'Org ID (auto-discovered if omitted)')
    .action(async (opts: { csrfToken: string; orgId?: string }) => {
      let orgID = opts.orgId ?? '';
      let userID = '';

      if (!orgID) {
        process.stdout.write('Discovering orgID... ');
        try {
          const result = await discoverOrgID(opts.csrfToken);
          orgID = result.orgID;
          userID = result.userID;
          console.log(chalk.green('OK'));
        } catch (err) {
          console.log(chalk.red('FAILED'));
          console.error(
            chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`)
          );
          console.error(
            'Tip: pass --org-id <orgID> to skip auto-discovery'
          );
          process.exit(1);
        }
      }

      ConfigManager.write({ csrfToken: opts.csrfToken, orgID });
      console.log(chalk.green('Authenticated successfully!'));
      console.log(`  orgID:  ${orgID}`);
      if (userID) console.log(`  userID: ${userID}`);
    });

  // Also support: pylon auth --csrf-token <token>  (top-level shorthand)
  auth
    .option('--csrf-token <token>', 'x-csrf-token (shorthand for pylon auth login)')
    .option('--org-id <orgID>', 'Org ID override')
    .action(async (opts: { csrfToken?: string; orgId?: string }) => {
      if (!opts.csrfToken) {
        auth.help();
        return;
      }
      let orgID = opts.orgId ?? '';
      if (!orgID) {
        process.stdout.write('Discovering orgID... ');
        try {
          const result = await discoverOrgID(opts.csrfToken);
          orgID = result.orgID;
          console.log(chalk.green('OK'));
        } catch (err) {
          console.log(chalk.red('FAILED'));
          console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
          console.error('Tip: pass --org-id <orgID> to skip auto-discovery');
          process.exit(1);
        }
      }
      ConfigManager.write({ csrfToken: opts.csrfToken, orgID });
      console.log(chalk.green('Authenticated successfully!'));
      console.log(`  orgID: ${orgID}`);
    });

  auth
    .command('status')
    .description('Show current auth status')
    .action(() => {
      const config = ConfigManager.read();
      if (!config) {
        console.log(chalk.yellow('Not authenticated.'));
        console.log('Run: pylon auth --csrf-token <token>');
        return;
      }
      console.log(chalk.green('Authenticated'));
      console.log(`  csrfToken: ${ConfigManager.mask(config.csrfToken)}`);
      console.log(`  orgID:     ${config.orgID}`);
    });

  auth
    .command('logout')
    .description('Clear stored credentials')
    .action(() => {
      ConfigManager.clear();
      console.log(chalk.yellow('Logged out. Config cleared.'));
    });

  return auth;
}
