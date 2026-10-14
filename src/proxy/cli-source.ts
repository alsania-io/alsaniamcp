/**
 * cli-source.ts — Turn any CLI tool into an MCP server source.
 *
 * Convenience layer over MCPProxyManager: instead of hand-writing a
 * MCPServerConfig per CLI, call `cliSourceConfig('gh')` and the proxy spawns
 * `any-cli-mcp-server gh`, which auto-generates MCP tools from the CLI's
 * --help output.
 *
 * Design: adopted from any-cli-mcp-server (MIT, Eirik Brandtzæg) as ONE
 * plugin into AlsaniaMCP's existing MCPProxyManager — not a separate system.
 *
 * @see https://github.com/eirikb/any-cli-mcp-server
 */

import type { MCPServerConfig } from '../types/index.js';

/** The npm package that wraps a CLI as an MCP server. */
export const ANY_CLI_PACKAGE = 'any-cli-mcp-server';

/** How to launch the wrapper (npx by default; overridable for tests/offline). */
export interface CliSourceOptions {
  /** Override the launcher command (default: 'npx'). */
  launcher?: string;
  /** Extra args passed to the CLI itself (after the CLI name). */
  cliArgs?: string[];
  /** Lifespan in ms before the proxy auto-cleans the connection. */
  lifespan?: number;
  /** Bypass npx download — point at a prebuilt cache file instead. */
  cacheFile?: string;
  /** Restrict which proxied tools are exposed. */
  allowedTools?: string[];
  /** Roles allowed to use this CLI source. */
  roles?: string[];
}

/**
 * Build an MCPServerConfig that exposes a CLI as MCP tools.
 *
 *   cliSourceConfig('gh')   → proxies `gh`
 *   cliSourceConfig('git')  → proxies `git`
 *   cliSourceConfig('wrangler', { cacheFile: 'wrangler_cache.json' })
 */
export function cliSourceConfig(cliName: string, opts: CliSourceOptions = {}): MCPServerConfig {
  const normalized = String(cliName).trim();
  if (!normalized) {
    throw new Error('cliSourceConfig: cliName is required');
  }
  if (/[;|&$`\n]/.test(normalized)) {
    throw new Error(`cliSourceConfig: invalid characters in cliName: ${cliName}`);
  }

  const launcher = opts.launcher ?? 'npx';
  const launcherArgs = opts.launcher === undefined ? ['-y'] : [];

  // With a cache file, the wrapper takes the file path and no CLI name.
  const wrapperArgs = opts.cacheFile
    ? [opts.cacheFile, ...(opts.cliArgs ?? [])]
    : [normalized, ...(opts.cliArgs ?? [])];

  return {
    id: `cli-${normalized}`,
    name: `CLI: ${normalized}`,
    transport: 'stdio',
    command: launcher,
    args: [...launcherArgs, ANY_CLI_PACKAGE, ...wrapperArgs],
    lifespan: opts.lifespan,
    roles: opts.roles,
    allowedTools: opts.allowedTools,
    isOpen: false,
  } as MCPServerConfig;
}

/**
 * Build configs for several CLIs at once.
 */
export function cliSources(...cliNames: string[]): MCPServerConfig[] {
  return cliNames.map((n) => cliSourceConfig(n));
}