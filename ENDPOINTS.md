# AlsaniaMCP Endpoints Reference

## Transport Endpoints (MCP Compliance)

| Endpoint | Method | Description | MCP Spec |
|----------|--------|-------------|----------|
| `/mcp` | POST | Streamable HTTP transport | ✅ Required |
| `/sse` | GET | Server-Sent Events | ✅ Required |
| `/ws` | GET | WebSocket | ✅ Required |
| `/stdio` | - | STDIO (process) | ✅ Required |

## Core API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/tools` | GET | List all available tools |
| `/tools/:serverId/:toolName` | DELETE | Unregister a tool |
| `/resources` | GET | List all resources |
| `/resource` | POST | Read a resource |
| `/prompts` | GET | List all prompts |
| `/prompt` | POST | Get a prompt |
| `/servers` | GET | List all server IDs |
| `/servers/:serverId/tools` | GET | List tools for specific server |

## Tool Execution

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mcp` | POST | MCP JSON-RPC tool call |
| `/message` | POST | Direct tool call |
| `/tools/:serverId/:toolName` | POST | Direct tool call (alt) |

## Proxy/Remote Server Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/proxy/connect` | POST | Connect to remote MCP server |
| `/proxy/disconnect/:serverId` | POST | Disconnect from server |
| `/proxy/servers` | GET | List connected servers |
| `/proxy/status/:serverId` | GET | Get server status |

## Gateway/Routing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/gateway/:route` | * | Custom route forwarding |
| `/gateway/routes` | GET | List configured routes |

## A2A Communication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/a2a/register` | POST | Register A2A peer |
| `/a2a/message` | POST | Send message to peer |
| `/a2a/peers` | GET | List all peers |
| `/a2a/inbox` | GET | Get messages for this peer |
| `/a2a/status` | GET | Get A2A network status |

## Agent Framework

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/agents` | GET | List all agents |
| `/agents/register` | POST | Register new agent |
| `/agents/:agentId` | GET | Get agent details |
| `/agents/:agentId/status` | PUT | Update agent status |
| `/agents/sse` | GET | SSE for agent events |

## Conversation/Chat (GChat)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/conversations` | POST | Create conversation |
| `/conversations/:id` | GET | Get conversation |
| `/conversations/:id/messages` | GET | Get messages |
| `/conversations/:id/messages` | POST | Send message |

## User Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/user/register` | POST | Register user |
| `/user/agents` | GET | List AI agents for user |

## Spawner/Dynamic Servers

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/spawner/servers` | GET | List spawned servers |
| `/spawner/spawn` | POST | Spawn new server |
| `/spawner/:serverId/stop` | POST | Stop server |

## Settings/Configuration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/settings/chat-storage` | GET | Get storage settings |
| `/settings/chat-storage` | POST | Update storage settings |
| `/settings/chat-storage` | DELETE | Reset settings |

## Documentation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/openapi.json` | GET | OpenAPI 3.0 schema |
| `/mcp/schema.json` | GET | MCP protocol schema |

## Static Files

| Endpoint | Description |
|----------|-------------|
| `/` | Redirect to GUI |
| `/gui` | Web interface |
| `/gui/*` | GUI assets |

---

## MCP 2024-11-05 Protocol Compatibility

The following MCP methods are supported at `/mcp`:

- `initialize` - Server initialization
- `tools/list` - List available tools
- `tools/call` - Execute a tool
- `resources/list` - List resources
- `resources/read` - Read a resource
- `prompts/list` - List prompts
- `prompts/get` - Get a prompt

---

*Last Updated: 2026-03-23*
