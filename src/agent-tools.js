/**
 * MCP Tool Integration for Agent Framework
 * Exposes all agent framework capabilities as MCP tools
 */

import AgentFramework from './agent-framework.js';

class AgentToolsIntegration {
    constructor(mcpServer) {
        this.mcpServer = mcpServer;
        this.agentFramework = new AgentFramework();
        this.setupTools();
    }

    setupTools() {
        // Agent Registration & Discovery
        this.mcpServer.registerTool(
            'agent',
            'register',
            {
                description: 'Register an AI agent in the communication network',
                inputSchema: {
                    type: 'object',
                    properties: {
                        agentId: {
                            type: 'string',
                            description: 'Unique identifier for the agent'
                        },
                        agentName: {
                            type: 'string',
                            description: 'Human-readable name for the agent'
                        },
                        capabilities: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'List of agent capabilities'
                        },
                        endpoint: {
                            type: 'string',
                            description: "Agent's communication endpoint (optional)"
                        },
                        metadata: {
                            type: 'object',
                            description: 'Additional agent metadata'
                        }
                    },
                    required: ['agentId', 'agentName', 'capabilities']
                }
            },
            async (args) => {
                return await this.agentFramework.registerAgent(args);
            }
        );

        this.mcpServer.registerTool(
            'agent',
            'discover',
            {
                description: 'Discover available agents in the network',
                inputSchema: {
                    type: 'object',
                    properties: {
                        capabilityFilter: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Filter agents by capabilities'
                        },
                        statusFilter: {
                            type: 'string',
                            description: 'Filter by agent status',
                            enum: ['online', 'offline', 'all'],
                            default: 'all'
                        }
                    }
                }
            },
            async (args) => {
                return await this.agentFramework.discoverAgents(args);
            }
        );

        // Message Routing
        this.mcpServer.registerTool(
            'agent',
            'send_message',
            {
                description: 'Send a message to another agent',
                inputSchema: {
                    type: 'object',
                    properties: {
                        targetAgentId: {
                            type: 'string',
                            description: 'ID of the target agent'
                        },
                        messageType: {
                            type: 'string',
                            description: 'Type of message',
                            enum: ['request', 'response', 'notification', 'task'],
                            default: 'request'
                        },
                        content: {
                            type: 'object',
                            description: 'Message content'
                        },
                        priority: {
                            type: 'string',
                            description: 'Message priority',
                            enum: ['low', 'normal', 'high', 'urgent'],
                            default: 'normal'
                        },
                        timeout: {
                            type: 'integer',
                            description: 'Response timeout in seconds',
                            default: 30
                        }
                    },
                    required: ['targetAgentId', 'content']
                }
            },
            async (args) => {
                return await this.agentFramework.sendMessage(args);
            }
        );

        this.mcpServer.registerTool(
            'agent',
            'broadcast',
            {
                description: 'Broadcast a message to multiple agents',
                inputSchema: {
                    type: 'object',
                    properties: {
                        targetCapabilities: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Target agents with these capabilities'
                        },
                        targetAgents: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Specific agent IDs to target'
                        },
                        messageType: {
                            type: 'string',
                            description: 'Type of message',
                            enum: ['announcement', 'task', 'query'],
                            default: 'announcement'
                        },
                        content: {
                            type: 'object',
                            description: 'Message content'
                        },
                        requireResponse: {
                            type: 'boolean',
                            description: 'Whether responses are required',
                            default: false
                        }
                    },
                    required: ['content']
                }
            },
            async (args) => {
                return await this.agentFramework.broadcastMessage(args);
            }
        );

        this.mcpServer.registerTool(
            'agent',
            'get_messages',
            {
                description: 'Retrieve messages for an agent',
                inputSchema: {
                    type: 'object',
                    properties: {
                        agentId: {
                            type: 'string',
                            description: 'Agent ID to get messages for'
                        },
                        messageType: {
                            type: 'string',
                            description: 'Filter by message type'
                        },
                        unreadOnly: {
                            type: 'boolean',
                            description: 'Only return unread messages',
                            default: true
                        },
                        limit: {
                            type: 'integer',
                            description: 'Maximum number of messages',
                            default: 50
                        }
                    },
                    required: ['agentId']
                }
            },
            async (args) => {
                return await this.agentFramework.getMessages(args.agentId, args);
            }
        );

        // Task Management
        this.mcpServer.registerTool(
            'agent',
            'create_task',
            {
                description: 'Create a collaborative task for multiple agents',
                inputSchema: {
                    type: 'object',
                    properties: {
                        taskName: {
                            type: 'string',
                            description: 'Name of the task'
                        },
                        taskDescription: {
                            type: 'string',
                            description: 'Detailed task description'
                        },
                        requiredCapabilities: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Required agent capabilities'
                        },
                        maxAgents: {
                            type: 'integer',
                            description: 'Maximum number of agents for task',
                            default: 5
                        },
                        deadline: {
                            type: 'string',
                            description: 'Task deadline (ISO format)'
                        },
                        taskData: {
                            type: 'object',
                            description: 'Task-specific data'
                        }
                    },
                    required: ['taskName', 'taskDescription', 'requiredCapabilities']
                }
            },
            async (args) => {
                return await this.agentFramework.createTask(args);
            }
        );

        this.mcpServer.registerTool(
            'agent',
            'join_task',
            {
                description: 'Join a collaborative task',
                inputSchema: {
                    type: 'object',
                    properties: {
                        taskId: {
                            type: 'string',
                            description: 'Task ID to join'
                        },
                        agentId: {
                            type: 'string',
                            description: 'Agent ID joining the task'
                        },
                        offeredCapabilities: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Capabilities offered for the task'
                        }
                    },
                    required: ['taskId', 'agentId', 'offeredCapabilities']
                }
            },
            async (args) => {
                return await this.agentFramework.joinTask(args);
            }
        );

        // Network Status
        this.mcpServer.registerTool(
            'agent',
            'get_status',
            {
                description: 'Get the status and health of the agent network',
                inputSchema: {
                    type: 'object',
                    properties: {
                        includeMetrics: {
                            type: 'boolean',
                            description: 'Include performance metrics',
                            default: true
                        }
                    }
                }
            },
            async (args) => {
                return await this.agentFramework.getNetworkStatus(args.includeMetrics);
            }
        );

        // Protocol Negotiation
        this.mcpServer.registerTool(
            'agent',
            'negotiate_protocol',
            {
                description: 'Negotiate communication protocols between agents',
                inputSchema: {
                    type: 'object',
                    properties: {
                        agentA: {
                            type: 'string',
                            description: 'First agent ID'
                        },
                        agentB: {
                            type: 'string',
                            description: 'Second agent ID'
                        },
                        supportedProtocols: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Supported communication protocols'
                        },
                        encryptionRequired: {
                            type: 'boolean',
                            description: 'Whether encryption is required',
                            default: true
                        }
                    },
                    required: ['agentA', 'agentB', 'supportedProtocols']
                }
            },
            async (args) => {
                return await this.agentFramework.negotiateProtocol(args);
            }
        );

        // Agent Management
        this.mcpServer.registerTool(
            'agent',
            'unregister',
            {
                description: 'Unregister an agent from the network',
                inputSchema: {
                    type: 'object',
                    properties: {
                        agentId: {
                            type: 'string',
                            description: 'Agent ID to unregister'
                        }
                    },
                    required: ['agentId']
                }
            },
            async (args) => {
                const success = await this.agentFramework.unregisterAgent(args.agentId);
                return { success, agentId: args.agentId };
            }
        );

        this.mcpServer.registerTool(
            'agent',
            'update_status',
            {
                description: 'Update an agent\'s status',
                inputSchema: {
                    type: 'object',
                    properties: {
                        agentId: {
                            type: 'string',
                            description: 'Agent ID'
                        },
                        status: {
                            type: 'string',
                            description: 'New status',
                            enum: ['online', 'offline', 'busy', 'idle']
                        }
                    },
                    required: ['agentId', 'status']
                }
            },
            async (args) => {
                const agent = this.agentFramework.agentRegistry.get(args.agentId);
                if (agent) {
                    agent.status = args.status;
                    agent.lastSeen = new Date().toISOString();
                    return { success: true, agentId: args.agentId, status: args.status };
                }
                return { success: false, error: 'Agent not found' };
            }
        );

        // List all agents
        this.mcpServer.registerTool(
            'agent',
            'list',
            {
                description: 'List all registered agents',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            async () => {
                const agents = Array.from(this.agentFramework.agentRegistry.values()).map(agent => ({
                    agentId: agent.agentId,
                    agentName: agent.agentName,
                    status: agent.status,
                    capabilities: agent.capabilities,
                    lastSeen: agent.lastSeen,
                    messageCount: agent.messageCount
                }));
                return { agents, count: agents.length };
            }
        );

        console.log('🤖 Agent Framework tools registered successfully');
    }

    // SSE Endpoint for real-time agent communication
    setupSSEEndpoint(app) {
        app.get('/agent/sse', (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Cache-Control', 'no-cache');

            const sendEvent = (data) => {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            };

            // Send initial connection event
            sendEvent({ 
                type: 'connected', 
                timestamp: new Date().toISOString(),
                agentCount: this.agentFramework.agentRegistry.size
            });

            // Listen for agent framework events
            const eventHandler = (eventData) => {
                sendEvent(eventData);
            };

            this.agentFramework.on('agentRegistered', eventHandler);
            this.agentFramework.on('agentUnregistered', eventHandler);
            this.agentFramework.on('heartbeat', eventHandler);

            // Cleanup on connection close
            req.on('close', () => {
                this.agentFramework.removeListener('agentRegistered', eventHandler);
                this.agentFramework.removeListener('agentUnregistered', eventHandler);
                this.agentFramework.removeListener('heartbeat', eventHandler);
            });
        });

        console.log('🔗 Agent SSE endpoint registered: /agent/sse');
    }

    // Get the agent framework instance for external access
    getAgentFramework() {
        return this.agentFramework;
    }
}

export { AgentToolsIntegration };