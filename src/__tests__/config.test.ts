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

const TEST_CONFIG = {
  session: 'test-session-value',
  pylonCsrf: 'test-csrf-header.test-csrf-hash',
  orgID: 'org-123',
};

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
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(TEST_CONFIG) as unknown as ReturnType<typeof readFileSync>);
      expect(ConfigManager.read()).toEqual(TEST_CONFIG);
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
      ConfigManager.write(TEST_CONFIG);
      expect(mockMkdirSync).toHaveBeenCalledWith(EXPECTED_CONFIG_DIR, { recursive: true, mode: 0o700 });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        EXPECTED_CONFIG_FILE,
        JSON.stringify(TEST_CONFIG, null, 2),
        { mode: 0o600 }
      );
    });

    it('skips mkdir when dir already exists', () => {
      mockExistsSync.mockReturnValue(true);
      ConfigManager.write(TEST_CONFIG);
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
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(TEST_CONFIG) as unknown as ReturnType<typeof readFileSync>);
      expect(ConfigManager.require()).toEqual(TEST_CONFIG);
    });

    it('exits with code 1 when no config', () => {
      mockExistsSync.mockReturnValue(false);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(
        ((_code?: number | string | null) => { throw new Error('process.exit called'); }) as typeof process.exit
      );
      expect(() => ConfigManager.require()).toThrow('process.exit called');
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });
  });

  describe('csrfHeader()', () => {
    it('extracts the part before the dot from pylonCsrf', () => {
      expect(ConfigManager.csrfHeader(TEST_CONFIG)).toBe('test-csrf-header');
    });

    it('returns the whole value if there is no dot', () => {
      expect(ConfigManager.csrfHeader({ ...TEST_CONFIG, pylonCsrf: 'nodothere' })).toBe('nodothere');
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
  });
});
