// Auth middleware, register endpoint, and agent card additions for HTTPGateway
// Add these methods to the HTTPGateway class

import { randomBytes } from 'crypto';

interface ApiKeyInfo {
  id: string;
  name: string;
  createdAt: number;
  lastUsed?: number;
}

// Add to class properties:
// private apiKeys: Map<string, ApiKeyInfo> = new Map();

// Add this method to HTTPGateway:
private setupAuthMiddleware() {
  // Auth middleware for protected routes
  const protectRoute = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey || !this.apiKeys.has(apiKey)) {
      return res.status(401).json({
        error: 'Invalid or missing API key',
        message: 'Please provide a valid X-API-Key header'
      });
    }
    
    // Update last used timestamp
    const keyInfo = this.apiKeys.get(apiKey);
    if (keyInfo) {
      keyInfo.lastUsed = Date.now();
      this.apiKeys.set(apiKey, keyInfo);
    }
    
    next();
  };
  
  return protectRoute;
}

// Add register endpoint to setupRoutes():
this.app.post('/register', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const apiKey = randomBytes(32).toString('hex');
    this.apiKeys.set(apiKey, {
      id: apiKey.slice(0, 8),
      name,
      createdAt: Date.now()
    });
    
    res.json({
      success: true,
      api_key: apiKey,
      name,
      message: 'API key created successfully. Keep it secure!'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add list keys endpoint (admin only)
this.app.get('/keys', this.authMiddleware, async (req, res) => {
  const keys = Array.from(this.apiKeys.entries()).map(([key, info]) => ({
    key_prefix: key.slice(0, 8) + '...',
    ...info
  }));
  res.json({ keys });
});

// Add revoke endpoint
this.app.delete('/keys/:keyId', this.authMiddleware, async (req, res) => {
  const { keyId } = req.params;
  // Find key by prefix or full
  for (const [key, info] of this.apiKeys.entries()) {
    if (key.startsWith(keyId) || info.id === keyId) {
      this.apiKeys.delete(key);
      return res.json({ success: true, message: 'Key revoked' });
    }
  }
  res.status(404).json({ error: 'Key not found' });
});

// Add agent card endpoint
this.app.get('/.well-known/agent-card.json', async (req, res) => {
  const publicUrl = process.env.PUBLIC_URL || `https://sigma-lm.taila22628.ts.net`;
  
  res.json({
    name: "Aegis",
    description: "Alsania's strategic guardian and technical executor. Handles A2A communication, tool orchestration, and agent management.",
    version: "1.0.0",
    url: publicUrl,
    capabilities: {
      streaming: true,
      pushNotifications: false,
      tools: true,
      resources: true,
      prompts: true
    },
    skills: [
      { name: "agent_management", description: "Register, list, and manage A2A agents" },
      { name: "tool_execution", description: "Execute MCP tools from the registry" },
      { name: "task_management", description: "Create and manage tasks across agents" },
      { name: "memory_management", description: "Store and retrieve agent memories" },
      { name: "communication", description: "Send messages between agents" }
    ],
    defaultInputModes: ["text", "json"],
    defaultOutputModes: ["text", "json"],
    securitySchemes: {
      apiKey: {
        type: "apiKey",
        name: "X-API-Key",
        in: "header"
      }
    }
  });
});

// Then apply auth middleware to protected routes
// In setupRoutes, after adding routes, you can apply it selectively:
// this.app.use('/api', protectRoute); // or apply to specific routes
