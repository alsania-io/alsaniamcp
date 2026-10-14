/**
 * PresenceManager - handles live channel joins, invitations, and broadcasts.
 * Works over WebSocket and integrates with memory-cache for persistence.
 */

import WebSocket from 'ws';
import { MemoryHandler } from '../modules/memoryHandler.js';

export class PresenceManager {
  constructor(server) {
    this.server = server;
    this.channels = new Map();
    this.memory = new MemoryHandler('meetings');
  }

  joinChannel(channelId, user) {
    if (!this.channels.has(channelId)) {
      this.channels.set(channelId, new Set());
    }
    this.channels.get(channelId).add(user);
    this.memory.store(\`User \${user} joined channel \${channelId}\`);
    console.log(\`[\${channelId}] User joined:\`, user);
  }inviteAgent(channelId, agentId) {
    if (!this.channels.has(channelId)) {
      console.warn(\`Attempted to invite agent to nonexistent channel: \${channelId}\`);
      return;
    }
    this.channels.get(channelId).add(agentId);
    this.memory.store(\`Agent \${agentId} invited to channel \${channelId}\`);
    console.log(\`[\${channelId}] Agent invited:\`, agentId);
  }

  broadcast(channelId, message) {
    if (!this.channels.has(channelId)) return;
    for (const member of this.channels.get(channelId)) {
      this.server.send(JSON.stringify({ channelId, member, message }));
    }
    this.memory.store(\`Broadcast in \${channelId}: \${message}\`);
    console.log(\`[\${channelId}] Broadcast:\`, message);
  }

  leaveChannel(channelId, user) {
    if (this.channels.has(channelId)) {
      this.channels.get(channelId).delete(user);
      this.memory.store(\`User \${user} left channel \${channelId}\`);
      console.log(\`[\${channelId}] User left:\`, user);
    }
  }
}