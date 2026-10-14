import express from "express";
import request from "supertest";
import { HTTPGateway } from "../../../src/transport/http-gateway";
import { AlsaniaMcp } from "../../../src/core/server";
import { MCPProxyManager } from "../../../src/proxy/mcp-proxy";

const fakeA2a: any = { on: () => {}, registerPeer: () => {}, broadcast: () => {} };
const ADMIN = process.env.ADMIN_API_KEY || "alsania-admin";

describe("ACL admin API", () => {
  let app: express.Application;

  beforeEach(() => {
    const mcpServer = new AlsaniaMcp();
    const proxyManager = new MCPProxyManager(mcpServer);
    const gateway = new HTTPGateway(mcpServer, proxyManager, fakeA2a, 0);
    app = (gateway as any).app;
  });

  const admin = (r: request.Test) => r.set("x-api-key", ADMIN);

  test("rejects without admin key -> 401", async () => {
    const res = await request(app).post("/admin/acl/grant").send({ principal: { type: "user", id: "a" }, resource: { type: "tool", id: "x/y" }, permBits: 2 });
    expect(res.status).toBe(401);
  });

  test("grant -> list -> check -> revoke lifecycle", async () => {
    const principal = { type: "user", id: "alice" };
    const resource = { type: "tool", id: "git/status" };

    const grant = await admin(request(app).post("/admin/acl/grant")).send({ principal, resource, permBits: 2 });
    expect(grant.status).toBe(200);
    expect(grant.body.success).toBe(true);
    expect(grant.body.entry.permBits).toBe(2);

    const list = await admin(request(app).get("/admin/acl")).query({ resourceType: "tool", resourceId: "git/status" });
    expect(list.body.entries.length).toBe(1);

    const check = await admin(request(app).get("/admin/acl/check")).query({
      principalType: "user", principalId: "alice", resourceType: "tool", resourceId: "git/status", required: "2",
    });
    expect(check.body.allowed).toBe(true);

    const checkNo = await admin(request(app).get("/admin/acl/check")).query({
      principalType: "user", principalId: "bob", resourceType: "tool", resourceId: "git/status", required: "2",
    });
    expect(checkNo.body.allowed).toBe(false);

    const revoke = await admin(request(app).post("/admin/acl/revoke")).send({ principal, resource });
    expect(revoke.body.removed).toBe(1);

    const checkAfter = await admin(request(app).get("/admin/acl/check")).query({
      principalType: "user", principalId: "alice", resourceType: "tool", resourceId: "git/status", required: "2",
    });
    expect(checkAfter.body.allowed).toBe(false);
  });

  test("grant with role", async () => {
    await admin(request(app).post("/admin/acl/roles")).send({ id: "viewer", resourceType: "tool", permBits: 1 });
    const res = await admin(request(app).post("/admin/acl/grant")).send({
      principal: { type: "user", id: "carol" }, resource: { type: "tool", id: "gh/pr" }, roleId: "viewer",
    });
    expect(res.body.entry.permBits).toBe(1);
  });

  test("bad grant -> 400", async () => {
    const res = await admin(request(app).post("/admin/acl/grant")).send({ principal: { type: "user", id: "a" } });
    expect(res.status).toBe(400);
  });

  test("unknown role -> 400", async () => {
    const res = await admin(request(app).post("/admin/acl/grant")).send({
      principal: { type: "user", id: "a" }, resource: { type: "tool", id: "x/y" }, roleId: "nope",
    });
    expect(res.status).toBe(400);
  });
});
