// Tools and resources explorer utilities

class ToolsExplorer {
    static async callTool(serverId, toolName, args = {}) {
        try {
            const response = await fetch(`${window.location.origin}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverId, toolName, args }),
            });
            return await response.json();
        } catch (error) {
            console.error(`Failed to call tool ${toolName}:`, error);
            return null;
        }
    }

    static async readResource(serverId, resourceUri) {
        try {
            const response = await fetch(`${window.location.origin}/resource`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverId, resourceUri }),
            });
            return await response.json();
        } catch (error) {
            console.error(`Failed to read resource ${resourceUri}:`, error);
            return null;
        }
    }

    static async getPrompt(serverId, promptName, args = {}) {
        try {
            const response = await fetch(`${window.location.origin}/prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverId, promptName, args }),
            });
            return await response.json();
        } catch (error) {
            console.error(`Failed to get prompt ${promptName}:`, error);
            return null;
        }
    }

    static async listResources() {
        try {
            const response = await fetch(`${window.location.origin}/resources`);
            return await response.json();
        } catch (error) {
            console.error('Failed to list resources:', error);
            return { resources: [] };
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToolsExplorer;
}
