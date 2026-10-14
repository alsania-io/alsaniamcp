import {
  cliSourceConfig,
  cliSources,
  ANY_CLI_PACKAGE,
} from '../../../src/proxy/cli-source';

describe('cli-source — CLI to MCP source config', () => {
  describe('cliSourceConfig', () => {
    test('builds a stdio config for a CLI', () => {
      const cfg = cliSourceConfig('gh');
      expect(cfg.id).toBe('cli-gh');
      expect(cfg.transport).toBe('stdio');
      expect(cfg.command).toBe('npx');
      expect(cfg.args).toEqual(['-y', ANY_CLI_PACKAGE, 'gh']);
    });

    test('uses the CLI name in id and label', () => {
      const cfg = cliSourceConfig('git');
      expect(cfg.id).toBe('cli-git');
      expect(cfg.name).toContain('git');
    });

    test('passes extra cliArgs through', () => {
      const cfg = cliSourceConfig('gh', { cliArgs: ['--version'] });
      expect(cfg.args).toEqual(['-y', ANY_CLI_PACKAGE, 'gh', '--version']);
    });

    test('cacheFile mode replaces the CLI name', () => {
      const cfg = cliSourceConfig('wrangler', { cacheFile: 'wrangler_cache.json' });
      expect(cfg.args).toEqual(['-y', ANY_CLI_PACKAGE, 'wrangler_cache.json']);
    });

    test('custom launcher disables the npx -y flag', () => {
      const cfg = cliSourceConfig('gh', { launcher: 'node' });
      expect(cfg.command).toBe('node');
      expect(cfg.args).toEqual([ANY_CLI_PACKAGE, 'gh']);
    });

    test('carries lifespan, roles, allowedTools', () => {
      const cfg = cliSourceConfig('gh', {
        lifespan: 60000,
        roles: ['aegis'],
        allowedTools: ['cli-gh__pr_list'],
      });
      expect(cfg.lifespan).toBe(60000);
      expect(cfg.roles).toEqual(['aegis']);
      expect(cfg.allowedTools).toEqual(['cli-gh__pr_list']);
    });

    test('throws on empty cliName', () => {
      expect(() => cliSourceConfig('')).toThrow();
      expect(() => cliSourceConfig('   ')).toThrow();
    });

    test('rejects shell metacharacters (injection guard)', () => {
      for (const bad of ['gh; rm -rf /', 'gh && x', 'gh|cat', 'gh$(x)', 'gh`x`']) {
        expect(() => cliSourceConfig(bad)).toThrow();
      }
    });
  });

  describe('cliSources', () => {
    test('builds multiple configs', () => {
      const cfgs = cliSources('gh', 'git', 'docker');
      expect(cfgs).toHaveLength(3);
      expect(cfgs.map((c) => c.id)).toEqual(['cli-gh', 'cli-git', 'cli-docker']);
    });
  });
});