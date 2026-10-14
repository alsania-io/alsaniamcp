/**
 * AlsaniaMCP Server with Audit Integration
 * Extends the base server with Scribe audit logging
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ToolRegistry } from '../types/index.js';
import { AuditLogger, createAuditLogger, defaultAuditConfig } from '../lib/scribe-audit-logger.js';
import { getLogger } from '../lib/getLogger.js';

interface ResourceRegistry {
  [serverId: string]: {
    [resourceUri: string]: {
      name: string;
      description?: string;
      mimeType?: string;
      handler: Function;
      lastUsed: number;
    };
  };
}

interface PromptRegistry {
  [serverId: string]: {
    [promptName: string]: {
      description?: string;
      arguments?: any[];
      handler: Function;
      lastUsed: number;
    };
  };
}

export interface AlsaniaMcpConfig {
  /** Enable audit logging */
  auditEnabled?: boolean;
  /** Audit log root directory */
  auditLogRoot?: string;
  /** Owner name for audit logs */
  auditOwner?: string;
  /** Model name for audit logs */
  auditModel?: string;
  /** MCP URL for audit logs */
  auditMcpUrl?: string;
  /** Log level */
  logLevel?: string;
  /** Output transport */
  outputTransport?: string;
}

export class AlsaniaMcpAudit {
  private server: Server;
  private toolRegistry: ToolRegistry = {};
  private resourceRegistry: ResourceRegistry = {};
  private promptRegistry: PromptRegistry = {};
  private activeServers: Map<string, any> = new Map();
  private auditLogger: AuditLogger | null = null;
  private config: AlsaniaMcpConfig;

  constructor(config: AlsaniaMcpConfig = {}) {
    this.config = {
      auditEnabled: config.auditEnabled ?? process.env.AUDIT_LOGGING_ENABLED === 'true',
      auditLogRoot: config.auditLogRoot || process.env.AUDIT_LOG_ROOT || './logs/alsaniamcp',
      auditOwner: config.auditOwner || process.env.AUDIT_OWNER || 'Unknown',
      auditModel: config.auditModel || process.env.AUDIT_MODEL || 'echo-cloud',
      auditMcpUrl: config.auditMcpUrl || process.env.AUDIT_MCP_URL || 'http://localhost:8050/mcp',
      logLevel: config.logLevel || process.env.LOG_LEVEL || 'info',
      outputTransport: config.outputTransport || process.env.OUTPUT_TRANSPORT || 'console',
    };

    this.server = new Server(
      {
        name: 'AlsaniaMCP',
        version: '1.0.5',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // Initialize audit logger
    if (this.config.auditEnabled) {
      const logger = getLogger({
        logLevel: this.config.logLevel || 'info',
        outputTransport: this.config.outputTransport || 'console',
      });

      this.auditLogger = createAuditLogger(
        {
          enabled: true,
          logRoot: this.config.auditLogRoot,
          owner: this.config.auditOwner,
          model: this.config.auditModel,
          mcpUrl: this.config.auditMcpUrl,
        },
        logger
      );

      console.log(`📝 Audit logging enabled: ${this.auditLogger.getSessionId()}`);
    }

    this.setupHandlers();
  }

  private setupHandlers() {
    const self = this;

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [];

      for (const [serverId, serverTools] of Object.entries(this.toolRegistry)) {
        for (const [toolName, toolData] of Object.entries(serverTools)) {
          tools.push({
            name: `${serverId}/${toolName}`,
            description: toolData.schema.description || `Tool from ${serverId}`,
            inputSchema: toolData.schema.inputSchema || {
              type: 'object',
              properties: {},
            },
          });
        }
      }

      // Audit: List tools
      if (this.auditLogger) {
        this.auditLogger.event('list_tools', { count: tools.length });
      }

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const [serverId, toolName] = request.params.name.split('/');

      if (!this.toolRegistry[serverId]?.[toolName]) {
        const error = `Tool ${request.params.name} not found`;
        if (this.auditLogger) {
          this.auditLogger.error(error, undefined, { serverId, toolName, args: request.params.arguments });
        }
        throw new Error(error);
      }

      const tool = this.toolRegistry[serverId][toolName];
      tool.lastUsed = Date.now();

      // Audit: Tool call
      if (this.auditLogger) {
        this.auditLogger.toolCall(toolName, request.params.arguments);
      }

      try {
        const result = await tool.handler(request.params.arguments);

        // Audit: Tool result
        if (this.auditLogger) {
          this.auditLogger.response(JSON.stringify(result, null, 2), {
            tool: toolName,
            server: serverId,
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (this.auditLogger) {
          this.auditLogger.error(
            `Tool execution failed: ${toolName}`,
            error instanceof Error ? error.stack : String(error),
            { serverId, toolName, args: request.params.arguments }
          );
        }
        throw error;
      }
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources: any[] = [];

      for (const [serverId, serverResources] of Object.entries(this.resourceRegistry)) {
        for (const [resourceUri, resourceData] of Object.entries(serverResources)) {
          resources.push({
            uri: `${serverId}://${resourceUri}`,
            name: resourceData.name,
            description: resourceData.description,
            mimeType: resourceData.mimeType,
          });
        }
      }

      if (this.auditLogger) {
        this.auditLogger.event('list_resources', { count: resources.length });
      }

      return { resources };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const [serverId, ...resourceParts] = uri.split('://');
      const resourceUri = resourceParts.join('://');

      if (!this.resourceRegistry[serverId]?.[resourceUri]) {
        const error = `Resource ${uri} not found`;
        if (this.auditLogger) {
          this.auditLogger.error(error, undefined, { uri });
        }
        throw new Error(error);
      }

      const resource = this.resourceRegistry[serverId][resourceUri];
      resource.lastUsed = Date.now();

      if (this.auditLogger) {
        this.auditLogger.event('read_resource', { uri, serverId });
      }

      const content = await resource.handler();

      return {
        contents: [
          {
            uri,
            mimeType: resource.mimeType || 'text/plain',
            text: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
          },
        ],
      };
    });

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts: any[] = [];

      for (const [serverId, serverPrompts] of Object.entries(this.promptRegistry)) {
        for (const [promptName, promptData] of Object.entries(serverPrompts)) {
          prompts.push({
            name: `${serverId}/${promptName}`,
            description: promptData.description,
            arguments: promptData.arguments || [],
          });
        }
      }

      if (this.auditLogger) {
        this.auditLogger.event('list_prompts', { count: prompts.length });
      }

      return { prompts };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const [serverId, promptName] = request.params.name.split('/');

      if (!this.promptRegistry[serverId]?.[promptName]) {
        const error = `Prompt ${request.params.name} not found`;
        if (this.auditLogger) {
          this.auditLogger.error(error, undefined, { serverId, promptName, args: request.params.arguments });
        }
        throw new Error(error);
      }

      const prompt = this.promptRegistry[serverId][promptName];
      prompt.lastUsed = Date.now();

      if (this.auditLogger) {
        this.auditLogger.event('get_prompt', { serverId, promptName });
      }

      const result = await prompt.handler(request.params.arguments);

      return {
        description: prompt.description,
        messages: Array.isArray(result) ? result : [
          {
            role: 'user',
            content: {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          },
        ],
      };
    });
  }

  // Public methods

  registerTool(serverId: string, toolName: string, schema: any, handler: Function) {
    if (!this.toolRegistry[serverId]) {
      this.toolRegistry[serverId] = {};
    }

    this.toolRegistry[serverId][toolName] = {
      schema,
      handler,
      lastUsed: Date.now(),
    };

    if (this.auditLogger) {
      this.auditLogger.event('register_tool', { serverId, toolName });
    }
  }

  unregisterTool(serverId: string, toolName: string) {
    if (this.toolRegistry[serverId]?.[toolName]) {
      delete this.toolRegistry[serverId][toolName];
      if (this.auditLogger) {
        this.auditLogger.event('unregister_tool', { serverId, toolName });
      }
    }
  }

  registerResource(
    serverId: string,
    resourceUri: string,
    name: string,
    handler: Function,
    description?: string,
    mimeType?: string
  ) {
    if (!this.resourceRegistry[serverId]) {
      this.resourceRegistry[serverId] = {};
    }

    this.resourceRegistry[serverId][resourceUri] = {
      name,
      description,
      mimeType,
      handler,
      lastUsed: Date.now(),
    };

    if (this.auditLogger) {
      this.auditLogger.event('register_resource', { serverId, resourceUri });
    }
  }

  unregisterResource(serverId: string, resourceUri: string) {
    if (this.resourceRegistry[serverId]?.[resourceUri]) {
      delete this.resourceRegistry[serverId][resourceUri];
      if (this.auditLogger) {
        this.auditLogger.event('unregister_resource', { serverId, resourceUri });
      }
    }
  }

  registerPrompt(
    serverId: string,
    promptName: string,
    handler: Function,
    description?: string,
    args?: any[]
  ) {
    if (!this.promptRegistry[serverId]) {
      this.promptRegistry[serverId] = {};
    }

    this.promptRegistry[serverId][promptName] = {
      description,
      arguments: args,
      handler,
      lastUsed: Date.now(),
    };

    if (this.auditLogger) {
      this.auditLogger.event('register_prompt', { serverId, promptName });
    }
  }

  unregisterPrompt(serverId: string, promptName: string) {
    if (this.promptRegistry[serverId]?.[promptName]) {
      delete this.promptRegistry[serverId][promptName];
      if (this.auditLogger) {
        this.auditLogger.event('unregister_prompt', { serverId, promptName });
      }
    }
  }

  cleanupUnusedTools(maxAge: number = 300000) {
    const now = Date.now();
    let count = 0;

    for (const [serverId, serverTools] of Object.entries(this.toolRegistry)) {
      for (const [toolName, toolData] of Object.entries(serverTools)) {
        if (now - toolData.lastUsed > maxAge) {
          this.unregisterTool(serverId, toolName);
          count++;
        }
      }
    }

    for (const [serverId, serverResources] of Object.entries(this.resourceRegistry)) {
      for (const [resourceUri, resourceData] of Object.entries(serverResources)) {
        if (now - resourceData.lastUsed > maxAge) {
          this.unregisterResource(serverId, resourceUri);
          count++;
        }
      }
    }

    for (const [serverId, serverPrompts] of Object.entries(this.promptRegistry)) {
      for (const [promptName, promptData] of Object.entries(serverPrompts)) {
        if (now - promptData.lastUsed > maxAge) {
          this.unregisterPrompt(serverId, promptName);
          count++;
        }
      }
    }

    if (this.auditLogger && count > 0) {
      this.auditLogger.event('cleanup_unused', { count });
    }
  }

  async callTool(serverId: string, toolName: string, args: any): Promise<any> {
    const fullName = `${serverId}/${toolName}`;

    if (!this.toolRegistry[serverId]?.[toolName]) {
      throw new Error(`Tool ${fullName} not found`);
    }

    const tool = this.toolRegistry[serverId][toolName];
    tool.lastUsed = Date.now();

    if (this.auditLogger) {
      this.auditLogger.toolCall(toolName, args);
    }

    return await tool.handler(args);
  }

  async readResource(serverId: string, resourceUri: string): Promise<any> {
    if (!this.resourceRegistry[serverId]?.[resourceUri]) {
      throw new Error(`Resource ${serverId}://${resourceUri} not found`);
    }

    const resource = this.resourceRegistry[serverId][resourceUri];
    resource.lastUsed = Date.now();

    if (this.auditLogger) {
      this.auditLogger.event('read_resource', { serverId, resourceUri });
    }

    return await resource.handler();
  }

  async getPrompt(serverId: string, promptName: string, args?: any): Promise<any> {
    if (!this.promptRegistry[serverId]?.[promptName]) {
      throw new Error(`Prompt ${serverId}/${promptName} not found`);
    }

    const prompt = this.promptRegistry[serverId][promptName];
    prompt.lastUsed = Date.now();

    if (this.auditLogger) {
      this.auditLogger.event('get_prompt', { serverId, promptName });
    }

    return await prompt.handler(args);
  }

  listResources(): Array<{ serverId: string; resourceUri: string; name: string; description?: string; mimeType?: string }> {
    const resources: Array<any> = [];

    for (const [serverId, serverResources] of Object.entries(this.resourceRegistry)) {
      for (const [resourceUri, resourceData] of Object.entries(serverResources)) {
        resources.push({
          serverId,
          resourceUri,
          name: resourceData.name,
          description: resourceData.description,
          mimeType: resourceData.mimeType,
        });
      }
    }
    return resources;
  }

  listPrompts(): Array<{ serverId: string; promptName: string; description?: string; arguments?: any[] }> {
    const prompts: Array<any> = [];

    for (const [serverId, serverPrompts] of Object.entries(this.promptRegistry)) {
      for (const [promptName, promptData] of Object.entries(serverPrompts)) {
        prompts.push({
          serverId,
          promptName,
          description: promptData.description,
          arguments: promptData.arguments,
        });
      }
    }
    return prompts;
  }

  async start() {
    console.log('✅ AlsaniaMcpAudit initialized with tools:', this.listTools().length);
    if (this.auditLogger) {
      console.log(`📝 Audit log: ${this.auditLogger.getLatestLog() || 'No logs yet'}`);
    }
  }

  getServer() {
    return this.server;
  }

  listTools(): { serverId: string; toolName: string; schema: any }[] {
    const tools: { serverId: string; toolName: string; schema: any }[] = [];
    for (const [serverId, serverTools] of Object.entries(this.toolRegistry)) {
      for (const [toolName, toolData] of Object.entries(serverTools)) {
        tools.push({
          serverId,
          toolName,
          schema: toolData.schema,
        });
      }
    }
    return tools;
  }

  /**
   * Get the audit logger instance
   */
  getAuditLogger(): AuditLogger | null {
    return this.auditLogger;
  }

  /**
   * Get the latest audit log file path
   */
  getLatestLog(): string | null {
    return this.auditLogger?.getLatestLog() || null;
  }

  /**
   * Anchor the latest audit log
   */
  anchorLog(): { file: string; hash: string } | null {
    return this.auditLogger?.anchorLatest() || null;
  }
}
