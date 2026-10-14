import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { spawn, ChildProcess } from 'child_process';
import { MCPServerConfig, ServerInstance } from '../types/index.js';
import { AlsaniaMcp } from '../core/server.js';
import { Acl, PermBits, Principal } from '../auth/acl.js';
import { ToolDiscoveryIndex } from '../discovery/tool-index.js';
import { Tracer } from '../observability/tracer.js';

export class MCPProxyManager {
  private instances: Map<string, ServerInstance> = new Map();
  private mcpServer: AlsaniaMcp;
  /** Optional object-level ACL. Enforcement is opt-in (skipped if no entries). */
  public acl?: Acl;
  /** Live tool discovery index — populated as tools register (jarvis port). */
  public readonly discovery = new ToolDiscoveryIndex();
  /** Span tracer — one span per proxied tool call (jarvis OTel concept port). */
  public readonly tracer = new Tracer();

  constructor(mcpServer: AlsaniaMcp) {
    this.mcpServer = mcpServer;
  }

  async connectToServer(config: MCPServerConfig): Promise<string> {
    const instance: ServerInstance = {
      id: config.id,
      config,
      status: 'spawning',
      createdAt: Date.now(),
      expiresAt: config.lifespan ? Date.now() + config.lifespan : undefined,
    };

    try {
      if (config.transport === 'stdio' && config.command) {
        await this.connectStdio(instance);
      } else if (config.transport === 'http' && config.endpoint) {
        await this.connectHTTP(instance);
      } else {
        throw new Error(`Unsupported transport: ${config.transport}`);
      }

      this.instances.set(config.id, instance);

      await this.syncTools(config.id);

      instance.status = 'active';
      return config.id;
    } catch (error: any) {
      instance.status = 'error';
      throw new Error(`Failed to connect to ${config.id}: ${error.message}`);
    }
  }

  private async connectStdio(instance: ServerInstance): Promise<void> {
    const { command, args = [] } = instance.config;

    if (!command) {
      throw new Error('STDIO transport requires a command');
    }

    const transport = new StdioClientTransport({
      command,
      args,
    });

    const client = new Client(
      {
        name: 'AlsaniaMCP-Proxy',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
    instance.client = client;
    instance.transport = transport;
  }

  private async connectHTTP(instance: ServerInstance): Promise<void> {
    const { endpoint } = instance.config;

    if (!endpoint) {
      throw new Error('HTTP transport requires an endpoint');
    }

    const transport = new StreamableHTTPClientTransport(new URL(endpoint));

    const client = new Client(
      {
        name: 'AlsaniaMCP-Proxy',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
    instance.client = client;
    instance.transport = transport;
  }

  private async syncTools(serverId: string): Promise<void> {
    const instance = this.instances.get(serverId);
    if (!instance?.client) {
      throw new Error(`Server ${serverId} not connected`);
    }

    const { tools } = await instance.client.listTools();

    for (const tool of tools || []) {
      // Index for natural-language discovery (jarvis concept port).
      this.discovery.add(serverId, tool.name, tool.description ?? '');
      this.mcpServer.registerTool(
        serverId,
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema,
        },
        async (args: any) => {
          return await this.callRemoteTool(serverId, tool.name, args);
        }
      );
    }

    try {
      const { resources } = await instance.client.listResources();

      for (const resource of resources || []) {
        this.mcpServer.registerResource(
          serverId,
          resource.uri,
          resource.name,
          async () => {
            return await this.readRemoteResource(serverId, resource.uri);
          },
          resource.description,
          resource.mimeType
        );
      }
    } catch { }

    try {
      const { prompts } = await instance.client.listPrompts();

      for (const prompt of prompts || []) {
        this.mcpServer.registerPrompt(
          serverId,
          prompt.name,
          async (args: any) => {
            return await this.getRemotePrompt(serverId, prompt.name, args);
          },
          prompt.description,
          prompt.arguments
        );
      }
    } catch { }
  }

  /**
   * Public entry to call a proxied tool AS a given principal, enforcing ACL.
   * Callers with an authenticated identity should prefer this over the
   * registered handler path (which defaults to the `public` principal).
   */
  async callToolAs(
    serverId: string,
    toolName: string,
    args: any,
    principal: Principal,
  ): Promise<any> {
    return this.callRemoteTool(serverId, toolName, args, principal);
  }

  private async callRemoteTool(
    serverId: string,
    toolName: string,
    args: any,
    principal: Principal = { type: 'public' },
  ): Promise<any> {
    const instance = this.instances.get(serverId);
    if (!instance?.client) {
      throw new Error(`Server ${serverId} not connected`);
    }

    // Object-level ACL (opt-in): enforce CALL only when entries exist for
    // either the server or the specific tool. Preserves open behavior otherwise.
    if (this.acl) {
      const serverRes = { type: 'mcpServer' as const, id: serverId };
      const toolRes = { type: 'tool' as const, id: `${serverId}/${toolName}` };
      const hasEntries =
        this.acl.listResourcePermissions(serverRes).length > 0 ||
        this.acl.listResourcePermissions(toolRes).length > 0;
      if (hasEntries && !this.acl.checkPermission(principal, toolRes, PermBits.CALL)) {
        throw new Error(`Forbidden: ${principal.type}${principal.id ? ':' + principal.id : ''} lacks CALL on ${serverId}/${toolName}`);
      }
    }

    const result = await this.tracer.withSpan(
      `mcp.callTool ${serverId}/${toolName}`,
      {
        serverId,
        toolName,
        principal: `${principal.type}${principal.id ? ':' + principal.id : ''}`,
      },
      () =>
        instance.client!.callTool({
          name: toolName,
          arguments: args,
        }),
    );

    return result;
  }

  private async readRemoteResource(serverId: string, uri: string): Promise<any> {
    const instance = this.instances.get(serverId);
    if (!instance?.client) {
      throw new Error(`Server ${serverId} not connected`);
    }

    const result = await instance.client.readResource({ uri });

    return result;
  }

  private async getRemotePrompt(serverId: string, promptName: string, args: any): Promise<any> {
    const instance = this.instances.get(serverId);
    if (!instance?.client) {
      throw new Error(`Server ${serverId} not connected`);
    }

    const result = await instance.client.getPrompt({
      name: promptName,
      arguments: args,
    });

    return result;
  }

  async disconnectServer(serverId: string): Promise<void> {
    const instance = this.instances.get(serverId);
    if (!instance) {
      return;
    }

    try {
      if (instance.client) {
        await instance.client.close();
      }
    } catch (error) {
      console.error(`Error closing client for ${serverId}:`, error);
    }

    try {
      if (instance.transport && typeof instance.transport.close === 'function') {
        await instance.transport.close();
      }
    } catch (error) {
      console.error(`Error closing transport for ${serverId}:`, error);
    }

    if (instance.process) {
      try {
        instance.process.kill();
      } catch (error) {
        console.error(`Error killing process for ${serverId}:`, error);
      }
    }

    const tools = this.mcpServer.listTools().filter(t => t.serverId === serverId);
    for (const tool of tools) {
      this.mcpServer.unregisterTool(serverId, tool.toolName);
    }

    const resources = this.mcpServer.listResources().filter(r => r.serverId === serverId);
    for (const resource of resources) {
      this.mcpServer.unregisterResource(serverId, resource.resourceUri);
    }

    const prompts = this.mcpServer.listPrompts().filter(p => p.serverId === serverId);
    for (const prompt of prompts) {
      this.mcpServer.unregisterPrompt(serverId, prompt.promptName);
    }

    this.instances.delete(serverId);
  }

  async cleanupExpired(): Promise<void> {
    const now = Date.now();
    for (const [serverId, instance] of this.instances.entries()) {
      if (instance.expiresAt && now > instance.expiresAt) {
        await this.disconnectServer(serverId);
      }
    }
  }

  getActiveServers(): ServerInstance[] {
    return Array.from(this.instances.values());
  }

  getServerStatus(serverId: string): ServerInstance | undefined {
    return this.instances.get(serverId);
  }
}
