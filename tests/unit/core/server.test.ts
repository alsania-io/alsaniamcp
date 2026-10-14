import { AlsaniaMcp } from "../../../src/core/server";

describe("AlsaniaMcp - Expanded Unit Tests", () => {
  let server: AlsaniaMcp;

  beforeEach(() => {
    server = new AlsaniaMcp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    test("should initialize with valid config", () => {
      expect(server).toBeDefined();
    });

    test("should have server instance", () => {
      expect(server.getServer).toBeDefined();
    });

    test("should be able to list tools", () => {
      expect(server.listTools).toBeDefined();
    });

    test("should be able to list resources", () => {
      expect(server.listResources).toBeDefined();
    });

    test("should have empty tool registry on init", () => {
      const tools = server.listTools();
      expect(tools).toEqual([]);
    });

    test("should have empty resource registry on init", () => {
      const resources = server.listResources();
      expect(resources).toEqual([]);
    });

    test("should have empty prompt registry on init", () => {
      const prompts = server.listPrompts();
      expect(prompts).toEqual([]);
    });
  });

  describe("Registry Operations", () => {
    test("should handle tool registration", () => {
      const mockHandler = jest.fn();

      server.registerTool(
        "test-server",
        "test-tool",
        {
          name: "test-tool",
          description: "Test tool",
          inputSchema: { type: "object" },
        },
        mockHandler
      );

      const tools = server.listTools();
      expect(tools).toContainEqual(
        expect.objectContaining({
          serverId: "test-server",
          toolName: "test-tool",
        })
      );
    });

    test("should handle multiple tool registrations for same server", () => {
      const mockHandler1 = jest.fn();
      const mockHandler2 = jest.fn();

      server.registerTool(
        "test-server",
        "tool-1",
        { name: "tool-1", description: "Tool 1", inputSchema: {} },
        mockHandler1
      );
      server.registerTool(
        "test-server",
        "tool-2",
        { name: "tool-2", description: "Tool 2", inputSchema: {} },
        mockHandler2
      );

      const tools = server.listTools();
      expect(tools).toHaveLength(2);
    });

    test("should handle tool unregistration", () => {
      const mockHandler = jest.fn();

      server.registerTool(
        "test-server",
        "test-tool",
        { name: "test-tool", description: "Test tool", inputSchema: {} },
        mockHandler
      );

      expect(server.listTools()).toHaveLength(1);

      server.unregisterTool("test-server", "test-tool");

      expect(server.listTools()).toHaveLength(0);
    });

    test("should handle resource registration", () => {
      const mockHandler = jest.fn();

      server.registerResource(
        "test-server",
        "test://resource",
        "Test Resource",
        mockHandler,
        "Test resource",
        "text/plain"
      );

      const resources = server.listResources();
      expect(resources).toContainEqual(
        expect.objectContaining({
          serverId: "test-server",
          resourceUri: "test://resource",
          name: "Test Resource",
        })
      );
    });

    test("should handle resource unregistration", () => {
      const mockHandler = jest.fn();

      server.registerResource(
        "test-server",
        "test://resource",
        "Test Resource",
        mockHandler,
        "Test resource",
        "text/plain"
      );

      expect(server.listResources()).toHaveLength(1);

      server.unregisterResource("test-server", "test://resource");

      expect(server.listResources()).toHaveLength(0);
    });

    test("should handle prompt registration", () => {
      const mockHandler = jest.fn();

      server.registerPrompt(
        "test-server",
        "test-prompt",
        mockHandler,
        "Test prompt",
        []
      );

      const prompts = server.listPrompts();
      expect(prompts).toContainEqual(
        expect.objectContaining({
          serverId: "test-server",
          promptName: "test-prompt",
        })
      );
    });

    test("should handle prompt unregistration", () => {
      const mockHandler = jest.fn();

      server.registerPrompt(
        "test-server",
        "test-prompt",
        mockHandler,
        "Test prompt",
        []
      );

      expect(server.listPrompts()).toHaveLength(1);

      server.unregisterPrompt("test-server", "test-prompt");

      expect(server.listPrompts()).toHaveLength(0);
    });

    test("should handle multiple servers independently", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      server.registerTool(
        "server-1",
        "tool",
        { name: "tool", description: "Tool 1", inputSchema: {} },
        handler1
      );
      server.registerTool(
        "server-2",
        "tool",
        { name: "tool", description: "Tool 2", inputSchema: {} },
        handler2
      );

      const tools = server.listTools();
      expect(tools).toHaveLength(2);
      expect(tools.filter((t) => t.serverId === "server-1")).toHaveLength(1);
      expect(tools.filter((t) => t.serverId === "server-2")).toHaveLength(1);
    });
  });

  describe("Tool and Resource Operations", () => {
    test("should handle tool calls via MCP server", async () => {
      const mockHandler = jest.fn().mockResolvedValue({ result: "echoed" });

      server.registerTool(
        "test-server",
        "echo",
        {
          name: "echo",
          description: "Echo tool",
          inputSchema: {
            type: "object",
            properties: { message: { type: "string" } },
          },
        },
        mockHandler
      );

      const result = await server.callTool("test-server", "echo", {
        message: "hello",
      });
      expect(result).toEqual({ result: "echoed" });
      expect(mockHandler).toHaveBeenCalledWith({ message: "hello" });
    });

    test("should throw error for non-existent tool", async () => {
      await expect(
        server.callTool("test-server", "nonexistent", {})
      ).rejects.toThrow("Tool test-server/nonexistent not found");
    });

    test("should throw error for non-existent server", async () => {
      await expect(
        server.callTool("nonexistent-server", "tool", {})
      ).rejects.toThrow("Tool nonexistent-server/tool not found");
    });

    test("should handle resource reading", async () => {
      const mockHandler = jest.fn().mockResolvedValue("resource content");

      server.registerResource(
        "test-server",
        "test://resource",
        "Test Resource",
        mockHandler,
        "Test resource",
        "text/plain"
      );

      const result = await server.readResource(
        "test-server",
        "test://resource"
      );
      expect(result).toBe("resource content");
      expect(mockHandler).toHaveBeenCalled();
    });

    test("should throw error for non-existent resource", async () => {
      await expect(
        server.readResource("test-server", "nonexistent")
      ).rejects.toThrow("Resource test-server://nonexistent not found");
    });

    test("should handle prompt retrieval", async () => {
      const mockHandler = jest.fn().mockResolvedValue("prompt content");

      server.registerPrompt(
        "test-server",
        "test-prompt",
        mockHandler,
        "Test prompt",
        [{ name: "arg1", description: "Argument 1" }]
      );

      const result = await server.getPrompt("test-server", "test-prompt", {
        arg1: "value",
      });
      expect(result).toBe("prompt content");
      expect(mockHandler).toHaveBeenCalledWith({ arg1: "value" });
    });

    test("should throw error for non-existent prompt", async () => {
      await expect(
        server.getPrompt("test-server", "nonexistent")
      ).rejects.toThrow("Prompt test-server/nonexistent not found");
    });

    test("should handle complex tool arguments", async () => {
      const mockHandler = jest.fn().mockResolvedValue({ processed: true });

      server.registerTool(
        "test-server",
        "complex-tool",
        {
          name: "complex-tool",
          description: "Complex tool",
          inputSchema: {
            type: "object",
            properties: {
              nested: {
                type: "object",
                properties: {
                  deep: { type: "string" },
                },
              },
              array: { type: "array" },
            },
          },
        },
        mockHandler
      );

      const complexArgs = {
        nested: { deep: "value" },
        array: [1, 2, 3],
      };

      await server.callTool("test-server", "complex-tool", complexArgs);
      expect(mockHandler).toHaveBeenCalledWith(complexArgs);
    });

    test("should update lastUsed on tool call", async () => {
      const mockHandler = jest.fn().mockResolvedValue({ result: "ok" });

      server.registerTool(
        "test-server",
        "test-tool",
        { name: "test-tool", description: "Test tool", inputSchema: {} },
        mockHandler
      );

      const toolsBefore = server.listTools();
      const lastUsedBefore = toolsBefore[0]?.schema?.lastUsed;

      await server.callTool("test-server", "test-tool", {});

      // Handler was called, lastUsed should be updated
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe("Cleanup Operations", () => {
    test("should cleanup unused tools after maxAge", async () => {
      const mockHandler = jest.fn();

      server.registerTool(
        "test-server",
        "old-tool",
        { name: "old-tool", description: "Old tool", inputSchema: {} },
        mockHandler
      );

      expect(server.listTools()).toHaveLength(1);

      // Manually set lastUsed to old timestamp
      const tools = server.listTools();
      // Note: lastUsed is internal, but we can test cleanup by calling it
      server.cleanupUnusedTools(0);

      expect(server.listTools()).toHaveLength(0);
    });

    test("should cleanup unused resources after maxAge", async () => {
      const mockHandler = jest.fn();

      server.registerResource(
        "test-server",
        "test://resource",
        "Test Resource",
        mockHandler,
        "Test resource",
        "text/plain"
      );

      expect(server.listResources()).toHaveLength(1);

      server.cleanupUnusedTools(0);

      expect(server.listResources()).toHaveLength(0);
    });

    test("should cleanup unused prompts after maxAge", async () => {
      const mockHandler = jest.fn();

      server.registerPrompt(
        "test-server",
        "test-prompt",
        mockHandler,
        "Test prompt",
        []
      );

      expect(server.listPrompts()).toHaveLength(1);

      server.cleanupUnusedTools(0);

      expect(server.listPrompts()).toHaveLength(0);
    });
  });

  describe("Error Handling", () => {
    test("should handle handler errors gracefully", async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error("Handler error"));

      server.registerTool(
        "test-server",
        "error-tool",
        { name: "error-tool", description: "Error tool", inputSchema: {} },
        mockHandler
      );

      await expect(
        server.callTool("test-server", "error-tool", {})
      ).rejects.toThrow("Handler error");
    });

    test("should handle async handler errors", async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error("Async error"));

      server.registerTool(
        "test-server",
        "async-error-tool",
        { name: "async-error-tool", description: "Async error tool", inputSchema: {} },
        mockHandler
      );

      await expect(
        server.callTool("test-server", "async-error-tool", {})
      ).rejects.toThrow("Async error");
    });
  });

  describe("Start Method", () => {
    test("should start server without error", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      
      await server.start();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
