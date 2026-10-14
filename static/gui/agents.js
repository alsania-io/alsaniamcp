// Agents management utilities
// This file provides additional agent-specific functionality

class AgentManager {
    static async getAgentById(agentId) {
        try {
            const response = await fetch(`${window.location.origin}/agents/${agentId}`);
            return await response.json();
        } catch (error) {
            console.error(`Failed to get agent ${agentId}:`, error);
            return null;
        }
    }

    static async getAgentStats() {
        try {
            const response = await fetch(`${window.location.origin}/agents/stats`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get agent stats:', error);
            return null;
        }
    }

    static async connectMemoryDb(agentId, dbConfig) {
        try {
            const response = await fetch(`${window.location.origin}/agents/${agentId}/memory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbConfig),
            });
            return await response.json();
        } catch (error) {
            console.error(`Failed to connect memory DB for agent ${agentId}:`, error);
            return null;
        }
    }

    static async executeAgentAction(agentId, action, params = {}) {
        try {
            const response = await fetch(`${window.location.origin}/agents/${agentId}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, params }),
            });
            return await response.json();
        } catch (error) {
            console.error(`Failed to execute agent action:`, error);
            return null;
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AgentManager;
}
