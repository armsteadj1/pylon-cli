import { Command } from 'commander';
import chalk from 'chalk';
import { PylonClient } from '../lib/client.js';
import { OPS } from '../lib/operations.js';
import { printTable, printKeyValue, printJSON, safe } from '../lib/output.js';
import type { OutputOptions } from '../types/index.js';

function outputFlags(cmd: Command): Command {
  return cmd.option('--json', 'Output as JSON').option('--csv', 'Output as CSV');
}

export function buildContactsCommand(): Command {
  const contacts = new Command('contacts').description('Contact management');

  outputFlags(
    contacts
      .command('list')
      .description('List contacts')
      .option('--account <accountId>', 'Filter by account ID')
      .option('--limit <n>', 'Max results', '50')
  ).action(async (opts: { account?: string; limit: string } & OutputOptions) => {
    const client = new PylonClient();

    const filters = opts.account
      ? {
          anyOf: [],
          allOf: [
            {
              attribute: 'contact_account_id',
              operator: 'includes_any_of',
              objectType: 'contact',
              type: 'default_field',
              values: [opts.account],
            },
          ],
        }
      : { anyOf: [], allOf: [] };

    const data = await client.query<{
      contactsPaginated?: {
        edges?: Array<{
          node: {
            id: string;
            name?: string;
            email?: string;
            account?: { id: string; name?: string };
            role?: string;
            createdAt?: string;
          };
        }>;
      };
    }>('GetContactsPaginated', OPS.GetContactsPaginated, {
      orgID: client.orgID,
      first: parseInt(opts.limit, 10),
      input: { filters, searchText: '' },
    });

    const nodes = data.contactsPaginated?.edges?.map((e) => e.node) ?? [];

    if (opts.json) {
      printJSON(nodes);
      return;
    }

    printTable(
      ['ID', 'Name', 'Email', 'Account', 'Role', 'Created'],
      nodes.map((n) => [
        n.id.slice(0, 8),
        safe(n.name),
        safe(n.email),
        safe(n.account?.name),
        safe(n.role),
        safe(n.createdAt)?.slice(0, 10),
      ]),
      opts
    );
    console.log(chalk.grey(`\n${nodes.length} contact(s)`));
  });

  outputFlags(
    contacts.command('get <id>').description('Get contact details')
  ).action(async (id: string, opts: OutputOptions) => {
    const client = new PylonClient();

    // Use GetContactsPaginated with an ID filter or fetch contacts for the account
    // Pylon doesn't have a single-contact endpoint; we use GetContactsPaginated with a search
    const data = await client.query<{
      contactsPaginated?: {
        edges?: Array<{
          node: {
            id: string;
            name?: string;
            email?: string;
            phone?: string;
            account?: { id: string; name?: string };
            role?: string;
            createdAt?: string;
            updatedAt?: string;
          };
        }>;
      };
    }>('GetContactsPaginated', OPS.GetContactsPaginated, {
      orgID: client.orgID,
      first: 1,
      input: {
        filters: {
          anyOf: [],
          allOf: [
            {
              attribute: 'contact_id',
              operator: 'includes_any_of',
              objectType: 'contact',
              type: 'default_field',
              values: [id],
            },
          ],
        },
        searchText: '',
      },
    });

    const contact = data.contactsPaginated?.edges?.[0]?.node;
    if (!contact) {
      console.error(chalk.red('Contact not found'));
      process.exit(1);
    }

    if (opts.json) {
      printJSON(contact);
      return;
    }

    printKeyValue(
      {
        id: contact.id,
        name: safe(contact.name),
        email: safe(contact.email),
        phone: safe(contact.phone),
        account: safe(contact.account?.name),
        role: safe(contact.role),
        created: safe(contact.createdAt)?.slice(0, 10),
        updated: safe(contact.updatedAt)?.slice(0, 10),
      },
      opts
    );
  });

  return contacts;
}
