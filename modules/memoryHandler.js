/**
 * memoryHandler.js
 * Handles caching and Qdrant persistence for agent communications and group logs.
 */

import fs from 'fs';
import path from 'path';
import { qdrantStore } from '../services/qdrant.js';

export class MemoryHandler {
  constructor(namespace = 'default') {
    this.namespace = namespace;
    this.cacheDir = path.resolve(\`./cache/\${namespace}\`);
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  store(text, metadata = {}) {
    const timestamp = new Date().toISOString();
    const record = { timestamp, text, metadata };
    const filePath = path.join(this.cacheDir, \`\${Date.now()}.json\`);
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2));try {
      qdrantStore({
        information: text,
        metadata: {
          namespace: this.namespace,
          timestamp,
          ...metadata
        }
      });
      console.log(\`[MemoryHandler] Stored to Qdrant (\${this.namespace})\`);
    } catch (err) {
      console.error('[MemoryHandler] Failed to push to Qdrant:', err);
    }
  }

  retrieve(limit = 10) {
    const files = fs.readdirSync(this.cacheDir).slice(-limit);
    const records = files.map(f => {
      const data = fs.readFileSync(path.join(this.cacheDir, f));
      return JSON.parse(data.toString());
    });
    return records;
  }

  clearCache() {
    fs.rmSync(this.cacheDir, { recursive: true, force: true });
    fs.mkdirSync(this.cacheDir, { recursive: true });
  }
}