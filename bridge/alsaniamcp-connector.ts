// services/alsania-gateway/bridge/alsaniamcp-connector.ts
import axios from "axios";

export class AlsaniaMCPBridge {
  private alsaniamcpBaseUrl = "http://localhost:8050";
  private isConnected = false;
  private a2aPeerId = "gateway-bridge";
  private pendingRequests = new Map();

  async ensureConnected() {
    if (!this.isConnected) {
      try {
        // Test connection to alsaniamcp core using proper A2A endpoints
        const health = await axios.get(`${this.alsaniamcpBaseUrl}/health`, {
          timeout: 10000
        });
        console.log("✅ Connected to AlsaniaMCP:", health.data);
        this.isConnected = true;
        
        // Register as A2A peer
        await this.registerAsPeer();
      } catch (error: any) {
        console.error(
          "❌ Cannot connect to AlsaniaMCP - is it running on port 8050? Error:",
          error.message
        );
        throw error;
      }
    }
  }

  async registerAsPeer() {
    try {
      const response = await axios.post(`${this.alsaniamcpBaseUrl}/a2a/register`, {
        peerId: this.a2aPeerId,
        peerName: "Gateway Bridge Connector",
        capabilities: ["execute_tool", "list_tools", "list_resources"],
        status: "online"
      }, {
        timeout: 15000
      });
      console.log("✅ Registered as A2A peer:", response.data);
    } catch (error: any) {
      console.warn("⚠️ A2A peer registration failed:", error.message);
      // Continue without A2A registration for backward compatibility
    }
  }

  async callTool(toolName: string, args: any) {
    await this.ensureConnected();

    try {
      // First try A2A communication
      const a2aResponse = await this.callToolViaA2A(toolName, args);
      return a2aResponse;
    } catch (a2aError: any) {
      console.warn("⚠️ A2A communication failed, falling back to direct HTTP:", a2aError.message);
      
      // Fallback to direct HTTP call
      const response = await axios.post(`${this.alsaniamcpBaseUrl}/mcp`, {
        serverId: "default",
        toolName: toolName,
        args: args,
      }, {
        timeout: 30000
      });

      return response.data;
    }
  }

  async callToolViaA2A(toolName: string, args: any) {
    const messageId = this.generateMessageId();
    
    const message = {
      id: messageId,
      type: "request",
      priority: "normal", 
      from: this.a2aPeerId,
      to: "alsaniamcp-core",
      timestamp: Date.now(),
      payload: {
        action: "execute_tool",
        toolName: toolName,
        args: args
      },
      correlationId: messageId,
      ttl: 60
    };

    return new Promise((resolve, reject) => {
      // Store the pending request
      this.pendingRequests.set(messageId, { resolve, reject });
      
      // Set timeout for A2A request
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(messageId);
        reject(new Error(`A2A request timeout for messageId ${messageId}`));
      }, 25000);

      // Send message via HTTP transport (A2A endpoint)
      axios.post(`${this.alsaniamcpBaseUrl}/a2a/message`, message, {
        timeout: 30000
      }).then(response => {
        clearTimeout(timeout);
        if (response.data.success) {
          resolve(response.data.data);
        } else {
          reject(new Error(response.data.error || "A2A request failed"));
        }
      }).catch(error => {
        clearTimeout(timeout);
        this.pendingRequests.delete(messageId);
        reject(error);
      });
    });
  }

  async getTools() {
    await this.ensureConnected();
    
    try {
      // Try A2A first
      const a2aResponse = await axios.post(`${this.alsaniamcpBaseUrl}/a2a/message`, {
        id: this.generateMessageId(),
        type: "request", 
        from: this.a2aPeerId,
        to: "alsaniamcp-core",
        timestamp: Date.now(),
        payload: {
          action: "list_tools"
        }
      }, {
        timeout: 15000
      });
      
      if (a2aResponse.data.success) {
        return a2aResponse.data.data;
      }
    } catch (error: any) {
      console.warn("⚠️ A2A tools list failed, using direct HTTP:", error.message);
    }
    
    // Fallback to direct HTTP
    const response = await axios.get(`${this.alsaniamcpBaseUrl}/tools`, {
      timeout: 10000
    });
    return response.data;
  }

  private generateMessageId(): string {
    return `a2a-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Handle incoming A2A responses (if gateway needs to receive A2A messages)
  handleA2AResponse(response: any) {
    const correlationId = response.correlationId;
    const pending = this.pendingRequests.get(correlationId);
    
    if (pending) {
      if (response.success) {
        pending.resolve(response.data);
      } else {
        pending.reject(new Error(response.error));
      }
      this.pendingRequests.delete(correlationId);
    }
  }
}

// Export singleton instance
export const alsaniaBridge = new AlsaniaMCPBridge();