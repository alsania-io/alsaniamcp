// Discovery tool registrar — jarvis `intelligent_tool_finder` concept port.
//
// Registers a built-in `discover_tools` tool so agents can search the live
// proxy's tool catalog by natural language, then invoke the hit via the
// normal proxy call path. Also exposes a `list_tool_catalog` companion.

import type { AlsaniaMcp } from "../core/server.js";
import { ToolDiscoveryIndex } from "./tool-index.js";

const SERVER_ID = "alsania-discovery";

export function registerDiscoveryTools(
  server: AlsaniaMcp,
  index: ToolDiscoveryIndex,
): void {
  server.registerTool(
    SERVER_ID,
    "discover_tools",
    {
      description:
        "Discover MCP tools by natural-language need. Returns the most relevant " +
        "tools (server + name + description + score) across all connected servers. " +
        "Use when unsure which tool does a task.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Natural language description of what you need to do.",
          },
          topN: {
            type: "number",
            description: "Max results to return (default 5).",
          },
        },
        required: ["query"],
      },
    },
    async (args: { query: string; topN?: number }) => {
      const hits = index.discover(args.query, args.topN ?? 5);
      return {
        query: args.query,
        count: hits.length,
        tools: hits,
      };
    },
  );
}
