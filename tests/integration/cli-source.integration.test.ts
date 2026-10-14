/**
 * cli-source integration test — the real end-to-end proof.
 *
 * Spawns `any-cli-mcp-server git` as a live MCP stdio server via
 * MCPProxyManager and asserts the proxy registers tools from it.
 *
 * This is the one test that proves the whole chain works:
 *   cliSourceConfig('git') -> proxy.connectToServer -> spawn -> tools/list
 *
 * Requires: npx + any-cli-mcp-server reachable (network or npx cache).
 * Timeout is generous (60s) because npx may download on first run.
 */

import { AlsaniaMcp } from '../../src/core/server';
import { MCPProxyManager } from '../../src/proxy/mcp-proxy';
import { cliSourceConfig } from '../../src/proxy/cli-source';

jest.setTimeout(90000);

describe('cli-source integration — real CLI as MCP', () => {
  let server: AlsaniaMcp;
  let proxy: MCPProxyManager;

  beforeEach(() => {
    server = new AlsaniaMcp();
    proxy = new MCPProxyManager(server);
  });

  test('cliSourceConfig("git") produces a spawnable stdio config', () => {
    const cfg = cliSourceConfig('git');
    expect(cfg.transport).toBe('stdio');
    expect(cfg.command).toBe('npx');
    expect(cfg.args).toEqual(['-y', 'any-cli-mcp-server', 'git']);
  });

  test('proxy connects to the git CLI and registers tools', async () => {
    const cfg = cliSourceConfig('git');
    const id = await proxy.connectToServer(cfg);
    expect(id).toBe('cli-git');

    const tools = server.listTools();
    // any-cli derives tools from `git --help`; there should be at least one.
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);

    await proxy.cleanup?.();
  }, 90000);
});