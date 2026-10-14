/**
 * Simple tool loader for alsania-tools
 * Imports tools from @alsania/alsania-tools and registers them with AlsaniaMcp
 */

import { AlsaniaMcp } from './core/server.js';

export async function loadAndRegisterTools(mcpServer: AlsaniaMcp): Promise<void> {
  // Dynamic import - will only load if package exists
  let alsaniaTools: any = null;
  try {
    alsaniaTools = await import('@alsania/alsania-tools');
  } catch (e) {
    console.log('⚠️ @alsania/alsania-tools not installed - skipping tool loading');
    return;
  }

  if (!alsaniaTools) {
    console.log('⚠️ Skipping alsania-tools registration (package not available)');
    return;
  }

  let toolCount = 0;

  // Get all tool modules (agent, memory, system, etc.)
  const categories = ['agent', 'memory', 'system', 'web', 'mobile', 'data', 'ai', 'code', 'media', 'cloud', 'comm', 'skills', 'utils'];

  for (const category of categories) {
    const tools = (alsaniaTools as any)[category];
    if (!tools) continue;

    // Get all tool functions from this category
    const toolNames = Object.keys(tools).filter(key => typeof tools[key] === 'function');

    for (const toolName of toolNames) {
      const toolFn = tools[toolName];
      
      // Register with mcpServer
      mcpServer.registerTool(
        category,  // serverId
        toolName,  // toolName
        {
          description: `Tool: ${toolName} (from ${category})`,
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        async (args: any) => {
          try {
            // Call the actual tool function (which routes to mcpnyx-u)
            return await toolFn(args);
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        }
      );
      toolCount++;
    }
  }

  console.log(`✅ Loaded ${toolCount} tools from alsania-tools package`);
}