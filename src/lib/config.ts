import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';

export interface PylonConfig {
  /** pylon_session cookie value */
  session: string;
  /** pylon_csrf cookie value (full: "<csrfHeader>.<hash>") */
  pylonCsrf: string;
  /** orgID — auto-discovered or manually provided */
  orgID: string;
}

const CONFIG_DIR = join(homedir(), '.pylon');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export class ConfigManager {
  static read(): PylonConfig | null {
    if (!existsSync(CONFIG_FILE)) return null;
    try {
      const raw = readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(raw) as PylonConfig;
    } catch {
      return null;
    }
  }

  static write(config: PylonConfig): void {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
  }

  static clear(): void {
    if (existsSync(CONFIG_FILE)) {
      unlinkSync(CONFIG_FILE);
    }
  }

  static require(): PylonConfig {
    const config = this.read();
    if (!config) {
      console.error('Not authenticated. Run: pylon auth --session <token> --csrf <token>');
      process.exit(1);
    }
    return config;
  }

  /** The x-csrf-token header value is the part before the "." in pylon_csrf */
  static csrfHeader(config: PylonConfig): string {
    return config.pylonCsrf.split('.')[0] ?? config.pylonCsrf;
  }

  static mask(token: string): string {
    if (token.length <= 8) return '****';
    return token.slice(0, 4) + '****' + token.slice(-4);
  }
}
