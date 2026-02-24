import Table from 'cli-table3';
import chalk from 'chalk';
import type { OutputOptions } from '../types/index.js';

export function printJSON(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printTable(
  headers: string[],
  rows: string[][],
  opts: OutputOptions
): void {
  if (opts.json) {
    const objects = rows.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? '';
      });
      return obj;
    });
    printJSON(objects);
    return;
  }

  if (opts.csv) {
    const escape = (v: string) =>
      v.includes(',') || v.includes('"') || v.includes('\n')
        ? `"${v.replace(/"/g, '""')}"`
        : v;
    console.log(headers.map(escape).join(','));
    for (const row of rows) {
      console.log(row.map(escape).join(','));
    }
    return;
  }

  const table = new Table({
    head: headers.map((h) => chalk.cyan(h)),
    style: { border: ['grey'], head: [] },
    wordWrap: false,
  });
  for (const row of rows) {
    table.push(row);
  }
  console.log(table.toString());
}

export function printKeyValue(data: Record<string, unknown>, opts: OutputOptions): void {
  if (opts.json) {
    printJSON(data);
    return;
  }
  for (const [k, v] of Object.entries(data)) {
    const val = v === null || v === undefined ? '' : String(v);
    console.log(`${chalk.cyan(k.padEnd(20))} ${val}`);
  }
}

export function safe(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
