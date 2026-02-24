import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../lib/config.js';
import { discoverOrgID } from '../lib/client.js';

export function buildAuthCommand(): Command {
  const auth = new Command('auth').description('Authentication management');

  auth
    .description('Save session cookies and auto-discover orgID')
    .requiredOption('--session <token>', 'pylon_session cookie value')
    .requiredOption('--csrf <token>', 'pylon_csrf cookie value')
    .option('--org-id <orgID>', 'Org ID (auto-discovered if omitted)')
    .action(async (opts: { session: string; csrf: string; orgId?: string }) => {
      let orgID = opts.orgId ?? '';
      let userID = '';

      if (!orgID) {
        process.stdout.write('Discovering orgID... ');
        try {
          const result = await discoverOrgID(opts.session, opts.csrf);
          orgID = result.orgID;
          userID = result.userID;
          console.log(chalk.green('OK'));
        } catch (err) {
          console.log(chalk.red('FAILED'));
          console.error(
            chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`)
          );
          console.error('Tip: pass --org-id <orgID> to skip auto-discovery');
          process.exit(1);
        }
      }

      ConfigManager.write({ session: opts.session, pylonCsrf: opts.csrf, orgID });
      console.log(chalk.green('Authenticated successfully!'));
      console.log(`  orgID:  ${orgID}`);
      if (userID) console.log(`  userID: ${userID}`);
    });

  auth
    .command('status')
    .description('Show current auth status')
    .action(() => {
      const config = ConfigManager.read();
      if (!config) {
        console.log(chalk.yellow('Not authenticated.'));
        console.log('Run: pylon auth --session <token> --csrf <token>');
        return;
      }
      console.log(chalk.green('Authenticated'));
      console.log(`  session:   ${ConfigManager.mask(config.session)}`);
      console.log(`  pylon_csrf: ${ConfigManager.mask(config.pylonCsrf)}`);
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
