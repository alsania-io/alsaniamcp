/**
 * VoiceBridge.js
 * Handles WebRTC signaling and voice relay for group sessions.
 */

import { Server } from 'socket.io';
import http from 'http';
import { MemoryHandler } from '../modules/memoryHandler.js';

export class VoiceBridge {
  constructor(port = 8090) {
    this.server = http.createServer();
    this.io = new Server(this.server, {
      cors: { origin: '*' }
    });
    this.memory = new MemoryHandler('meetings');

    this.io.on('connection', (socket) => this.handleConnection(socket));
    this.server.listen(port, () => {
      console.log(\`[VoiceBridge] Listening on port \${port}\`);
    });
  }

  handleConnection(socket) {
    console.log('[VoiceBridge] Client connected:', socket.id);
    socket.on('join_room', (room) => {
      socket.join(room);
      this.memory.store(\`Voice client joined room: \${room}\`);console.log(\`[VoiceBridge] Joined room \${room}\`);
    });

    socket.on('signal', (payload) => {
      const { target, data } = payload;
      this.io.to(target).emit('signal', { from: socket.id, data });
    });

    socket.on('voice_data', (data) => {
      const { room, buffer } = data;
      socket.to(room).emit('voice_data', buffer);
      this.memory.store(\`Voice data relayed in room \${room}\`, { length: buffer.length });
    });

    socket.on('transcript', (text) => {
      const { room } = text;
      this.memory.store(\`Transcript (\${room}): \${text}\`);
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
      this.memory.store(\`Client left room: \${room}\`);
    });

    socket.on('disconnect', () => {
      this.memory.store(\`Socket disconnected: \${socket.id}\`);
      console.log('[VoiceBridge] Client disconnected:', socket.id);
    });
  }
}

export const voiceBridge = new VoiceBridge(8090);
console.log('[VoiceBridge] Ready for voice group sessions.');