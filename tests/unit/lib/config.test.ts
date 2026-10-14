import {
  ConfigSchema,
  McpServerConfigSchema,
  Config,
  McpServerConfig,
  detectServerType,
  loadConfig,
} from "../../../src/lib/config";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("Config Module", () => {
  let tempConfigFile: string;

  beforeEach(() => {
    // Create a temporary config file for testing
    tempConfigFile = path.join(os.tmpdir(), `test-config-${Date.now()}.json`);
  });

  afterEach(() => {
    if (fs.existsSync(tempConfigFile)) {
      fs.unlinkSync(tempConfigFile);
    }
    jest.clearAllMocks();
  });

  describe("McpServerConfigSchema", () => {
    test("should validate valid stdio server config", () => {
      const config: McpServerConfig = {
        name: "test-server",
        type: "stdio",
        command: "npx",
        args: ["-y", "test-server"],
      };

      const result = McpServerConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test("should validate valid SSE server config", () => {
      const config: McpServerConfig = {
        name: "sse-server",
        type: "sse",
        url: "http://localhost:3000/sse",
      };

      const result = McpServerConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test("should validate valid streamable-http server config", () => {
      const config: McpServerConfig = {
        name: "http-server",
        type: "streamable-http",
        url: "http://localhost:3000/mcp",
      };

      const result = McpServerConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test("should validate config with environment variables", () => {
      const config: McpServerConfig = {
        name: "env-server",
        type: "stdio",
        command: "node",
        env: {
          NODE_ENV: "test",
          API_KEY: "secret",
        },
      };

      const result = McpServerConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test("should validate config with headers", () => {
      const config: McpServerConfig = {
        name: "header-server",
        url: "http://localhost:3000/mcp",
        headers: {
          Authorization: "Bearer token",
          "X-Custom-Header": "value",
        },
      };

      const result = McpServerConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test("should reject invalid server type", () => {
      const config: McpServerConfig = {
        name: "invalid-server",
        type: "invalid" as any,
      };

      const result = McpServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    test("should allow optional name", () => {
      const config: McpServerConfig = {
        type: "stdio",
        command: "npx",
      };

      const result = McpServerConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test("should allow empty config with all optional fields", () => {
      const config: McpServerConfig = {};

      const result = McpServerConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe("ConfigSchema", () => {
    test("should validate full config with multiple servers", () => {
      const config: Config = {
        mcpServers: {
          "server-1": {
            name: "Server 1",
            type: "stdio",
            command: "npx",
            args: ["-y", "server-1"],
          },
          "server-2": {
            name: "Server 2",
            type: "streamable-http",
            url: "http://localhost:3001/mcp",
          },
        },
      };

      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test("should validate empty mcpServers", () => {
      const config: Config = {
        mcpServers: {},
      };

      const result = ConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test("should reject non-record mcpServers", () => {
      const invalidConfig = {
        mcpServers: "not an object",
      };

      const result = ConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe("detectServerType", () => {
    test("should return explicit type when provided", () => {
      const config: McpServerConfig = {
        type: "stdio",
      };

      expect(detectServerType(config)).toBe("stdio");
    });

    test("should detect streamable-http from /mcp path", () => {
      const config: McpServerConfig = {
        url: "http://localhost:3000/mcp",
      };

      expect(detectServerType(config)).toBe("streamable-http");
    });

    test("should detect streamable-http from /mcp path with query", () => {
      const config: McpServerConfig = {
        url: "http://localhost:3000/mcp?token=abc",
      };

      expect(detectServerType(config)).toBe("streamable-http");
    });

    test("should detect sse from /sse path", () => {
      const config: McpServerConfig = {
        url: "http://localhost:3000/sse",
      };

      expect(detectServerType(config)).toBe("sse");
    });

    test("should detect sse from /sse path in longer path", () => {
      const config: McpServerConfig = {
        url: "http://localhost:3000/api/sse",
      };

      expect(detectServerType(config)).toBe("sse");
    });

    test("should default to streamable-http for unrecognized HTTP URLs", () => {
      const config: McpServerConfig = {
        url: "http://localhost:3000/api",
      };

      expect(detectServerType(config)).toBe("streamable-http");
    });

    test("should default to streamable-http for invalid URL", () => {
      const config: McpServerConfig = {
        url: "not-a-valid-url",
      };

      expect(detectServerType(config)).toBe("streamable-http");
    });

    test("should detect stdio when command is present", () => {
      const config: McpServerConfig = {
        command: "npx",
      };

      expect(detectServerType(config)).toBe("stdio");
    });

    test("should throw when no type can be detected", () => {
      const config: McpServerConfig = {
        name: "test",
      };

      expect(() => detectServerType(config)).toThrow(
        "Cannot detect server type for test. Please specify type explicitly."
      );
    });
  });

  describe("loadConfig", () => {
    test("should load valid JSON config", () => {
      const configData = {
        mcpServers: {
          "test-server": {
            name: "Test Server",
            type: "stdio",
            command: "npx",
            args: ["-y", "test-server"],
          },
        },
      };

      fs.writeFileSync(tempConfigFile, JSON.stringify(configData));

      const result = loadConfig(tempConfigFile);
      expect(result).toEqual(configData);
    });

    test("should throw on non-existent file", () => {
      expect(() => loadConfig("/non/existent/path.json")).toThrow(
        "Failed to load config"
      );
    });

    test("should throw on invalid JSON", () => {
      fs.writeFileSync(tempConfigFile, "{ invalid json }");

      expect(() => loadConfig(tempConfigFile)).toThrow("Invalid JSON");
    });

    test("should throw on invalid config schema", () => {
      const invalidConfig = {
        mcpServers: {
          "test-server": {
            name: "Test",
            type: "invalid-type",
          },
        },
      };

      fs.writeFileSync(tempConfigFile, JSON.stringify(invalidConfig));

      expect(() => loadConfig(tempConfigFile)).toThrow("Invalid config format");
    });

    test("should load config with multiple servers", () => {
      const configData = {
        mcpServers: {
          server1: { type: "stdio", command: "node", args: ["server1.js"] },
          server2: { type: "streamable-http", url: "http://localhost:3001/mcp" },
          server3: { type: "sse", url: "http://localhost:3002/sse" },
        },
      };

      fs.writeFileSync(tempConfigFile, JSON.stringify(configData));

      const result = loadConfig(tempConfigFile);
      expect(Object.keys(result.mcpServers)).toHaveLength(3);
    });

    test("should load config with environment variables", () => {
      const configData = {
        mcpServers: {
          server: {
            type: "stdio",
            command: "node",
            env: {
              NODE_ENV: "test",
              DEBUG: "true",
            },
          },
        },
      };

      fs.writeFileSync(tempConfigFile, JSON.stringify(configData));

      const result = loadConfig(tempConfigFile);
      expect(result.mcpServers.server.env).toEqual({
        NODE_ENV: "test",
        DEBUG: "true",
      });
    });

    test("should load config with headers", () => {
      const configData = {
        mcpServers: {
          server: {
            type: "streamable-http",
            url: "http://localhost:3000/mcp",
            headers: {
              Authorization: "Bearer token123",
            },
          },
        },
      };

      fs.writeFileSync(tempConfigFile, JSON.stringify(configData));

      const result = loadConfig(tempConfigFile);
      expect(result.mcpServers.server.headers).toEqual({
        Authorization: "Bearer token123",
      });
    });
  });
});
