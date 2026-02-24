import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

vi.mock('os', () => ({
  homedir: vi.fn(() => '/mock/home'),
}));

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { ConfigManager } from '../lib/config.js';

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockUnlinkSync = vi.mocked(unlinkSync);

const EXPECTED_CONFIG_FILE = '/mock/home/.pylon/config.json';
const EXPECTED_CONFIG_DIR = '/mock/home/.pylon';

describe('ConfigManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('read()', () => {
    it('returns null when no config file exists', () => {
      mockExistsSync.mockReturnValue(false);
      expect(ConfigManager.read()).toBeNull();
      expect(mockExistsSync).toHaveBeenCalledWith(EXPECTED_CONFIG_FILE);
    });

    it('returns parsed config when file exists', () => {
      const config = { csrfToken: 'token123', orgID: 'org456' };
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(config) as unknown as ReturnType<typeof readFileSync>);
      expect(ConfigManager.read()).toEqual(config);
    });

    it('returns null when file is invalid JSON', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('not-json' as unknown as ReturnType<typeof readFileSync>);
      expect(ConfigManager.read()).toBeNull();
    });
  });

  describe('write()', () => {
    it('creates config dir and writes file with correct JSON', () => {
      mockExistsSync.mockReturnValue(false);
      const config = { csrfToken: 'mytoken', orgID: 'myorg' };
      ConfigManager.write(config);
      expect(mockMkdirSync).toHaveBeenCalledWith(EXPECTED_CONFIG_DIR, {
        recursive: true,
        mode: 0o700,
      });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        EXPECTED_CONFIG_FILE,
        JSON.stringify(config, null, 2),
        { mode: 0o600 }
      );
    });

    it('skips mkdir when dir already exists', () => {
      mockExistsSync.mockReturnValue(true);
      ConfigManager.write({ csrfToken: 'tok', orgID: 'org' });
      expect(mockMkdirSync).not.toHaveBeenCalled();
      expect(mockWriteFileSync).toHaveBeenCalled();
    });
  });

  describe('clear()', () => {
    it('removes the config file when it exists', () => {
      mockExistsSync.mockReturnValue(true);
      ConfigManager.clear();
      expect(mockUnlinkSync).toHaveBeenCalledWith(EXPECTED_CONFIG_FILE);
    });

    it('does nothing when file does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      ConfigManager.clear();
      expect(mockUnlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('require()', () => {
    it('returns config when present', () => {
      const config = { csrfToken: 'tok', orgID: 'org' };
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(config) as unknown as ReturnType<typeof readFileSync>);
      expect(ConfigManager.require()).toEqual(config);
    });

    it('exits with code 1 when no config', () => {
      mockExistsSync.mockReturnValue(false);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(
        ((_code?: number | string | null) => {
          throw new Error('process.exit called');
        }) as typeof process.exit
      );
      expect(() => ConfigManager.require()).toThrow('process.exit called');
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });
  });

  describe('mask()', () => {
    it('masks middle of token keeping first 4 and last 4 chars', () => {
      expect(ConfigManager.mask('abcdefghijklmnop')).toBe('abcd****mnop');
    });

    it('returns **** for short tokens (8 chars or fewer)', () => {
      expect(ConfigManager.mask('12345678')).toBe('****');
      expect(ConfigManager.mask('abc')).toBe('****');
    });

    it('masks a 9-char token correctly', () => {
      expect(ConfigManager.mask('123456789')).toBe('1234****6789');
    });
  });
});
