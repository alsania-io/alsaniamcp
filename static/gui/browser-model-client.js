/**
 * Browser Model Client - Connects browser-based AI models (ChatGPT, Claude, Gemini) to AlsaniaMCP
 * 
 * Usage:
 * const client = new AlsaniaBrowserModelClient({
 *   name: 'ChatGPT',
 *   platform: 'chatgpt',
 *   serverUrl: 'ws://localhost:5000'
 * });
 * 
 * await client.connect();
 * await client.sendMessage('Hello from ChatGPT!');
 */

class AlsaniaBrowserModelClient {
  constructor(config) {
    this.config = {
      name: config.name || 'Browser Model',
      platform: config.platform || 'custom',
      serverUrl: config.serverUrl || 'ws://localhost:5000',
      ...config
    };
    
    this.ws = null;
    this.modelId = null;
    this.agentId = null;
    this.messageHandlers = new Map();
    this.isConnected = false;
  }

  /**
   * Connect to AlsaniaMCP Browser Gateway
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.config.serverUrl}/browser-models?modelId=${this.config.name}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ Connected to AlsaniaMCP Browser Gateway');
          this.isConnected = true;
          this.registerModel();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 Disconnected from AlsaniaMCP');
          this.isConnected = false;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Register this browser model as an agent
   */
  registerModel() {
    this.send({
      type: 'register',
      payload: {
        name: this.config.name,
        platform: this.config.platform
      }
    });
  }

  /**
   * Send message from browser model
   */
  async sendMessage(content, options = {}) {
    if (!this.isConnected) {
      throw new Error('Not connected to AlsaniaMCP gateway');
    }

    this.send({
      type: 'message',
      payload: {
        content,
        isPrivate: options.isPrivate || false,
        isUnread: options.isUnread !== false
      }
    });
  }

  /**
   * Add wake trigger for this model
   */
  async addTrigger(phrase, signalType = 'silent') {
    if (!this.isConnected) {
      throw new Error('Not connected to AlsaniaMCP gateway');
    }

    this.send({
      type: 'trigger',
      payload: {
        phrase,
        signalType
      }
    });
  }

  /**
   * Get unread messages for this model
   */
  async getUnreadMessages(limit = 50) {
    return this.query('unread_messages', { limit });
  }

  /**
   * Check if triggers match a message
   */
  async checkTriggers(message) {
    return this.query('check_triggers', { message });
  }

  /**
   * Get model info
   */
  async getModelInfo() {
    return this.query('model_info', {});
  }

  /**
   * List all connected browser models
   */
  async getAllModels() {
    return this.query('all_models', {});
  }

  /**
   * Query AlsaniaMCP
   */
  async query(queryType, params = {}) {
    return new Promise((resolve, reject) => {
      const requestId = `query_${Date.now()}_${Math.random()}`;
      
      const timeout = setTimeout(() => {
        this.messageHandlers.delete(requestId);
        reject(new Error(`Query timeout: ${queryType}`));
      }, 30000);

      this.messageHandlers.set(requestId, {
        resolve,
        reject,
        timeout,
        queryType
      });

      this.send({
        type: 'query',
        payload: {
          queryType,
          params
        }
      });
    });
  }

  /**
   * Internal: Handle incoming messages
   */
  handleMessage(message) {
    console.log('📨 Message from gateway:', message.type);

    if (message.type === 'welcome') {
      console.log(`🎉 ${message.message}`);
      this.modelId = message.modelId;
    } else if (message.type === 'registered') {
      this.modelId = message.modelId;
      this.agentId = message.agentId;
      console.log(`✅ Registered as agent: ${this.agentId}`);
      this.emit('registered', { modelId: this.modelId, agentId: this.agentId });
    } else if (message.type === 'message_stored') {
      this.emit('message_stored', { content: message.content });
    } else if (message.type === 'trigger_added') {
      this.emit('trigger_added', { phrase: message.phrase, success: message.success });
    } else if (message.type === 'query_result') {
      const handler = this.messageHandlers.get(message.requestId);
      if (handler) {
        clearTimeout(handler.timeout);
        this.messageHandlers.delete(message.requestId);
        handler.resolve(message.result);
      }
    } else if (message.type === 'external_message') {
      this.emit('external_message', { from: message.from, content: message.content });
    } else if (message.type === 'error') {
      const handler = this.messageHandlers.get(message.requestId);
      if (handler) {
        clearTimeout(handler.timeout);
        this.messageHandlers.delete(message.requestId);
        handler.reject(new Error(message.error));
      }
      this.emit('error', message.error);
    }
  }

  /**
   * Internal: Send message to gateway
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Event emitter
   */
  on(event, callback) {
    if (!this.messageHandlers.has('events')) {
      this.messageHandlers.set('events', {});
    }
    const events = this.messageHandlers.get('events');
    if (!events[event]) {
      events[event] = [];
    }
    events[event].push(callback);
  }

  emit(event, data) {
    const events = this.messageHandlers.get('events') || {};
    if (events[event]) {
      events[event].forEach(callback => callback(data));
    }
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
    }
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AlsaniaBrowserModelClient;
}
