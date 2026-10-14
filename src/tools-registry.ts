import { AlsaniaMcp } from "./core/server.js";

interface ToolHandler {
  (args: Record<string, unknown>): Promise<unknown>;
}

interface ToolDefinition {
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface ToolRegistration {
  serverId: string;
  toolName: string;
  definition: ToolDefinition;
  handler: ToolHandler;
}

export class ToolsRegistry {
  private mcpnyxUrl: string;
  private mcpServer: AlsaniaMcp;
  private tools: ToolRegistration[] = [];

  constructor(mcpServer: AlsaniaMcp, mcpnyxUrl: string = 'http://localhost:3057') {
    this.mcpServer = mcpServer;
    this.mcpnyxUrl = mcpnyxUrl;
  }

  private async callToolViaMcpnyx(toolName: string, args: any): Promise<any> {
    try {
      const response = await fetch(`${this.mcpnyxUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: toolName, arguments: args },
          id: Date.now()
        })
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error.message);
      if (result.result?.content?.[0]?.type === 'text') {
        try { return JSON.parse(result.result.content[0].text); } catch { return result.result.content[0].text; }
      }
      return result.result;
    } catch (error: any) {
      console.error(`Error calling tool ${toolName}:`, error.message);
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  async registerAllTools(): Promise<void> {
    this.registerCommunicationTools();
    this.registerAgenticTools();
    this.registerUtilsTools();
    this.registerMonitoringTools();
    this.registerCoreTools();
    this.registerDesktopControlTools();

    for (const tool of this.tools) {
      this.mcpServer.registerTool(
        tool.serverId,
        tool.toolName,
        tool.definition,
        tool.handler,
      );
    }

    console.log(`✅ Registered ${this.tools.length} tools from tools-registry`);
  }

  private registerCommunicationTools(): void {
    const communicationTools: ToolRegistration[] = [
      {
        serverId: "communication",
        toolName: "slackPostMessage",
        definition: {
          description: "Post a message to a Slack channel",
          inputSchema: {
            type: "object",
            properties: {
              channel: {
                type: "string",
                description: "Slack channel ID or name",
              },
              text: { type: "string", description: "Message text to post" },
              threadTs: {
                type: "string",
                description: "Thread timestamp to reply to",
              },
            },
            required: ["channel", "text"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("slack/slack_post_message", args),
      },
      {
        serverId: "communication",
        toolName: "slackGetUsers",
        definition: {
          description: "Get list of users in Slack workspace",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of users to return",
              },
            },
          },
        },
        handler: async (args) => this.callToolViaMcpnyx("slack/slack_get_users", args),
      },
      {
        serverId: "communication",
        toolName: "slackGetUserProfile",
        definition: {
          description: "Get profile information for a Slack user",
          inputSchema: {
            type: "object",
            properties: {
              userId: { type: "string", description: "Slack user ID" },
            },
            required: ["userId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("slack/slack_get_user_profile", args),
      },
      {
        serverId: "communication",
        toolName: "slackListChannels",
        definition: {
          description: "List all channels in Slack workspace",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of channels",
              },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("slack/slack_list_channels", args),
      },
      {
        serverId: "communication",
        toolName: "slackGetChannelHistory",
        definition: {
          description: "Get message history from a Slack channel",
          inputSchema: {
            type: "object",
            properties: {
              channel: { type: "string", description: "Channel ID" },
              limit: {
                type: "number",
                description: "Number of messages to retrieve",
              },
              oldest: { type: "string", description: "Oldest timestamp" },
              latest: { type: "string", description: "Latest timestamp" },
            },
            required: ["channel"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("slack/slack_get_channel_history", args),
      },
      {
        serverId: "communication",
        toolName: "slackGetThreadReplies",
        definition: {
          description: "Get replies to a Slack thread",
          inputSchema: {
            type: "object",
            properties: {
              channel: { type: "string", description: "Channel ID" },
              threadTs: { type: "string", description: "Thread timestamp" },
            },
            required: ["channel", "threadTs"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("slack/slack_get_thread_replies", args),
      },
      {
        serverId: "communication",
        toolName: "slackReplyToThread",
        definition: {
          description: "Reply to a Slack thread",
          inputSchema: {
            type: "object",
            properties: {
              channel: { type: "string", description: "Channel ID" },
              threadTs: { type: "string", description: "Thread timestamp" },
              text: { type: "string", description: "Reply text" },
            },
            required: ["channel", "threadTs", "text"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("slack/slack_reply_to_thread", args),
      },
      {
        serverId: "communication",
        toolName: "slackAddReaction",
        definition: {
          description: "Add a reaction to a Slack message",
          inputSchema: {
            type: "object",
            properties: {
              channel: { type: "string", description: "Channel ID" },
              timestamp: { type: "string", description: "Message timestamp" },
              reaction: { type: "string", description: "Reaction emoji name" },
            },
            required: ["channel", "timestamp", "reaction"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("slack/slack_add_reaction", args),
      },
      {
        serverId: "communication",
        toolName: "sendMessage",
        definition: {
          description: "Send a message via the communication framework",
          inputSchema: {
            type: "object",
            properties: {
              to: { type: "string", description: "Recipient identifier" },
              message: { type: "string", description: "Message content" },
              priority: {
                type: "string",
                description: "Message priority (low/normal/high)",
              },
            },
            required: ["to", "message"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-framework/send-message", args),
      },
      {
        serverId: "communication",
        toolName: "sendBroadcast",
        definition: {
          description: "Send a broadcast message to multiple recipients",
          inputSchema: {
            type: "object",
            properties: {
              recipients: {
                type: "array",
                items: { type: "string" },
                description: "List of recipient IDs",
              },
              message: {
                type: "string",
                description: "Broadcast message content",
              },
            },
            required: ["recipients", "message"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("communication/send-broadcast", args),
      },
      {
        serverId: "communication",
        toolName: "checkForMessages",
        definition: {
          description: "Check for new messages in communication channels",
          inputSchema: {
            type: "object",
            properties: {
              channel: { type: "string", description: "Channel to check" },
              since: {
                type: "number",
                description: "Check messages since timestamp",
              },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("communication/check-for-messages", args),
      },
      {
        serverId: "communication",
        toolName: "a2aListAgents",
        definition: {
          description: "List all registered A2A agents",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        handler: async () => this.callToolViaMcpnyx("a2a/list_agents", {}),
      },
      {
        serverId: "communication",
        toolName: "a2aSendMessage",
        definition: {
          description: "Send a message to an A2A agent",
          inputSchema: {
            type: "object",
            properties: {
              agentUrl: { type: "string", description: "URL of the agent" },
              message: { type: "string", description: "Message to send" },
              sessionId: { type: "string", description: "Optional session ID" },
            },
            required: ["agentUrl", "message"],
          },
        },
        handler: async (args) => this.callToolViaMcpnyx("a2a/send_message", args),
      },
      {
        serverId: "communication",
        toolName: "a2aRegisterAgent",
        definition: {
          description: "Register an A2A agent with the bridge server",
          inputSchema: {
            type: "object",
            properties: {
              url: { type: "string", description: "Agent URL to register" },
            },
            required: ["url"],
          },
        },
        handler: async (args) => this.callToolViaMcpnyx("a2a/register_agent", args),
      },
      {
        serverId: "communication",
        toolName: "a2aUnregisterAgent",
        definition: {
          description: "Unregister an A2A agent from the bridge server",
          inputSchema: {
            type: "object",
            properties: {
              url: { type: "string", description: "Agent URL to unregister" },
            },
            required: ["url"],
          },
        },
        handler: async (args) => this.callToolViaMcpnyx("a2a/unregister_agent", args),
      },
    ];

    this.tools.push(...communicationTools);
  }

  private registerAgenticTools(): void {
    const agenticTools: ToolRegistration[] = [
      {
        serverId: "agentic",
        toolName: "createTask",
        definition: {
          description: "Create a new task in the agentic system",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Task title" },
              description: { type: "string", description: "Task description" },
              priority: {
                type: "string",
                description: "Task priority (low/medium/high/urgent)",
              },
              status: { type: "string", description: "Task status" },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Task tags",
              },
            },
            required: ["title"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/create_task", args),
      },
      {
        serverId: "agentic",
        toolName: "listTasks",
        definition: {
          description: "List all tasks in the agentic system",
          inputSchema: {
            type: "object",
            properties: {
              status: { type: "string", description: "Filter by status" },
              priority: { type: "string", description: "Filter by priority" },
              limit: { type: "number", description: "Maximum number of tasks" },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/list_tasks", args),
      },
      {
        serverId: "agentic",
        toolName: "getTask",
        definition: {
          description: "Get a specific task by ID",
          inputSchema: {
            type: "object",
            properties: {
              taskId: { type: "string", description: "Task ID to retrieve" },
            },
            required: ["taskId"],
          },
        },
        handler: async (args) => this.callToolViaMcpnyx("agentic-tools/get_task", args),
      },
      {
        serverId: "agentic",
        toolName: "updateTask",
        definition: {
          description: "Update an existing task",
          inputSchema: {
            type: "object",
            properties: {
              taskId: { type: "string", description: "Task ID to update" },
              title: { type: "string", description: "New title" },
              description: { type: "string", description: "New description" },
              status: { type: "string", description: "New status" },
              priority: { type: "string", description: "New priority" },
            },
            required: ["taskId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/update_task", args),
      },
      {
        serverId: "agentic",
        toolName: "deleteTask",
        definition: {
          description: "Delete a task",
          inputSchema: {
            type: "object",
            properties: {
              taskId: { type: "string", description: "Task ID to delete" },
            },
            required: ["taskId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/delete_task", args),
      },
      {
        serverId: "agentic",
        toolName: "createSubtask",
        definition: {
          description: "Create a subtask for a parent task",
          inputSchema: {
            type: "object",
            properties: {
              parentTaskId: { type: "string", description: "Parent task ID" },
              title: { type: "string", description: "Subtask title" },
              description: {
                type: "string",
                description: "Subtask description",
              },
            },
            required: ["parentTaskId", "title"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/create_subtask", args),
      },
      {
        serverId: "agentic",
        toolName: "listSubtasks",
        definition: {
          description: "List subtasks for a parent task",
          inputSchema: {
            type: "object",
            properties: {
              parentTaskId: { type: "string", description: "Parent task ID" },
            },
            required: ["parentTaskId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/list_subtasks", args),
      },
      {
        serverId: "agentic",
        toolName: "getSubtask",
        definition: {
          description: "Get a specific subtask",
          inputSchema: {
            type: "object",
            properties: {
              subtaskId: { type: "string", description: "Subtask ID" },
            },
            required: ["subtaskId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/get_subtask", args),
      },
      {
        serverId: "agentic",
        toolName: "updateSubtask",
        definition: {
          description: "Update a subtask",
          inputSchema: {
            type: "object",
            properties: {
              subtaskId: { type: "string", description: "Subtask ID" },
              title: { type: "string", description: "New title" },
              description: { type: "string", description: "New description" },
              status: { type: "string", description: "New status" },
            },
            required: ["subtaskId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/update_subtask", args),
      },
      {
        serverId: "agentic",
        toolName: "deleteSubtask",
        definition: {
          description: "Delete a subtask",
          inputSchema: {
            type: "object",
            properties: {
              subtaskId: {
                type: "string",
                description: "Subtask ID to delete",
              },
            },
            required: ["subtaskId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/delete_subtask", args),
      },
      {
        serverId: "agentic",
        toolName: "moveTask",
        definition: {
          description: "Move a task to a different status or position",
          inputSchema: {
            type: "object",
            properties: {
              taskId: { type: "string", description: "Task ID" },
              newStatus: { type: "string", description: "New status" },
              newPosition: {
                type: "number",
                description: "New position in list",
              },
            },
            required: ["taskId"],
          },
        },
        handler: async (args) => this.callToolViaMcpnyx("agentic-tools/move_task", args),
      },
      {
        serverId: "agentic",
        toolName: "migrateSubtasks",
        definition: {
          description: "Migrate subtasks between tasks",
          inputSchema: {
            type: "object",
            properties: {
              fromTaskId: { type: "string", description: "Source task ID" },
              toTaskId: { type: "string", description: "Destination task ID" },
              subtaskIds: {
                type: "array",
                items: { type: "string" },
                description: "Subtask IDs to migrate",
              },
            },
            required: ["fromTaskId", "toTaskId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/migrate_subtasks", args),
      },
      {
        serverId: "agentic",
        toolName: "createProject",
        definition: {
          description: "Create a new project",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Project name" },
              description: {
                type: "string",
                description: "Project description",
              },
            },
            required: ["name"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/create_project", args),
      },
      {
        serverId: "agentic",
        toolName: "listProjects",
        definition: {
          description: "List all projects",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of projects",
              },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/list_projects", args),
      },
      {
        serverId: "agentic",
        toolName: "getProject",
        definition: {
          description: "Get a specific project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/get_project", args),
      },
      {
        serverId: "agentic",
        toolName: "updateProject",
        definition: {
          description: "Update a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              name: { type: "string", description: "New name" },
              description: { type: "string", description: "New description" },
            },
            required: ["projectId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/update_project", args),
      },
      {
        serverId: "agentic",
        toolName: "deleteProject",
        definition: {
          description: "Delete a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: {
                type: "string",
                description: "Project ID to delete",
              },
            },
            required: ["projectId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/delete_project", args),
      },
      {
        serverId: "agentic",
        toolName: "createMemory",
        definition: {
          description: "Create a new memory entry",
          inputSchema: {
            type: "object",
            properties: {
              text: { type: "string", description: "Memory text content" },
              agentId: { type: "string", description: "Agent ID" },
              namespace: { type: "string", description: "Memory namespace" },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Memory tags",
              },
              visibility: {
                type: "string",
                description: "Visibility (private/shared/system)",
              },
            },
            required: ["text"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/create_memory", args),
      },
      {
        serverId: "agentic",
        toolName: "listMemories",
        definition: {
          description: "List memory entries",
          inputSchema: {
            type: "object",
            properties: {
              namespace: { type: "string", description: "Filter by namespace" },
              limit: {
                type: "number",
                description: "Maximum number of memories",
              },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/list_memories", args),
      },
      {
        serverId: "agentic",
        toolName: "searchMemories",
        definition: {
          description: "Search memories by query",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              namespace: { type: "string", description: "Filter by namespace" },
              limit: { type: "number", description: "Maximum results" },
            },
            required: ["query"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/search_memories", args),
      },
      {
        serverId: "agentic",
        toolName: "getMemory",
        definition: {
          description: "Get a specific memory by ID",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Memory ID" },
            },
            required: ["id"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/get_memory", args),
      },
      {
        serverId: "agentic",
        toolName: "updateMemory",
        definition: {
          description: "Update a memory entry",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Memory ID" },
              text: { type: "string", description: "Updated text" },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Updated tags",
              },
            },
            required: ["id"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/update_memory", args),
      },
      {
        serverId: "agentic",
        toolName: "deleteMemory",
        definition: {
          description: "Delete a memory entry",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "Memory ID to delete" },
            },
            required: ["id"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/delete_memory", args),
      },
      {
        serverId: "agentic",
        toolName: "listNodes",
        definition: {
          description: "List all nodes in the knowledge graph",
          inputSchema: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Maximum number of nodes" },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/list_nodes", args),
      },
      {
        serverId: "agentic",
        toolName: "searchNodes",
        definition: {
          description: "Search nodes in the knowledge graph",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
            },
            required: ["query"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/search_nodes", args),
      },
      {
        serverId: "agentic",
        toolName: "listTemplates",
        definition: {
          description: "List all node templates",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of templates",
              },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/list_templates", args),
      },
      {
        serverId: "agentic",
        toolName: "listNodeTemplates",
        definition: {
          description: "List node templates with metadata",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of templates",
              },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/list_node_templates", args),
      },
      {
        serverId: "agentic",
        toolName: "searchTemplates",
        definition: {
          description: "Search templates by name or description",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
            },
            required: ["query"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/search_templates", args),
      },
      {
        serverId: "agentic",
        toolName: "searchTemplatesByMetadata",
        definition: {
          description: "Search templates by metadata fields",
          inputSchema: {
            type: "object",
            properties: {
              metadata: { type: "object", description: "Metadata filter" },
            },
            required: ["metadata"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/search_templates_by_metadata", args),
      },
      {
        serverId: "agentic",
        toolName: "getTemplate",
        definition: {
          description: "Get a specific template by ID",
          inputSchema: {
            type: "object",
            properties: {
              templateId: { type: "string", description: "Template ID" },
            },
            required: ["templateId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/get_template", args),
      },
      {
        serverId: "agentic",
        toolName: "getTemplatesForTask",
        definition: {
          description: "Get templates relevant for a task",
          inputSchema: {
            type: "object",
            properties: {
              taskId: { type: "string", description: "Task ID" },
            },
            required: ["taskId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/get_templates_for_task", args),
      },
      {
        serverId: "agentic",
        toolName: "getNodeInfo",
        definition: {
          description: "Get information about a specific node",
          inputSchema: {
            type: "object",
            properties: {
              nodeId: { type: "string", description: "Node ID" },
            },
            required: ["nodeId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/get_node_info", args),
      },
      {
        serverId: "agentic",
        toolName: "getNodeEssentials",
        definition: {
          description: "Get essential information about a node",
          inputSchema: {
            type: "object",
            properties: {
              nodeId: { type: "string", description: "Node ID" },
            },
            required: ["nodeId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/get_node_essentials", args),
      },
      {
        serverId: "agentic",
        toolName: "getNodeAsToolInfo",
        definition: {
          description: "Get node formatted as tool information",
          inputSchema: {
            type: "object",
            properties: {
              nodeId: { type: "string", description: "Node ID" },
            },
            required: ["nodeId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/get_node_as_tool_info", args),
      },
      {
        serverId: "agentic",
        toolName: "getNodeDocumentation",
        definition: {
          description: "Get documentation for a node",
          inputSchema: {
            type: "object",
            properties: {
              nodeId: { type: "string", description: "Node ID" },
            },
            required: ["nodeId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/get_node_documentation", args),
      },
      {
        serverId: "agentic",
        toolName: "searchNodeProperties",
        definition: {
          description: "Search node properties",
          inputSchema: {
            type: "object",
            properties: {
              nodeId: { type: "string", description: "Node ID" },
              query: { type: "string", description: "Search query" },
            },
            required: ["nodeId", "query"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/search_node_properties", args),
      },
      {
        serverId: "agentic",
        toolName: "getPropertyDependencies",
        definition: {
          description: "Get property dependencies for a node",
          inputSchema: {
            type: "object",
            properties: {
              nodeId: { type: "string", description: "Node ID" },
              propertyName: { type: "string", description: "Property name" },
            },
            required: ["nodeId", "propertyName"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/get_property_dependencies", args),
      },
      {
        serverId: "agentic",
        toolName: "getNodeForTask",
        definition: {
          description: "Get a node suitable for a specific task",
          inputSchema: {
            type: "object",
            properties: {
              taskId: { type: "string", description: "Task ID" },
            },
            required: ["taskId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/get_node_for_task", args),
      },
      {
        serverId: "agentic",
        toolName: "getNextTaskRecommendation",
        definition: {
          description: "Get next recommended task",
          inputSchema: {
            type: "object",
            properties: {
              agentId: { type: "string", description: "Agent ID" },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/get_next_task_recommendation", args),
      },
      {
        serverId: "agentic",
        toolName: "inferTaskProgress",
        definition: {
          description: "Infer progress for a task",
          inputSchema: {
            type: "object",
            properties: {
              taskId: { type: "string", description: "Task ID" },
            },
            required: ["taskId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/infer_task_progress", args),
      },
      {
        serverId: "agentic",
        toolName: "listAiTools",
        definition: {
          description: "List available AI tools",
          inputSchema: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Maximum number of tools" },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/list_ai_tools", args),
      },
      {
        serverId: "agentic",
        toolName: "getDatabaseStatistics",
        definition: {
          description: "Get database statistics",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        handler: async () =>
          this.callToolViaMcpnyx("agentic-tools/get_database_statistics", {}),
      },
      {
        serverId: "agentic",
        toolName: "researchTask",
        definition: {
          description: "Research a task for more context",
          inputSchema: {
            type: "object",
            properties: {
              taskId: { type: "string", description: "Task ID" },
            },
            required: ["taskId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/research_task", args),
      },
      {
        serverId: "agentic",
        toolName: "generateResearchQueries",
        definition: {
          description: "Generate research queries for a task",
          inputSchema: {
            type: "object",
            properties: {
              taskId: { type: "string", description: "Task ID" },
            },
            required: ["taskId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/generate_research_queries", args),
      },
      {
        serverId: "agentic",
        toolName: "parsePrd",
        definition: {
          description: "Parse a product requirements document",
          inputSchema: {
            type: "object",
            properties: {
              content: { type: "string", description: "PRD content" },
            },
            required: ["content"],
          },
        },
        handler: async (args) => this.callToolViaMcpnyx("agentic-tools/parse_prd", args),
      },
      {
        serverId: "agentic",
        toolName: "validateWorkflow",
        definition: {
          description: "Validate a workflow definition",
          inputSchema: {
            type: "object",
            properties: {
              workflow: { type: "object", description: "Workflow definition" },
            },
            required: ["workflow"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/validate_workflow", args),
      },
      {
        serverId: "agentic",
        toolName: "validateWorkflowConnections",
        definition: {
          description: "Validate workflow connections",
          inputSchema: {
            type: "object",
            properties: {
              workflowId: { type: "string", description: "Workflow ID" },
            },
            required: ["workflowId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/validate_workflow_connections", args),
      },
      {
        serverId: "agentic",
        toolName: "validateWorkflowExpressions",
        definition: {
          description: "Validate workflow expressions",
          inputSchema: {
            type: "object",
            properties: {
              workflowId: { type: "string", description: "Workflow ID" },
            },
            required: ["workflowId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/validate_workflow_expressions", args),
      },
      {
        serverId: "agentic",
        toolName: "validateNodeOperation",
        definition: {
          description: "Validate a node operation",
          inputSchema: {
            type: "object",
            properties: {
              nodeId: { type: "string", description: "Node ID" },
              operation: { type: "string", description: "Operation type" },
            },
            required: ["nodeId", "operation"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/validate_node_operation", args),
      },
      {
        serverId: "agentic",
        toolName: "validateNodeMinimal",
        definition: {
          description: "Perform minimal validation on a node",
          inputSchema: {
            type: "object",
            properties: {
              nodeId: { type: "string", description: "Node ID" },
            },
            required: ["nodeId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/validate_node_minimal", args),
      },
      {
        serverId: "agentic",
        toolName: "toolsDocumentation",
        definition: {
          description: "Get tools documentation",
          inputSchema: {
            type: "object",
            properties: {
              toolName: { type: "string", description: "Tool name filter" },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/tools_documentation", args),
      },
      {
        serverId: "agentic",
        toolName: "registerAgent",
        definition: {
          description: "Register an agent with the agentic system",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Agent name" },
              capabilities: {
                type: "array",
                items: { type: "string" },
                description: "Agent capabilities",
              },
              metadata: { type: "object", description: "Agent metadata" },
            },
            required: ["name"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/register-agent", args),
      },
      {
        serverId: "agentic",
        toolName: "unregisterAgent",
        definition: {
          description: "Unregister an agent",
          inputSchema: {
            type: "object",
            properties: {
              agentId: { type: "string", description: "Agent ID" },
            },
            required: ["agentId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/unregister-agent", args),
      },
      {
        serverId: "agentic",
        toolName: "updateAgentStatus",
        definition: {
          description: "Update agent status",
          inputSchema: {
            type: "object",
            properties: {
              agentId: { type: "string", description: "Agent ID" },
              status: { type: "string", description: "New status" },
            },
            required: ["agentId", "status"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/update-agent-status", args),
      },
      {
        serverId: "agentic",
        toolName: "discoverAgents",
        definition: {
          description: "Discover available agents",
          inputSchema: {
            type: "object",
            properties: {
              capability: {
                type: "string",
                description: "Filter by capability",
              },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/discover-agents", args),
      },
      {
        serverId: "agentic",
        toolName: "toggleWrites",
        definition: {
          description: "Toggle write operations for the agentic system",
          inputSchema: {
            type: "object",
            properties: {
              enabled: {
                type: "boolean",
                description: "Enable or disable writes",
              },
            },
            required: ["enabled"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/toggle-writes", args),
      },
      {
        serverId: "agentic",
        toolName: "agentAiAssist",
        definition: {
          description: "Get AI assistance for agent operations",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: " Assistance query" },
              context: { type: "object", description: "Additional context" },
            },
            required: ["query"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("agentic-tools/agent-ai-assist", args),
      },
    ];

    this.tools.push(...agenticTools);
  }

  private registerUtilsTools(): void {
    const utilsTools: ToolRegistration[] = [
      {
        serverId: "utils",
        toolName: "echo",
        definition: {
          description: "Echo back the input message",
          inputSchema: {
            type: "object",
            properties: {
              message: { type: "string", description: "Message to echo" },
            },
            required: ["message"],
          },
        },
        handler: async (args) => this.callToolViaMcpnyx("mcp_everything/echo", args),
      },
      {
        serverId: "utils",
        toolName: "hash",
        definition: {
          description: "Hash data using BLAKE3",
          inputSchema: {
            type: "object",
            properties: {
              data: { type: "string", description: "Data to hash" },
            },
            required: ["data"],
          },
        },
        handler: async (args) => {
          const { hashData } = await import("./utils/hash.js");
          return { hash: hashData(args.data as string) };
        },
      },
      {
        serverId: "utils",
        toolName: "getEnv",
        definition: {
          description: "Get environment variables",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        handler: async () => this.callToolViaMcpnyx("mcp_everything/get-env", {}),
      },
      {
        serverId: "utils",
        toolName: "getSum",
        definition: {
          description: "Get the sum of two numbers",
          inputSchema: {
            type: "object",
            properties: {
              a: { type: "number", description: "First number" },
              b: { type: "number", description: "Second number" },
            },
            required: ["a", "b"],
          },
        },
        handler: async (args) => this.callToolViaMcpnyx("mcp_everything/get-sum", args),
      },
      {
        serverId: "utils",
        toolName: "getStructuredContent",
        definition: {
          description: "Get structured content for a location",
          inputSchema: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "Location (New York, Chicago, Los Angeles)",
              },
            },
            required: ["location"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("mcp_everything/get-structured-content", args),
      },
      {
        serverId: "utils",
        toolName: "getAnnotatedMessage",
        definition: {
          description: "Get annotated message with metadata",
          inputSchema: {
            type: "object",
            properties: {
              messageType: {
                type: "string",
                description: "Message type (error, success, debug)",
              },
              includeImage: {
                type: "boolean",
                description: "Include example image",
              },
            },
            required: ["messageType"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("mcp_everything/get-annotated-message", args),
      },
      {
        serverId: "utils",
        toolName: "getResourceLinks",
        definition: {
          description: "Get resource links",
          inputSchema: {
            type: "object",
            properties: {
              count: {
                type: "number",
                description: "Number of resource links (1-10)",
              },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("mcp_everything/get-resource-links", args),
      },
      {
        serverId: "utils",
        toolName: "getResourceReference",
        definition: {
          description: "Get a resource reference",
          inputSchema: {
            type: "object",
            properties: {
              resourceType: {
                type: "string",
                description: "Resource type (Text, Blob)",
              },
              resourceId: { type: "number", description: "Resource ID" },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("mcp_everything/get-resource-reference", args),
      },
      {
        serverId: "utils",
        toolName: "getTinyImage",
        definition: {
          description: "Get a tiny MCP logo image",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        handler: async () => this.callToolViaMcpnyx("mcp_everything/get-tiny-image", {}),
      },
      {
        serverId: "utils",
        toolName: "gzipFileAsResource",
        definition: {
          description: "Compress a file using gzip",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Output file name" },
              data: {
                type: "string",
                description: "URL or data URI to compress",
              },
              outputType: {
                type: "string",
                description: "Output type (resourceLink, resource)",
              },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("mcp_everything/gzip-file-as-resource", args),
      },
      {
        serverId: "utils",
        toolName: "toggleSimulatedLogging",
        definition: {
          description: "Toggle simulated logging on or off",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        handler: async () =>
          this.callToolViaMcpnyx("mcp_everything/toggle-simulated-logging", {}),
      },
      {
        serverId: "utils",
        toolName: "toggleSubscriberUpdates",
        definition: {
          description: "Toggle simulated subscriber updates",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        handler: async () =>
          this.callToolViaMcpnyx("mcp_everything/toggle-subscriber-updates", {}),
      },
      {
        serverId: "utils",
        toolName: "triggerLongRunningOperation",
        definition: {
          description: "Trigger a long running operation with progress",
          inputSchema: {
            type: "object",
            properties: {
              duration: { type: "number", description: "Duration in seconds" },
              steps: { type: "number", description: "Number of steps" },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("mcp_everything/trigger-long-running-operation", args),
      },
      {
        serverId: "utils",
        toolName: "takeSnapshot",
        definition: {
          description: "Take a snapshot of current state",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Snapshot name" },
              type: {
                type: "string",
                description: "Snapshot type (memory, graph, full)",
              },
            },
            required: ["name"],
          },
        },
        handler: async (args) => this.callToolViaMcpnyx("utils/take_snapshot", args),
      },
    ];

    this.tools.push(...utilsTools);
  }

  private registerMonitoringTools(): void {
    const monitoringTools: ToolRegistration[] = [
      {
        serverId: "monitoring",
        toolName: "performance",
        definition: {
          description: "Get performance metrics for the server",
          inputSchema: {
            type: "object",
            properties: {
              since: {
                type: "number",
                description: "Get metrics since timestamp",
              },
            },
          },
        },
        handler: async (_args) => {
          const { PerformanceMonitor } = await import(
            "./.deprecated/monitoring/performance.js"
          );
          const monitor = new PerformanceMonitor();
          return monitor.getCurrentMetrics();
        },
      },
      {
        serverId: "monitoring",
        toolName: "performanceStartTrace",
        definition: {
          description: "Start a performance trace",
          inputSchema: {
            type: "object",
            properties: {
              traceId: { type: "string", description: "Trace identifier" },
            },
            required: ["traceId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("monitoring/performance_start_trace", args),
      },
      {
        serverId: "monitoring",
        toolName: "performanceStopTrace",
        definition: {
          description: "Stop a performance trace",
          inputSchema: {
            type: "object",
            properties: {
              traceId: { type: "string", description: "Trace identifier" },
            },
            required: ["traceId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("monitoring/performance_stop_trace", args),
      },
      {
        serverId: "monitoring",
        toolName: "performanceAnalyzeInsight",
        definition: {
          description: "Analyze performance and provide insights",
          inputSchema: {
            type: "object",
            properties: {
              timeRange: {
                type: "number",
                description: "Time range in milliseconds",
              },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("monitoring/performance_analyze_insight", args),
      },
      {
        serverId: "monitoring",
        toolName: "status",
        definition: {
          description: "Get server status information",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        handler: async () => this.callToolViaMcpnyx("monitoring/status", {}),
      },
    ];

    this.tools.push(...monitoringTools);
  }

  private registerCoreTools(): void {
    const coreTools: ToolRegistration[] = [
      {
        serverId: "core",
        toolName: "listTools",
        definition: {
          description: "List all available tools in the MCP server",
          inputSchema: {
            type: "object",
            properties: {
              serverId: { type: "string", description: "Filter by server ID" },
              limit: { type: "number", description: "Maximum number of tools" },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("tools-universe/list_tools", args),
      },
      {
        serverId: "core",
        toolName: "grepTools",
        definition: {
          description: "Search tools by pattern",
          inputSchema: {
            type: "object",
            properties: {
              pattern: { type: "string", description: "Search pattern" },
              serverId: { type: "string", description: "Filter by server ID" },
            },
            required: ["pattern"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("tools-universe/grep_tools", args),
      },
      {
        serverId: "core",
        toolName: "findTools",
        definition: {
          description: "Find tools matching criteria",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              serverId: { type: "string", description: "Filter by server ID" },
            },
            required: ["query"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("tools-universe/find_tools", args),
      },
      {
        serverId: "core",
        toolName: "getToolInfo",
        definition: {
          description: "Get detailed information about a specific tool",
          inputSchema: {
            type: "object",
            properties: {
              toolName: { type: "string", description: "Tool name" },
              serverId: { type: "string", description: "Server ID" },
            },
            required: ["toolName"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("tools-universe/get_tool_info", args),
      },
      {
        serverId: "core",
        toolName: "executeTool",
        definition: {
          description: "Execute a tool by name",
          inputSchema: {
            type: "object",
            properties: {
              toolName: { type: "string", description: "Tool name to execute" },
              serverId: { type: "string", description: "Server ID" },
              args: { type: "object", description: "Tool arguments" },
            },
            required: ["toolName"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("tools-universe/execute_tool", args),
      },
    ];

    this.tools.push(...coreTools);
  }

  private registerDesktopControlTools(): void {
    const desktopTools: ToolRegistration[] = [
      {
        serverId: "desktop",
        toolName: "readFile",
        definition: {
          description: "Read contents from a file",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Absolute path to the file",
              },
              offset: { type: "number", description: "Start line offset" },
              length: {
                type: "number",
                description: "Number of lines to read",
              },
              isUrl: { type: "boolean", description: "Whether path is a URL" },
            },
            required: ["path"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/read_file", args),
      },
      {
        serverId: "desktop",
        toolName: "readMultipleFiles",
        definition: {
          description: "Read contents from multiple files",
          inputSchema: {
            type: "object",
            properties: {
              paths: {
                type: "array",
                items: { type: "string" },
                description: "Array of file paths",
              },
            },
            required: ["paths"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/read_multiple_files", args),
      },
      {
        serverId: "desktop",
        toolName: "writeFile",
        definition: {
          description: "Write content to a file",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Absolute path to the file",
              },
              content: { type: "string", description: "Content to write" },
              mode: {
                type: "string",
                description: "Write mode (overwrite, append)",
              },
            },
            required: ["path", "content"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/write_file", args),
      },
      {
        serverId: "desktop",
        toolName: "writePdf",
        definition: {
          description: "Create or modify a PDF file",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "Output path for PDF" },
              content: {
                type: "string",
                description: "Markdown content for PDF",
              },
              outputPath: {
                type: "string",
                description: "Output path for new PDF",
              },
            },
            required: ["path", "content"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/write_pdf", args),
      },
      {
        serverId: "desktop",
        toolName: "editBlock",
        definition: {
          description: "Apply surgical edits to files",
          inputSchema: {
            type: "object",
            properties: {
              file_path: { type: "string", description: "Path to the file" },
              old_string: { type: "string", description: "Text to replace" },
              new_string: { type: "string", description: "Replacement text" },
              expected_replacements: {
                type: "number",
                description: "Expected number of replacements",
              },
            },
            required: ["file_path", "old_string", "new_string"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/edit_block", args),
      },
      {
        serverId: "desktop",
        toolName: "createDirectory",
        definition: {
          description: "Create a new directory",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "Absolute path to create" },
            },
            required: ["path"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/create_directory", args),
      },
      {
        serverId: "desktop",
        toolName: "moveFile",
        definition: {
          description: "Move or rename a file",
          inputSchema: {
            type: "object",
            properties: {
              source: { type: "string", description: "Source file path" },
              destination: {
                type: "string",
                description: "Destination file path",
              },
            },
            required: ["source", "destination"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/move_file", args),
      },
      {
        serverId: "desktop",
        toolName: "listDirectory",
        definition: {
          description: "List files and directories",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "Directory path to list" },
              depth: {
                type: "number",
                description: "Depth for recursive listing",
              },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/list_directory", args),
      },
      {
        serverId: "desktop",
        toolName: "getFileInfo",
        definition: {
          description: "Get detailed metadata about a file",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "File path" },
            },
            required: ["path"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/get_file_info", args),
      },
      {
        serverId: "desktop",
        toolName: "startSearch",
        definition: {
          description: "Start a file or content search",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string", description: "Path to search in" },
              pattern: { type: "string", description: "Search pattern" },
              searchType: {
                type: "string",
                description: "Search type (files, content)",
              },
              filePattern: { type: "string", description: "File type filter" },
              ignoreCase: {
                type: "boolean",
                description: "Case insensitive search",
              },
              maxResults: { type: "number", description: "Maximum results" },
            },
            required: ["path", "pattern"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/start_search", args),
      },
      {
        serverId: "desktop",
        toolName: "getMoreSearchResults",
        definition: {
          description: "Get more results from an active search",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: { type: "string", description: "Search session ID" },
              offset: { type: "number", description: "Result offset" },
              length: { type: "number", description: "Number of results" },
            },
            required: ["sessionId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/get_more_search_results", args),
      },
      {
        serverId: "desktop",
        toolName: "stopSearch",
        definition: {
          description: "Stop an active search",
          inputSchema: {
            type: "object",
            properties: {
              sessionId: {
                type: "string",
                description: "Search session ID to stop",
              },
            },
            required: ["sessionId"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/stop_search", args),
      },
      {
        serverId: "desktop",
        toolName: "listSearches",
        definition: {
          description: "List all active searches",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        handler: async () =>
          this.callToolViaMcpnyx("desktop-commander/list_searches", {}),
      },
      {
        serverId: "desktop",
        toolName: "startProcess",
        definition: {
          description: "Start a new terminal process",
          inputSchema: {
            type: "object",
            properties: {
              command: { type: "string", description: "Command to execute" },
              timeoutMs: {
                type: "number",
                description: "Timeout in milliseconds",
              },
              shell: { type: "string", description: "Shell to use" },
            },
            required: ["command"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/start_process", args),
      },
      {
        serverId: "desktop",
        toolName: "interactWithProcess",
        definition: {
          description: "Send input to a running process",
          inputSchema: {
            type: "object",
            properties: {
              pid: { type: "number", description: "Process ID" },
              input: { type: "string", description: "Input to send" },
              timeoutMs: {
                type: "number",
                description: "Timeout in milliseconds",
              },
            },
            required: ["pid", "input"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/interact_with_process", args),
      },
      {
        serverId: "desktop",
        toolName: "readProcessOutput",
        definition: {
          description: "Read output from a running process",
          inputSchema: {
            type: "object",
            properties: {
              pid: { type: "number", description: "Process ID" },
              timeoutMs: {
                type: "number",
                description: "Timeout in milliseconds",
              },
              offset: { type: "number", description: "Output line offset" },
              length: { type: "number", description: "Number of lines" },
            },
            required: ["pid"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/read_process_output", args),
      },
      {
        serverId: "desktop",
        toolName: "listSessions",
        definition: {
          description: "List all active terminal sessions",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        handler: async () =>
          this.callToolViaMcpnyx("desktop-commander/list_sessions", {}),
      },
      {
        serverId: "desktop",
        toolName: "listProcesses",
        definition: {
          description: "List all running processes",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        handler: async () =>
          this.callToolViaMcpnyx("desktop-commander/list_processes", {}),
      },
      {
        serverId: "desktop",
        toolName: "killProcess",
        definition: {
          description: "Kill a running process",
          inputSchema: {
            type: "object",
            properties: {
              pid: { type: "number", description: "Process ID to kill" },
            },
            required: ["pid"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/kill_process", args),
      },
      {
        serverId: "desktop",
        toolName: "forceTerminate",
        definition: {
          description: "Force terminate a terminal session",
          inputSchema: {
            type: "object",
            properties: {
              pid: { type: "number", description: "Process ID to terminate" },
            },
            required: ["pid"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/force_terminate", args),
      },
      {
        serverId: "desktop",
        toolName: "getConfig",
        definition: {
          description: "Get server configuration",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        handler: async () => this.callToolViaMcpnyx("desktop-commander/get_config", {}),
      },
      {
        serverId: "desktop",
        toolName: "setConfigValue",
        definition: {
          description: "Set a configuration value",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Config key" },
              value: { type: "string", description: "Config value" },
              origin: { type: "string", description: "Origin (ui, llm)" },
            },
            required: ["key", "value"],
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/set_config_value", args),
      },
      {
        serverId: "desktop",
        toolName: "getUsageStats",
        definition: {
          description: "Get usage statistics",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        handler: async () =>
          this.callToolViaMcpnyx("desktop-commander/get_usage_stats", {}),
      },
      {
        serverId: "desktop",
        toolName: "getRecentToolCalls",
        definition: {
          description: "Get recent tool call history",
          inputSchema: {
            type: "object",
            properties: {
              maxResults: {
                type: "number",
                description: "Maximum number of results",
              },
              toolName: { type: "string", description: "Filter by tool name" },
              since: { type: "string", description: "Filter by timestamp" },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/get_recent_tool_calls", args),
      },
      {
        serverId: "desktop",
        toolName: "getPrompts",
        definition: {
          description: "Get onboarding prompts",
          inputSchema: {
            type: "object",
            properties: {
              action: { type: "string", description: "Action to perform" },
              promptId: { type: "string", description: "Prompt ID" },
            },
          },
        },
        handler: async (args) =>
          this.callToolViaMcpnyx("desktop-commander/get_prompts", args),
      },
      {
        serverId: "desktop",
        toolName: "giveFeedback",
        definition: {
          description: "Open feedback form",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        handler: async () =>
          this.callToolViaMcpnyx(
            "desktop-commander/give_feedback_to_desktop_commander",
            {},
          ),
      },
    ];

    this.tools.push(...desktopTools);
  }

  private async callToolViaMcpnyxViaExternal(
    endpoint: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const res = await fetch(`http://localhost:3000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      return await res.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        endpoint,
      };
    }
  }

  getRegisteredTools(): ToolRegistration[] {
    return this.tools;
  }

  getToolCount(): number {
    return this.tools.length;
  }

  getToolsByServerId(serverId: string): ToolRegistration[] {
    return this.tools.filter((t) => t.serverId === serverId);
  }
}

export function registerAllTools(mcpServer: AlsaniaMcp): ToolsRegistry {
  const registry = new ToolsRegistry(mcpServer);
  registry.registerAllTools();
  return registry;
}
