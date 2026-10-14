/**
 * Agent Communication and Coordination Framework for AlsaniaMCP
 * Node.js port of the comprehensive Python agent framework
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

class AgentFramework extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = config;
        this.agentRegistry = new Map();
        this.messageQueues = new Map();
        this.activeConnections = new Map();
        this.activeTasks = new Map();
        this.heartbeatInterval = null;
        
        // Initialize with default port
        this.serverPort = config.serverPort || 8001;
        
        this.logger = console;
        this.initialize();
    }

    initialize() {
        this.logger.info('🤖 Agent Framework initialized (Node.js port)');
        this.startHeartbeat();
    }

    // Agent Registration & Discovery
    registerAgent(agentData) {
        const { agentId, agentName, capabilities, endpoint, metadata = {}, agentType = 'ai' } = agentData;

        if (this.agentRegistry.has(agentId)) {
            throw new Error(`Agent ID '${agentId}' already registered`);
        }

        const agentRecord = {
            agentId,
            agentName,
            agentType: agentType, // 'ai' or 'human'
            capabilities: capabilities || [],
            endpoint,
            metadata,
            registeredAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            status: 'online',
            messageCount: 0,
            taskParticipation: [],
            // Human-specific fields
            ...(agentType === 'human' && {
                userId: agentId, // Alias for human users
                userType: metadata.userType || 'guest',
                lastActive: new Date().toISOString()
            })
        };

        this.agentRegistry.set(agentId, agentRecord);
        this.messageQueues.set(agentId, []);

        // Emit registration event
        this.emit('agentRegistered', agentRecord);
        
        this.logger.info(`🤖 Agent registered: ${agentName} (${agentId})`);

        return {
            agentId,
            registrationStatus: 'success',
            registeredAt: agentRecord.registeredAt,
            networkSize: this.agentRegistry.size,
            availableCapabilities: this.getAllCapabilities()
        };
    }

    unregisterAgent(agentId) {
        if (!this.agentRegistry.has(agentId)) {
            return false;
        }

        const agent = this.agentRegistry.get(agentId);
        this.agentRegistry.delete(agentId);
        this.messageQueues.delete(agentId);
        
        if (this.activeConnections.has(agentId)) {
            this.activeConnections.delete(agentId);
        }

        this.emit('agentUnregistered', agentId);
        this.logger.info(`🤖 Agent unregistered: ${agentId}`);
        
        return true;
    }

    discoverAgents(filters = {}) {
        const { capabilityFilter = [], statusFilter = 'all' } = filters;
        const filteredAgents = [];

        for (const [agentId, agentData] of this.agentRegistry) {
            // Apply status filter
            if (statusFilter !== 'all' && agentData.status !== statusFilter) {
                continue;
            }

            // Apply capability filter
            if (capabilityFilter.length > 0) {
                const hasCapability = capabilityFilter.some(cap => 
                    agentData.capabilities.includes(cap)
                );
                if (!hasCapability) continue;
            }

            filteredAgents.push({
                agentId,
                agentName: agentData.agentName,
                capabilities: agentData.capabilities,
                status: agentData.status,
                lastSeen: agentData.lastSeen,
                endpoint: agentData.endpoint,
                messageCount: agentData.messageCount
            });
        }

        // Sort by last seen (most recent first)
        filteredAgents.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

        return {
            discoveredAgents: filteredAgents,
            totalCount: filteredAgents.length,
            filterApplied: { capabilities: capabilityFilter, status: statusFilter },
            networkSummary: {
                totalRegistered: this.agentRegistry.size,
                onlineAgents: Array.from(this.agentRegistry.values()).filter(a => a.status === 'online').length,
                uniqueCapabilities: this.getAllCapabilities().length
            }
        };
    }

    // Message Routing
    async sendMessage(messageData) {
        const { targetAgentId, messageType = 'request', content, priority = 'normal', timeout = 30 } = messageData;

        if (!this.agentRegistry.has(targetAgentId)) {
            throw new Error(`Target agent '${targetAgentId}' not found`);
        }

        const message = {
            messageId: uuidv4(),
            fromAgent: 'system', // Could be parameterized
            toAgent: targetAgentId,
            messageType,
            content,
            priority,
            timestamp: new Date().toISOString(),
            timeout,
            status: 'sent',
            read: false
        };

        // Add to target agent's message queue
        const targetQueue = this.messageQueues.get(targetAgentId) || [];
        targetQueue.push(message);
        this.messageQueues.set(targetAgentId, targetQueue);

        // Update agent message count
        const agent = this.agentRegistry.get(targetAgentId);
        agent.messageCount++;
        agent.lastSeen = new Date().toISOString();

        // Try to deliver via active connection
        if (this.activeConnections.has(targetAgentId)) {
            try {
                const connection = this.activeConnections.get(targetAgentId);
                // In a real implementation, this would send via WebSocket/SSE
                connection.send(JSON.stringify(message));
                message.status = 'delivered';
            } catch (error) {
                this.logger.warning(`Failed to deliver message via connection: ${error.message}`);
            }
        }

        return {
            messageId: message.messageId,
            status: message.status,
            targetAgent: targetAgentId,
            sentAt: message.timestamp,
            queuePosition: targetQueue.length
        };
    }

    async broadcastMessage(broadcastData) {
        const { 
            targetCapabilities = [], 
            targetAgents = [], 
            messageType = 'announcement', 
            content, 
            requireResponse = false 
        } = broadcastData;

        const recipients = new Set();

        // Add specific target agents
        for (const agentId of targetAgents) {
            if (this.agentRegistry.has(agentId)) {
                recipients.add(agentId);
            }
        }

        // Add agents with required capabilities
        for (const [agentId, agentData] of this.agentRegistry) {
            if (targetCapabilities.length > 0) {
                const hasCapability = targetCapabilities.some(cap => 
                    agentData.capabilities.includes(cap)
                );
                if (hasCapability) recipients.add(agentId);
            } else if (targetAgents.length === 0) {
                // If no specific targets and no capabilities, broadcast to all
                recipients.add(agentId);
            }
        }

        if (recipients.size === 0) {
            throw new Error('No target agents found for broadcast');
        }

        const broadcastId = uuidv4();
        const sentMessages = [];

        for (const agentId of recipients) {
            const message = {
                messageId: uuidv4(),
                broadcastId,
                fromAgent: 'system',
                toAgent: agentId,
                messageType,
                content,
                timestamp: new Date().toISOString(),
                requireResponse,
                status: 'sent',
                read: false
            };

            // Add to agent's message queue
            const agentQueue = this.messageQueues.get(agentId) || [];
            agentQueue.push(message);
            this.messageQueues.set(agentId, agentQueue);

            // Update agent message count
            const agent = this.agentRegistry.get(agentId);
            agent.messageCount++;

            // Try connection delivery
            if (this.activeConnections.has(agentId)) {
                try {
                    const connection = this.activeConnections.get(agentId);
                    connection.send(JSON.stringify(message));
                    message.status = 'delivered';
                } catch (error) {
                    // Connection failed, message remains in queue
                }
            }

            sentMessages.push({
                agentId,
                messageId: message.messageId,
                status: message.status
            });
        }

        return {
            broadcastId,
            messageType,
            recipientsCount: recipients.size,
            sentMessages,
            timestamp: new Date().toISOString(),
            requireResponse
        };
    }

    getMessages(agentId, filters = {}) {
        const { messageType, unreadOnly = true, limit = 50 } = filters;

        if (!this.agentRegistry.has(agentId)) {
            throw new Error(`Agent '${agentId}' not found`);
        }

        const agentQueue = this.messageQueues.get(agentId) || [];

        // Apply filters
        let filteredMessages = agentQueue.filter(message => {
            if (unreadOnly && message.read) return false;
            if (messageType && message.messageType !== messageType) return false;
            return true;
        });

        // Sort by timestamp (newest first) and apply limit
        filteredMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        filteredMessages = filteredMessages.slice(0, limit);

        // Mark messages as read if not unreadOnly
        if (!unreadOnly) {
            filteredMessages.forEach(message => { message.read = true; });
        }

        return {
            agentId,
            messages: filteredMessages,
            messageCount: filteredMessages.length,
            totalUnread: agentQueue.filter(m => !m.read).length,
            filtersApplied: { messageType, unreadOnly, limit }
        };
    }

    // Task Management
    createTask(taskData) {
        const { 
            taskName, 
            taskDescription, 
            requiredCapabilities, 
            maxAgents = 5, 
            deadline, 
            taskData: additionalData = {} 
        } = taskData;

        const taskId = uuidv4();

        const task = {
            taskId,
            taskName,
            taskDescription,
            requiredCapabilities,
            maxAgents,
            deadline,
            taskData: additionalData,
            createdAt: new Date().toISOString(),
            status: 'open',
            participants: [],
            messages: []
        };

        this.activeTasks.set(taskId, task);

        // Find potential participants
        const potentialAgents = [];
        for (const [agentId, agentData] of this.agentRegistry) {
            const matchingCapabilities = agentData.capabilities.filter(cap => 
                requiredCapabilities.includes(cap)
            );
            
            if (matchingCapabilities.length > 0) {
                potentialAgents.push({
                    agentId,
                    agentName: agentData.agentName,
                    matchingCapabilities
                });
            }
        }

        return {
            taskId,
            taskName,
            status: 'created',
            createdAt: task.createdAt,
            potentialParticipants: potentialAgents,
            potentialCount: potentialAgents.length,
            requiredCapabilities,
            maxAgents
        };
    }

    joinTask(joinData) {
        const { taskId, agentId, offeredCapabilities } = joinData;

        if (!this.activeTasks.has(taskId)) {
            throw new Error(`Task '${taskId}' not found`);
        }

        if (!this.agentRegistry.has(agentId)) {
            throw new Error(`Agent '${agentId}' not found`);
        }

        const task = this.activeTasks.get(taskId);

        // Check if task is still open
        if (task.status !== 'open') {
            throw new Error('Task is not open for new participants');
        }

        // Check if agent already joined
        if (task.participants.some(p => p.agentId === agentId)) {
            throw new Error('Agent already joined this task');
        }

        // Check max participants
        if (task.participants.length >= task.maxAgents) {
            throw new Error('Task has reached maximum participants');
        }

        // Check if offered capabilities match requirements
        const matchingCapabilities = offeredCapabilities.filter(cap => 
            task.requiredCapabilities.includes(cap)
        );
        
        if (matchingCapabilities.length === 0) {
            throw new Error('No matching capabilities for task requirements');
        }

        // Add participant
        const participant = {
            agentId,
            agentName: this.agentRegistry.get(agentId).agentName,
            offeredCapabilities,
            matchingCapabilities,
            joinedAt: new Date().toISOString(),
            status: 'active'
        };

        task.participants.push(participant);

        // Update agent's task participation
        const agent = this.agentRegistry.get(agentId);
        agent.taskParticipation.push({
            taskId,
            taskName: task.taskName,
            joinedAt: participant.joinedAt,
            role: 'participant'
        });

        // Check if task is ready to start
        const allRequiredCaps = new Set(task.requiredCapabilities);
        const providedCaps = new Set();
        task.participants.forEach(p => {
            p.matchingCapabilities.forEach(cap => providedCaps.add(cap));
        });

        if (this.isSubset(allRequiredCaps, providedCaps)) {
            task.status = 'ready';
        }

        return {
            taskId,
            agentId,
            joinStatus: 'success',
            joinedAt: participant.joinedAt,
            taskStatus: task.status,
            participantsCount: task.participants.length,
            matchingCapabilities,
            taskReady: task.status === 'ready'
        };
    }

    // Protocol Negotiation
    negotiateProtocol(negotiationData) {
        const { agentA, agentB, supportedProtocols, encryptionRequired = true } = negotiationData;

        if (!this.agentRegistry.has(agentA)) {
            throw new Error(`Agent A '${agentA}' not found`);
        }

        if (!this.agentRegistry.has(agentB)) {
            throw new Error(`Agent B '${agentB}' not found`);
        }

        // Define supported protocols and their capabilities
        const availableProtocols = {
            websocket: {
                encryption: true,
                realTime: true,
                reliability: 'high',
                overhead: 'low'
            },
            http: {
                encryption: true,
                realTime: false,
                reliability: 'high',
                overhead: 'medium'
            },
            mcp: {
                encryption: true,
                realTime: true,
                reliability: 'high',
                overhead: 'low'
            },
            grpc: {
                encryption: true,
                realTime: true,
                reliability: 'high',
                overhead: 'medium'
            }
        };

        // Find compatible protocols
        const compatibleProtocols = supportedProtocols
            .filter(protocol => availableProtocols[protocol])
            .map(protocol => ({
                protocol,
                capabilities: availableProtocols[protocol]
            }))
            .filter(({ capabilities }) => !encryptionRequired || capabilities.encryption);

        if (compatibleProtocols.length === 0) {
            throw new Error('No compatible protocols found');
        }

        // Recommend best protocol (prioritize real-time and low overhead)
        const protocolScore = (p) => {
            const caps = p.capabilities;
            let score = 0;
            if (caps.realTime) score += 3;
            if (caps.reliability === 'high') score += 2;
            if (caps.overhead === 'low') score += 2;
            else if (caps.overhead === 'medium') score += 1;
            return score;
        };

        compatibleProtocols.sort((a, b) => protocolScore(b) - protocolScore(a));
        const recommendedProtocol = compatibleProtocols[0].protocol;

        const negotiationId = uuidv4();

        return {
            negotiationId,
            agentA,
            agentB,
            compatibleProtocols,
            recommendedProtocol,
            encryptionRequired,
            negotiationStatus: 'success',
            connectionDetails: {
                protocol: recommendedProtocol,
                endpoint: recommendedProtocol === 'websocket' 
                    ? `ws://localhost:${this.serverPort}/agent/${negotiationId}` 
                    : null,
                encryption: encryptionRequired ? 'TLS' : 'none'
            },
            timestamp: new Date().toISOString()
        };
    }

    // Network Status
    getNetworkStatus(includeMetrics = true) {
        const currentTime = new Date();

        const status = {
            networkStatus: 'active',
            timestamp: currentTime.toISOString(),
            agentCount: this.agentRegistry.size,
            activeConnections: this.activeConnections.size,
            totalMessages: Array.from(this.messageQueues.values())
                .reduce((sum, queue) => sum + queue.length, 0),
            activeTasks: this.activeTasks.size
        };

        // Agent status breakdown
        const statusCounts = { online: 0, offline: 0, idle: 0 };
        for (const agent of this.agentRegistry.values()) {
            statusCounts[agent.status] = (statusCounts[agent.status] || 0) + 1;
        }
        status.agentStatusBreakdown = statusCounts;

        // Capability analysis
        const allCapabilities = [];
        for (const agent of this.agentRegistry.values()) {
            allCapabilities.push(...agent.capabilities);
        }

        const capabilityCounts = {};
        allCapabilities.forEach(cap => {
            capabilityCounts[cap] = (capabilityCounts[cap] || 0) + 1;
        });

        // Get top 10 capabilities
        const topCapabilities = Object.entries(capabilityCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

        status.capabilityDistribution = topCapabilities;
        status.uniqueCapabilities = Object.keys(capabilityCounts).length;

        if (includeMetrics) {
            const metrics = {
                averageMessagesPerAgent: this.agentRegistry.size > 0 
                    ? Math.round(
                        Array.from(this.agentRegistry.values())
                            .reduce((sum, agent) => sum + agent.messageCount, 0) / 
                        this.agentRegistry.size * 100
                    ) / 100
                    : 0,
                serverUptime: 'Available in full implementation',
                websocketServerPort: this.serverPort,
                websocketServerStatus: 'running'
            };

            // Recent activity
            const recentAgents = Array.from(this.agentRegistry.entries())
                .map(([agentId, agent]) => ({
                    agentId,
                    lastSeen: agent.lastSeen,
                    messageCount: agent.messageCount
                }))
                .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
                .slice(0, 5);

            metrics.recentActivity = recentAgents;
            status.metrics = metrics;
        }

        return status;
    }

    // Connection Management
    addConnection(agentId, connection) {
        this.activeConnections.set(agentId, connection);
        
        if (this.agentRegistry.has(agentId)) {
            const agent = this.agentRegistry.get(agentId);
            agent.status = 'online';
            agent.lastSeen = new Date().toISOString();
        }

        this.logger.info(`🔗 Agent ${agentId} connected`);
    }

    removeConnection(agentId) {
        this.activeConnections.delete(agentId);
        
        if (this.agentRegistry.has(agentId)) {
            const agent = this.agentRegistry.get(agentId);
            agent.status = 'offline';
        }

        this.logger.info(`🔗 Agent ${agentId} disconnected`);
    }

    // Utility Methods
    getAllCapabilities() {
        const capabilities = new Set();
        for (const agent of this.agentRegistry.values()) {
            agent.capabilities.forEach(cap => capabilities.add(cap));
        }
        return Array.from(capabilities);
    }

    isSubset(subset, superset) {
        for (const elem of subset) {
            if (!superset.has(elem)) {
                return false;
            }
        }
        return true;
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.emit('heartbeat', {
                timestamp: new Date().toISOString(),
                agentCount: this.agentRegistry.size,
                activeConnections: this.activeConnections.size
            });
        }, 30000); // Every 30 seconds
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    cleanup() {
        this.stopHeartbeat();
        this.agentRegistry.clear();
        this.messageQueues.clear();
        this.activeConnections.clear();
        this.activeTasks.clear();
        this.logger.info('🧹 Agent Framework cleaned up');
    }
}

export default AgentFramework;