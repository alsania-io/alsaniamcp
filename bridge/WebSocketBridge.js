/**
 * WebSocketBridge.js
 * Entry point for real-time communication between agents and human clients.
 */

import WebSocket, { WebSocketServer } from 'ws';
import { PresenceManager } from '../modules/PresenceManager.js';

export class WebSocketBridge {
  constructor(port = 8080) {
    this.wss = new WebSocketServer({ port });
    this.presence = new PresenceManager(this);
    console.log(\`[Bridge] WebSocket server running on port \${port}\`);

    this.wss.on('connection', (ws) => this.onConnection(ws));
  }

  send(message) {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  onConnection(ws) {
    ws.on('message', (raw) => this.handleMessage(ws, raw));
  }handleMessage(ws, raw) {
    try {
      const msg = JSON.parse(raw.toString());
      const { action, channel_id, user, agent_id, message } = msg;

      switch (action) {
        case 'join_channel':
          this.presence.joinChannel(channel_id, user);
          break;
        case 'invite_agent':
          this.presence.inviteAgent(channel_id, agent_id);
          break;
        case 'broadcast':
          this.presence.broadcast(channel_id, message);
          break;
        case 'leave_channel':
          this.presence.leaveChannel(channel_id, user);
          break;
        default:
          console.warn('[Bridge] Unknown action:', action);
      }
    } catch (err) {
      console.error('[Bridge] Failed to parse incoming message:', err);
    }
  }
}

export const bridge = new WebSocketBridge(8080);
console.log('[Bridge] Ready to handle real-time events.');