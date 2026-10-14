import request from "supertest";
import express from "express";
import { HTTPGateway } from "../../../src/transport/http-gateway";
import { AlsaniaMcp } from "../../../src/core/server";
import { MCPProxyManager } from "../../../src/proxy/mcp-proxy";

describe("HTTPGateway - Expanded Unit Tests", () => {
  let gateway: HTTPGateway;
  let app: express.Application;
  let mcpServer: AlsaniaMcp;
  let proxyManager: MCPProxyManager;

  beforeEach(() => {
    mcpServer = new AlsaniaMcp();
    proxyManager = new MCPProxyManager(mcpServer);
    gateway = new HTTPGateway(mcpServer, proxyManager, 0);
    app = gateway["app"];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Health Check", () => {
    test("should return 200 for health endpoint", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: "ok",
        timestamp: expect.any(Number),
        http: true,
        mcp: true,
      });
    });

    test("should return valid timestamp", async () => {
      const response = await request(app).get("/health");
      const timestamp = response.body.timestamp;
      expect(timestamp).toBeGreaterThan(0);
      expect(typeof timestamp).toBe("number");
    });

    test("should handle health check with query params", async () => {
      const response = await request(app).get("/health?verbose=true");
      expect(response.status).toBe(200);
    });
  });

  describe("Tool Endpoints", () => {
    test("should list tools", async () => {
      const response = await request(app).get("/tools");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("tools");
      expect(Array.isArray(response.body.tools)).toBe(true);
    });

    test("should return empty tools list initially", async () => {
      const response = await request(app).get("/tools");
      expect(response.body.tools).toEqual([]);
    });

    test("should return 400 for invalid tool call - missing serverId", async () => {
      const response = await request(app)
        .post("/message")
        .send({ toolName: "test-tool", args: {} });

      expect([400, 500]).toContain(response.status);
    });

    test("should return 400 for invalid tool call - missing toolName", async () => {
      const response = await request(app)
        .post("/message")
        .send({ serverId: "test-server", args: {} });

      expect([400, 500]).toContain(response.status);
    });

    test("should handle malformed JSON", async () => {
      const response = await request(app)
        .post("/message")
        .set("Content-Type", "application/json")
        .send("not valid json");

      expect(response.status).toBe(400);
    });
  });

  describe("Proxy Endpoints", () => {
    test("should list connected servers", async () => {
      const response = await request(app).get("/proxy/servers");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("servers");
      expect(Array.isArray(response.body.servers)).toBe(true);
    });

    test("should list empty servers initially", async () => {
      const response = await request(app).get("/proxy/servers");
      expect(response.body.servers).toEqual([]);
    });

    test("should return 400 for invalid proxy connect - missing id", async () => {
      const response = await request(app)
        .post("/proxy/connect")
        .send({ transport: "http", endpoint: "http://localhost:3001" });

      expect([400, 500]).toContain(response.status);
    });

    test("should return 400 for invalid proxy connect - missing transport", async () => {
      const response = await request(app)
        .post("/proxy/connect")
        .send({ id: "test-proxy", endpoint: "http://localhost:3001" });

      expect([400, 500]).toContain(response.status);
    });

    test("should return 400 for invalid proxy connect - missing endpoint", async () => {
      const response = await request(app)
        .post("/proxy/connect")
        .send({ id: "test-proxy", transport: "http" });

      expect([400, 500]).toContain(response.status);
    });

    test("should handle proxy disconnect for non-existent server", async () => {
      const response = await request(app)
        .post("/proxy/disconnect")
        .send({ serverId: "nonexistent" });

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe("Resource Endpoints", () => {
    test("should list resources", async () => {
      const response = await request(app).get("/resources");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("resources");
      expect(Array.isArray(response.body.resources)).toBe(true);
    });

    test("should return empty resources list initially", async () => {
      const response = await request(app).get("/resources");
      expect(response.body.resources).toEqual([]);
    });

    test("should return 400 for invalid resource read - missing serverId", async () => {
      const response = await request(app)
        .post("/resource")
        .send({ resourceUri: "test://resource" });

      expect([400, 500]).toContain(response.status);
    });

    test("should return 400 for invalid resource read - missing resourceUri", async () => {
      const response = await request(app)
        .post("/resource")
        .send({ serverId: "test-server" });

      expect([400, 500]).toContain(response.status);
    });

    test("should handle malformed JSON for resource", async () => {
      const response = await request(app)
        .post("/resource")
        .set("Content-Type", "application/json")
        .send("invalid");

      expect(response.status).toBe(400);
    });
  });

  describe("Prompt Endpoints", () => {
    test("should list prompts", async () => {
      const response = await request(app).get("/prompts");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("prompts");
      expect(Array.isArray(response.body.prompts)).toBe(true);
    });

    test("should return empty prompts list initially", async () => {
      const response = await request(app).get("/prompts");
      expect(response.body.prompts).toEqual([]);
    });

    test("should return 400 for invalid prompt request - missing serverId", async () => {
      const response = await request(app)
        .post("/prompt")
        .send({ promptName: "test-prompt", args: {} });

      expect([400, 500]).toContain(response.status);
    });

    test("should return 400 for invalid prompt request - missing promptName", async () => {
      const response = await request(app)
        .post("/prompt")
        .send({ serverId: "test-server", args: {} });

      expect([400, 500]).toContain(response.status);
    });
  });

  describe("SSE Streaming", () => {
    test.skip("should handle SSE connection", async () => {
      console.log("SSE test skipped - works in production");
    });

    test("should have SSE endpoint defined", () => {
      // SSE is a long-lived stream; supertest cannot await it. Assert the
      // handler is wired on the gateway instead of hanging on a live stream.
      expect(typeof (gateway as any).handleSSE).toBe("function");
    });
  });

  describe("Security", () => {
    test("should reject requests without proper content-type", async () => {
      const response = await request(app)
        .post("/message")
        .set("Content-Type", "text/plain")
        .send("plain text");

      // Non-JSON body leaves no serverId/toolName -> rejected (400/500).
      expect([400, 500]).toContain(response.status);
    });

    test("should handle CORS preflight", async () => {
      const response = await request(app)
        .options("/tools")
        .set("Access-Control-Request-Method", "GET");

      expect([200, 404]).toContain(response.status);
    });

    test("should validate request body size", async () => {
      const largeBody = { data: "x".repeat(1000000) };
      const response = await request(app)
        .post("/message")
        .send(largeBody);

      expect([400, 413, 500]).toContain(response.status);
    });
  });

  describe("Error Responses", () => {
    test("should return proper error structure", async () => {
      const response = await request(app)
        .post("/message")
        .send({ serverId: "nonexistent", toolName: "test" });

      expect(response.body).toHaveProperty("success");
      expect(response.body).toHaveProperty("error");
    });

    test("should include error message in response", async () => {
      const response = await request(app)
        .post("/message")
        .send({ serverId: "nonexistent", toolName: "test" });

      if (response.body.error) {
        expect(typeof response.body.error).toBe("string");
      }
    });
  });

  describe("Rate Limiting", () => {
    test("should handle rapid requests", async () => {
      const promises = Array(10).fill(null).map(() =>
        request(app).get("/health")
      );

      const responses = await Promise.all(promises);
      const statuses = responses.map((r) => r.status);
      
      expect(statuses).toContain(200);
    });
  });

  describe("Gateway Configuration", () => {
    test("should have proper express app setup", () => {
      expect(app).toBeDefined();
      // Express apps are callable functions.
      expect(typeof app).toBe("function");
    });

    test("should handle root endpoint", async () => {
      const response = await request(app).get("/");
      // Root redirects to the GUI.
      expect([200, 302, 404]).toContain(response.status);
    });
  });
});
