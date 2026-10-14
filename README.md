# AlsaniaMCP 🌐

> Universal Model Context Protocol (MCP) server with dynamic proxy, multi-transport support, and AI-to-AI communication capabilities

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP_SDK-latest-green.svg)](https://modelcontextprotocol.io)

## ✨ Features

- 🔄 **Universal MCP Proxy** - Acts as a 2-way gateway between AI systems and MCP servers
- 🌍 **Multi-Transport Support** - STDIO, HTTP/SSE, and Streamable HTTP transports
- 🎯 **Dynamic Tool Registry** - On-demand loading/unloading of tools from multiple servers
- 🔌 **HTTP Gateway** - RESTful API with Server-Sent Events for streaming
- 🔐 **Secure** - JWT authentication and BLAKE3 hashing
- 🐳 **Container Ready** - Easy deployment with Docker or Podman
- 📦 **NPX Support** - Install and run with `npx @alsania-io/mcp`

## 🚀 Quick Start

### Using NPX (Easiest)

```bash
npx -y @alsania-io/mcp start
```

### Using Containers (Docker or Podman)

```bash
# With Docker
# Pull and run
docker run -p 8050:8050 alsania-io/mcp:latest

# Or with docker-compose
docker-compose up

# With Podman
# Pull and run
podman run -p 8050:8050 alsania-io/mcp:latest

# Or with podman-compose
podman-compose up
```

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build
npm run build

# Start production server
npm start
```

## 📡 Transport Layer

AlsaniaMCP supports three transport mechanisms:

### 1. STDIO Transport (Local MCP Servers)
Connect to local MCP servers via stdin/stdout:
```bash
# Server automatically uses STDIO for local communication
```

### 2. HTTP/SSE Gateway (Remote Clients)
Expose tools to remote clients via HTTP REST API:
- **Base URL**: `http://localhost:8050`
- **SSE Stream**: `http://localhost:8050/sse`
- **Streamable HTTP**: `http://localhost:8050/mcp`
- **Health Check**: `http://localhost:8050/health`

### 3. HTTP Proxy Transport (Remote MCP Servers)
Connect to remote MCP servers using Streamable HTTP:
```bash
POST /proxy/connect
{
  "id": "remote-server",
  "transport": "http",
  "endpoint": "http://remote-mcp-server.com/mcp"
}
```

## 🛠️ API Endpoints

**Base URL**: `http://localhost:8050`

### Core Endpoints
- `GET /health` - ✅ Health check
- `GET /stream` - SSE streaming endpoint for notifications
- `GET /tools` - ✅ List all available tools
- `GET /openapi.json` - OpenAPI specification

### A2A Communication Endpoints
- `GET /a2a/peers` - ✅ List all connected AI peers
- `POST /a2a/register` - ✅ Register a new AI peer
- `POST /a2a/message` - ✅ Send message to AI peer
- `GET /a2a/inbox` - ✅ Get message inbox
- `GET /a2a/status` - ✅ Get A2A system status

### Tool Execution (via Gateway)
- `POST /gateway` - Execute tools through gateway
- `POST /mcp` - Direct MCP protocol endpoint

### Available A2A Tools (Registered)
- `a2a/list_peers` - List connected AI peers
- `a2a/connect_peer` - Connect to MCP servers
- `a2a/send_message` - Send messages between AIs
- `a2a/execute_remote_tool` - Execute tools on remote servers
- `a2a/spawn_remote_server` - Spawn servers on remote peers
- `core/echo` - Echo test tool

## 📋 Usage Examples

### Connect to Remote MCP Server
```bash
curl -X POST http://localhost:8050/proxy/connect \
  -H "Content-Type: application/json" \
  -d '{
    "id": "mcpnyx",
    "transport": "http",
    "endpoint": "http://localhost:3055/mcp"
  }'
```

### Call a Tool
```bash
curl -X POST http://localhost:8050/message \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "core",
    "toolName": "echo",
    "args": {"message": "Hello AlsaniaMCP!"}
  }'
```

### List All Tools
```bash
curl http://localhost:8050/tools
```

### Stream Notifications (SSE)
```bash
curl -N http://localhost:8050/sse
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│          AlsaniaMCP Server              │
│  ┌──────────────────────────────────┐   │
│  │   UniversalMCPServer             │   │
│  │   - Tool Registry                │   │
│  │   - Resource Registry            │   │
│  │   - Prompt Registry              │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │   MCPProxyManager                │   │
│  │   - STDIO Transport              │   │
│  │   - HTTP Transport               │   │
│  │   - Dynamic Loading              │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │   HTTPGateway                    │   │
│  │   - REST API                     │   │
│  │   - SSE Streaming                │   │
│  │   - Proxy Endpoints              │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## 🔧 Configuration

### Environment Variables
- `PORT` - HTTP gateway port (default: 8050)
- `SESSION_SECRET` - JWT secret for authentication
- `NODE_ENV` - Environment (development/production)

### Server Configuration Example
```typescript
const config: MCPServerConfig = {
  id: 'my-server',
  transport: 'http',
  endpoint: 'http://localhost:3000/mcp',
  lifespan: 3600000, // 1 hour
  permissions: {
    tools: ['read', 'write'],
    resources: ['read']
  }
};
```

## 🔒 Security

- **JWT Authentication** - Secure session management
- **BLAKE3 Hashing** - Fast and secure cryptographic hashing
- **Environment Secrets** - API keys stored in environment variables
- **Input Validation** - Zod schema validation for all inputs

## 📦 CLI Commands

AlsaniaMCP provides a comprehensive command-line interface for managing all server operations, communication, voice features, and tool execution.

### Server Management

```bash
# Start the server
alsaniamcp server start [-p <port>] [-d] [-v] [-c <config>]

# Stop the server
alsaniamcp server stop [-p <port>] [-f]

# Check server status
alsaniamcp server status [-p <port>] [-d]

# View server logs
alsaniamcp server logs [-f] [-n <lines>]

# Aliases: amcp server start, alsaniamcp/amcp
```

### Voice Control

```bash
# Check voice API support
alsaniamcp voice check

# Show voice configuration
alsaniamcp voice config
```

### AI-to-AI Communication

```bash
# List connected AI peers
alsaniamcp comm peers

# Send message to specific peer
alsaniamcp comm send <peerId> "<message>"

# Broadcast message to all peers
alsaniamcp comm broadcast "<message>"
```

### Dynamic Server Spawning

```bash
# List available server configurations
alsaniamcp spawn list

# Start a predefined MCP server
alsaniamcp spawn start <type> # type: filesystem|git|github

# Stop a spawned server
alsaniamcp spawn stop <serverId>

# Show server status
alsaniamcp spawn status
```

### Tool Management

```bash
# List available MCP tools
alsaniamcp tools list [-s <serverId>]

# Call an MCP tool
alsaniamcp tools call <serverId> <toolName> [-a <json-args>]
```

### Configuration

```bash
# Initialize configuration files
alsaniamcp config init [-f]

# Validate current configuration
alsaniamcp config validate
```

### Legacy Commands (Backward Compatible)

```bash
# Deprecated - use "server start" instead
alsaniamcp start

# Deprecated - use "config init" instead
alsaniamcp init

# Deprecated - use "comm" commands instead
alsaniamcp proxy
```

## 🐳 Container Deployment (Docker & Podman)

### Build Image
```bash
docker build -t alsaniamcp/mcp:latest .
```

### Run Container
```bash
docker run -d \
  -p 8050:8050 \
  -e SESSION_SECRET=your-secret-here \
  --name alsaniamcp \
  alsaniamcp/mcp:latest
```

### Docker Compose
```bash
docker-compose up -d
```

## 🧪 Development

### Project Structure
```
src/
├── cli/            # CLI command handlers
├── communication/  # AI-to-AI communication
│   └── a2a.ts      # AI-to-AI communication logic
├── core/           # Core MCP server implementation
│   └── server.ts   # Universal MCP server
├── proxy/          # MCP proxy manager
│   └── mcp-proxy.ts# MCP proxy implementation
├── security/       # Security utilities
├── spawner/        # Dynamic server spawning
├── transport/      # HTTP gateway and transports
│   └── http-gateway.ts # HTTP gateway implementation
├── types/          # TypeScript type definitions
│   └── index.ts    # Type definitions
├── utils/          # Utility functions
│   └── hash.ts     # BLAKE3 hashing utilities
├── voice/          # Voice activation and processing
├── cli.ts          # CLI implementation
└── index.ts        # Entry point
```

### Scripts
- `npm run dev` - Start development server with watch mode
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server (verified working)
- `npm run cli` - Run CLI commands
- `npm test` - Run tests (Jest: 13 suites, 167 passing)

## ✅ Current Status (Updated 2026-10-14)

### ✅ Verified Working
- ✅ Dependencies installed (199 packages, 0 vulnerabilities)
- ✅ TypeScript build successful
- ✅ Production server starts and runs
- ✅ Docker setup configured (Docker 28.2.2, docker-compose 1.29.2)
- ✅ Multi-transport support (STDIO, HTTP/SSE, Streamable HTTP)
- ✅ JWT authentication and BLAKE3 hashing implemented
- ✅ REST API with Server-Sent Events for streaming
- ✅ **A2A Communication System** - AI-to-AI messaging fully operational
- ✅ **A2A Tool Registration** - All A2A tools properly registered and accessible
- ✅ **HTTP Gateway Integration** - A2A endpoints integrated with HTTP gateway

### 🏗️ Architecture Components
- ✅ Universal MCP Server with tool/resource/prompt registries
- ✅ MCP Proxy Manager with dynamic loading/unloading
- ✅ HTTP Gateway with REST API and SSE streaming
- ✅ CLI interface (`alsaniamcp` / `amcp` commands)
- ✅ **AI-to-AI Communication Framework** - ✅ FULLY OPERATIONAL
- ✅ Voice activation and speech processing (implemented)
- ✅ Dynamic MCP server spawning (implemented)
- 🔄 Integrated testing framework (in development)

### 🔧 Recent Updates
- **A2A Tool Registration Fix** - Missing `mcpServer.start()` call added
- **HTTP Gateway A2A Integration** - A2A endpoints connected to actual A2A system
- **Peer Registration** - AIs can register via `/a2a/register` endpoint
- **Message System** - AIs can send messages via `/a2a/message` endpoint
- **Peer Discovery** - Connected peers visible via `/a2a/peers` endpoint

### 📊 Code Metrics
- **Languages**: TypeScript 5.x
- **Runtime**: Node.js with ES modules
- **Testing**: Jest — 13 suites, 167 passing / 2 skipped (verified 2026-10-14)
- **Dependencies**: 199 packages, mostly MCP SDK and utilities

## 🎯 Roadmap (Updated)

- [x] **Phase 1 - Core MVP** ✅ COMPLETE
  - [x] Core MCP server with JSON-RPC 2.0
  - [x] Dynamic proxy/registry system
  - [x] Multi-transport layer (STDIO, HTTP/SSE)
  - [x] HTTP streaming gateway
  - [x] Streamable HTTP proxy transport

- [x] **Phase 2 - Advanced Features** ✅ COMPLETE
  - [x] AI-to-AI communication framework (implemented)
  - [x] Voice activation and speech processing (implemented)
  - [x] Dynamic MCP server spawning (implemented)
  - [x] Voice activation with keyword detection (implemented)
  - [x] Speech-to-text and text-to-speech (implemented)
  - [x] Integrated voice command processing (implemented)

- [ ] **Phase 3 - Enterprise Ready**
  - [ ] Advanced security layer
  - [ ] Chaos testing framework
  - [ ] Performance monitoring
  - [x] Unit and integration tests (13 suites, 167 passing)
  - [ ] Comprehensive documentation

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

- **Documentation**: [MCP Protocol Docs](https://modelcontextprotocol.io)
- **Issues**: [GitHub Issues](https://github.com/alsania-dev/mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/alsania-dev/alsaniamcp/discussions)

---

Built with ❤️ using the [Model Context Protocol](https://modelcontextprotocol.io)
