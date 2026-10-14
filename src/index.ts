import "dotenv/config";
import { AlsaniaMcp } from "./core/server.js";
import { AlsaniaMcpAudit } from "./core/server-audit.js";
import { HTTPGateway } from "./transport/http-gateway.js";
import { MCPProxyManager } from "./proxy/mcp-proxy.js";
import {
  A2ACommunication,
  A2ACommunicationFactory,
  MessageType,
  Peer,
} from "./communication/a2a.js";
import { AgentToolsIntegration } from "./agent-tools.js";
import { ServerSpawnerManager } from "./spawner/index.js";
import { loadAndRegisterTools } from "./tool-loader.js";

// Re-export audit logger for external use
export { AuditLogger, createAuditLogger, defaultAuditConfig } from "./lib/scribe-audit-logger.js";
export { AlsaniaMcpAudit } from "./core/server-audit.js";

// Agent Framework Extension
interface Agent {
  id: string;
  name: string;
  description: string;
  status: string;
  capabilities: string[];
  lastSeen: number;
  metadata?: Record<string, any>;
}

class AgentFramework {
  private agents: Map<string, Agent> = new Map();
  private a2a: A2ACommunication;

  constructor(a2a: A2ACommunication) {
    this.a2a = a2a;
    this.a2a.on("message", (message) => {
      this.handleAgentMessage(message);
    });
  }

  registerAgent(agent: Omit<Agent, "lastSeen">): string {
    const fullAgent: Agent = {
      ...agent,
      lastSeen: Date.now()
    };
    this.agents.set(agent.id, fullAgent);
    const peer: Peer = {
      id: agent.id,
      name: agent.name,
      capabilities: agent.capabilities,
      status: "online",
      lastSeen: Date.now(),
      metadata: { description: agent.description, ...agent.metadata }
    };
    this.a2a.registerPeer(peer);
    this.a2a.broadcast(MessageType.EVENT, {
      type: "agent_registered",
      agent: fullAgent
    });
    console.log(`🤖 Agent registered: ${agent.name} (${agent.id})`);
    return agent.id;
  }

  unregisterAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      this.a2a.unregisterPeer(agentId);
      this.a2a.broadcast(MessageType.EVENT, {
        type: "agent_unregistered",
        agentId
      });
      console.log(`🤖 Agent unregistered: ${agentId}`);
      return true;
    }
    return false;
  }

  updateAgentStatus(agentId: string, status: string): boolean {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.lastSeen = Date.now();
      this.a2a.updatePeerStatus(agentId, status === "online" ? "online" : "busy");
      this.a2a.broadcast(MessageType.EVENT, {
        type: "agent_status_updated",
        agentId,
        status
      });
      return true;
    }
    return false;
  }

  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  async sendMessage(toAgentId: string, message: string, fromAgentId?: string): Promise<string> {
    return await this.a2a.sendMessage(toAgentId, MessageType.EVENT, {
      type: "agent_message",
      from: fromAgentId || "alsania-mcp",
      content: message,
      timestamp: Date.now()
    });
  }

  async broadcastMessage(message: string, fromAgentId?: string): Promise<void> {
    await this.a2a.broadcast(MessageType.EVENT, {
      type: "agent_broadcast",
      from: fromAgentId || "alsania-mcp",
      content: message,
      timestamp: Date.now()
    });
  }

  private handleAgentMessage(message: any) {
    if (message.payload?.type === "agent_registration") {
      const agentData = message.payload.agent;
      this.registerAgent(agentData);
    }
  }
}

async function main() {
  console.log("🚀 Starting AlsaniaMCP Server with Agent Framework...");

  // Check if audit logging is enabled
  const auditEnabled = process.env.AUDIT_LOGGING_ENABLED === 'true';

  let mcpServer;
  if (auditEnabled) {
    console.log("📝 Audit logging enabled");
    mcpServer = new AlsaniaMcpAudit({
      auditEnabled: true,
      auditLogRoot: process.env.AUDIT_LOG_ROOT || './logs/alsaniamcp',
      auditOwner: process.env.AUDIT_OWNER || 'Unknown',
      auditModel: process.env.AUDIT_MODEL || 'echo-cloud',
      auditMcpUrl: process.env.AUDIT_MCP_URL || 'http://localhost:8050/mcp',
      logLevel: process.env.LOG_LEVEL || 'info',
      outputTransport: process.env.OUTPUT_TRANSPORT || 'console',
    });
  } else {
    mcpServer = new AlsaniaMcp();
  }

  const proxyManager = new MCPProxyManager(mcpServer);
  // One ACL shared by the proxy (stdio tool calls) and the HTTP gateway.
  // Empty => open behavior preserved; grants activate enforcement on both paths.
  const { Acl } = await import('./auth/acl.js');
  proxyManager.acl = new Acl();

  await loadAndRegisterTools(mcpServer);

  // ── agent-comms mesh (cross-harness agent communication) ──
  // Spawns `agent-comms bridge mcp` as a stdio MCP child and auto-registers
  // its `agent_comms` tool. Optional: only wired when AGENT_COMMS_ENABLED=true.
  if (process.env.AGENT_COMMS_ENABLED === 'true') {
    try {
      const agentCommsBin =
        process.env.AGENT_COMMS_BIN ||
        '/home/sigma/Desktop/insidedev/sigma-lab/agent-comms/dist/cli.js';
      await proxyManager.connectToServer({
        id: 'agent-comms',
        name: 'Agent Comms Mesh',
        transport: 'stdio',
        command: process.execPath, // node
        args: [agentCommsBin, 'bridge', 'mcp'],
        isOpen: true,
      });
      console.log('✅ agent-comms mesh bridged (stdio MCP child)');
    } catch (err: any) {
      console.error('⚠️ agent-comms bridge failed:', err.message);
    }
  }

  // ── CLI sources (any CLI -> MCP via any-cli-mcp-server) ──
  // Comma-separated CLI names, e.g. ALSANIA_CLI_SOURCES=git,gh,docker.
  // Each is proxied as a stdio MCP child; tools auto-register. Optional.
  if (process.env.ALSANIA_CLI_SOURCES) {
    const { cliSources } = await import('./proxy/cli-source.js');
    const clis = process.env.ALSANIA_CLI_SOURCES.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const cli of clis) {
      try {
        await proxyManager.connectToServer(cliSources(cli)[0]);
        console.log(`✅ CLI source proxied: ${cli}`);
      } catch (err: any) {
        console.error(`⚠️ CLI source '${cli}' failed:`, err.message);
      }
    }
  }

  const spawner = new ServerSpawnerManager({
    maxServers: 5,
    timeoutMs: 30000,
    workingDirectory: process.cwd(),
    environmentVars: { NODE_ENV: process.env.NODE_ENV || 'development' },
    logLevel: 'info' as const
  });

  const a2a = A2ACommunicationFactory.create(
    {
      peerId: "alsania-mcp",
      peerName: "Alsania MCP Core",
      maxRetries: 3,
      timeoutMs: 30000,
      heartbeatInterval: 5000,
      messageTTLSecs: 300,
      startTime: Date.now(),
    },
    mcpServer,
    proxyManager
  );

  const agentFramework = new AgentFramework(a2a);
  const agentToolsIntegration = new AgentToolsIntegration(mcpServer);

  // Register tools (simplified - full version has many more)
  mcpServer.registerTool("a2a", "list_peers", { description: "List all connected A2A communication peers", inputSchema: { type: "object", properties: {} } }, async () => ({ peers: a2a.getPeers() }));

  await mcpServer.start();

  const GATEWAY_MODE = process.env.ALSANIA_GATEWAY_MODE || "builtin";
  const GATEWAY_PORT = parseInt(process.env.ALSANIA_GATEWAY_PORT || "8050");

  console.log(`✅ AlsaniaMCP running in self-contained mode`);
  console.log(`🔧 Gateway mode: ${GATEWAY_MODE} (port: ${GATEWAY_PORT})`);

  let gateway: HTTPGateway | null = null;

  if (GATEWAY_MODE === "builtin" || GATEWAY_MODE === "internal") {
    gateway = new HTTPGateway(mcpServer, proxyManager, a2a, GATEWAY_PORT,
      process.env.API_KEYS?.split(",") || []);
    // Share the single ACL instance so HTTP + stdio enforcement agree.
    if (proxyManager.acl) gateway.acl = proxyManager.acl;
  }

  setInterval(async () => { await proxyManager.cleanupExpired(); }, 60000);

  if (gateway) {
    gateway.addRoute("test", { path: "/test", targetServerId: "core", method: "POST", requiresAuth: false });
    agentToolsIntegration.setupSSEEndpoint(gateway.app);
    gateway.start();
  }

  console.log("✅ AlsaniaMCP Server with Comprehensive Agent Framework is running");

  if (gateway) {
    console.log(`📡 HTTP Gateway: http://localhost:${GATEWAY_PORT}/gateway`);
    console.log(`🌐 MCP Protocol: http://localhost:${GATEWAY_PORT}/mcp`);
  }

  // Log audit status
  if (auditEnabled && 'getLatestLog' in mcpServer) {
    const logPath = (mcpServer as AlsaniaMcpAudit).getLatestLog();
    console.log(`📝 Audit log: ${logPath || 'No logs yet'}`);
  }

  // Start Slack Relay
  if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID && process.env.SLACK_RELAY_ENABLED === 'true') {
    try {
      const { initSlackRelay } = await import('./slack-init.js');
      await initSlackRelay(a2a, MessageType);
    } catch (err: any) {
      console.error('Slack Relay error:', err.message);
    }
  }
}

main().catch(console.error);
