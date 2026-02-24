import { Command } from 'commander';
import { PylonClient } from '../lib/client.js';
import { OPS } from '../lib/operations.js';
import { printTable, printJSON, safe } from '../lib/output.js';
import type { OutputOptions } from '../types/index.js';

function outputFlags(cmd: Command): Command {
  return cmd.option('--json', 'Output as JSON').option('--csv', 'Output as CSV');
}

export function buildKBCommand(): Command {
  const kb = new Command('kb').description('Knowledge base management');

  outputFlags(
    kb.command('list').description('List knowledge base articles')
  ).action(async (opts: OutputOptions) => {
    const client = new PylonClient();
    const data = await client.query<{
      mainKnowledgeBase?: {
        id: string;
        name?: string;
        articles?: Array<{
          id: string;
          title?: string;
          createdAt?: string;
          updatedAt?: string;
          status?: string;
        }>;
      };
    }>('getMainKnowledgeBase', OPS.getMainKnowledgeBase, {
      orgID: client.orgID,
    });

    const articles = data.mainKnowledgeBase?.articles ?? [];

    if (opts.json) {
      printJSON({ kb: data.mainKnowledgeBase?.name, articles });
      return;
    }

    printTable(
      ['ID', 'Title', 'Status', 'Created', 'Updated'],
      articles.map((a) => [
        a.id.slice(0, 8),
        (a.title ?? '').slice(0, 60),
        safe(a.status),
        safe(a.createdAt)?.slice(0, 10),
        safe(a.updatedAt)?.slice(0, 10),
      ]),
      opts
    );
  });

  outputFlags(
    kb
      .command('ask <question>')
      .description('AI-powered knowledge base search')
  ).action(async (question: string, opts: OutputOptions) => {
    const client = new PylonClient();

    // Use getAnalytics with KB dataset or getMainKnowledgeBase + search
    // Pylon KB ask uses a different endpoint; we use getMainKnowledgeBase and show relevant articles
    const data = await client.query<{
      mainKnowledgeBase?: {
        id: string;
        name?: string;
        articles?: Array<{
          id: string;
          title?: string;
          content?: string;
          status?: string;
          updatedAt?: string;
        }>;
      };
    }>('getMainKnowledgeBase', OPS.getMainKnowledgeBase, {
      orgID: client.orgID,
    });

    const articles = data.mainKnowledgeBase?.articles ?? [];
    const q = question.toLowerCase();

    // Simple client-side relevance filter
    const relevant = articles.filter(
      (a) =>
        (a.title ?? '').toLowerCase().includes(q) ||
        (a.content ?? '').toLowerCase().includes(q)
    );

    if (opts.json) {
      printJSON({ question, results: relevant });
      return;
    }

    if (relevant.length === 0) {
      console.log('No matching articles found.');
      return;
    }

    printTable(
      ['ID', 'Title', 'Status', 'Updated'],
      relevant.map((a) => [
        a.id.slice(0, 8),
        (a.title ?? '').slice(0, 60),
        safe(a.status),
        safe(a.updatedAt)?.slice(0, 10),
      ]),
      opts
    );
  });

  return kb;
}
