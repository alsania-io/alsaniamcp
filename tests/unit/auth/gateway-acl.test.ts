import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { HTTPGateway } from "../../../src/transport/http-gateway";
import { AlsaniaMcp } from "../../../src/core/server";
import { MCPProxyManager } from "../../../src/proxy/mcp-proxy";
import { PermBits } from "../../../src/auth/acl";

// Minimal fake A2A so the constructor is satisfied without real sockets.
const fakeA2a: any = { on: () => {}, registerPeer: () => {}, broadcast: () => {} };

const SECRET = process.env.SESSION_SECRET || "default-secret";
const userToken = jwt.sign({ sub: "alice" }, SECRET);

describe("HTTPGateway — ACL enforcement on /gateway/:route", () => {
  let gateway: HTTPGateway;
  let app: express.Application;

  beforeEach(() => {
    const mcpServer = new AlsaniaMcp();
    const proxyManager = new MCPProxyManager(mcpServer);
    gateway = new HTTPGateway(mcpServer, proxyManager, fakeA2a, 0);
    app = (gateway as any).app;
    // Register a route that requires auth, targeting server 'eme'.
    gateway.addRoute("acl-test", {
      path: "/gateway/acl-test",
      targetServerId: "eme",
      method: "POST",
      requiresAuth: true,
    } as any);
  });

  const call = () =>
    request(app)
      .post("/gateway/acl-test")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ toolName: "doctor", args: {} });

  test("no token -> 401", async () => {
    const res = await request(app).post("/gateway/acl-test").send({});
    expect(res.status).toBe(401);
  });

  test("valid token, no ACL entries -> allowed (open behavior preserved)", async () => {
    // Route will 500/400 because the server isn't really connected, but NOT 401/403.
    const res = await call();
    expect([400, 500]).toContain(res.status);
    expect(res.status).not.toBe(403);
  });

  test("valid token, ACL entry denies CALL -> 403", async () => {
    // Grant only VIEW to someone else; alice gets nothing, but entry exists -> enforced.
    gateway.acl.grantPermission(
      { type: "user", id: "bob" },
      { type: "mcpServer", id: "eme" },
      { permBits: PermBits.VIEW },
    );
    const res = await call();
    expect(res.status).toBe(403);
  });

  test("valid token, alice granted CALL -> not 403", async () => {
    gateway.acl.grantPermission(
      { type: "user", id: "alice" },
      { type: "mcpServer", id: "eme" },
      { permBits: PermBits.CALL },
    );
    const res = await call();
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });

  test("public CALL grant allows any authenticated principal", async () => {
    gateway.acl.grantPermission(
      { type: "public" },
      { type: "mcpServer", id: "eme" },
      { permBits: PermBits.CALL },
    );
    const res = await call();
    expect(res.status).not.toBe(403);
  });
});
